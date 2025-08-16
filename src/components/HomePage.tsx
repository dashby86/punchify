import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useDropzone } from 'react-dropzone'
import { FiCamera, FiVideo, FiMic, FiUpload, FiX, FiSettings, FiChevronLeft } from 'react-icons/fi'
import { v4 as uuidv4 } from 'uuid'
import { analyzeTaskFromMedia, getOpenAIClient } from '@/lib/openai'
import { saveTask, type MediaFile as StoredMediaFile } from '@/lib/storage'
import { extractLocationFromImage, formatLocation } from '@/lib/exif'
import { ProcessingOverlay } from './LoadingSpinner'
import { ToastContainer, useToast } from './Toast'
import { 
  saveMediaToSession, 
  loadMediaFromSession, 
  clearMediaSession, 
  hasMediaInSession,
  base64ToFile
} from '@/lib/session'

interface MediaFile {
  file: File
  preview: string
  type: 'image' | 'video' | 'audio'
  name: string
}

export default function HomePage() {
  const navigate = useNavigate()
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [apiKey, setApiKey] = useState(() => 
    localStorage.getItem('openai_api_key') || ''
  )
  const [showSettings, setShowSettings] = useState(false)
  const { toasts, removeToast, success, error, warning, info } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  // Load persisted media on mount and cleanup on unmount
  useEffect(() => {
    const loadPersistedMedia = () => {
      const persistedMedia = loadMediaFromSession()
      if (persistedMedia.length > 0) {
        const restoredFiles = persistedMedia.map(persisted => {
          const file = base64ToFile(persisted.base64, persisted.name, persisted.lastModified)
          return {
            file,
            preview: persisted.base64,
            type: persisted.type,
            name: persisted.name
          }
        })
        setMediaFiles(restoredFiles)
        info('Session restored', `Restored ${persistedMedia.length} uploaded file(s)`)
      }
    }

    loadPersistedMedia()

    return () => {
      mediaFiles.forEach(media => {
        if (media.preview && media.preview.startsWith('blob:')) {
          URL.revokeObjectURL(media.preview)
        }
      })
    }
  }, [info])

  // Save media to session storage whenever mediaFiles changes
  useEffect(() => {
    if (mediaFiles.length > 0) {
      const filesToSave = mediaFiles.map(media => ({
        file: media.file,
        type: media.type
      }))
      saveMediaToSession(filesToSave)
    } else {
      clearMediaSession()
    }
  }, [mediaFiles])

  // Warn user before leaving if they have uploaded media
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasMediaInSession() && !isProcessing) {
        e.preventDefault()
        e.returnValue = 'You have uploaded media that will be lost. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isProcessing])

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(f => f.errors[0]?.message || 'Invalid file').join(', ')
      error('Files rejected', errors)
    }

    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' as const : 
              file.type.startsWith('audio/') ? 'audio' as const : 'image' as const,
        name: file.name
      }))
      setMediaFiles(prev => [...prev, ...newFiles])
      success(`Added ${acceptedFiles.length} file(s)`)
    }
  }, [success, error])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac']
    },
    maxFiles: 10,
    multiple: true,
    noClick: true,
    disabled: false
  })

  const removeFile = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index)
      // Clean up the object URL for the removed file
      if (prev[index]?.preview) {
        URL.revokeObjectURL(prev[index].preview)
      }
      return newFiles
    })
  }

  const handleSaveApiKey = () => {
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      error('Invalid API Key', 'Please enter a valid OpenAI API key')
      return
    }
    localStorage.setItem('openai_api_key', apiKey)
    setShowSettings(false)
    success('Settings saved', 'Your OpenAI API key has been saved')
  }

  const handleCameraCapture = () => {
    cameraInputRef.current?.click()
  }

  const handleVideoCapture = () => {
    videoInputRef.current?.click()
  }

  const handleAudioCapture = () => {
    audioInputRef.current?.click()
  }

  const handleUploadExisting = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    onDrop(files, [])  // Pass empty array for rejected files
    // Reset the input value to allow re-selecting the same file
    event.target.value = ''
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleSubmit = async () => {
    if (mediaFiles.length === 0) {
      warning('No files selected', 'Please upload at least one photo, video, or audio file')
      return
    }

    try {
      getOpenAIClient()
    } catch (err) {
      error('API Key Required', 'Please set your OpenAI API key in settings')
      setShowSettings(true)
      return
    }

    setIsProcessing(true)
    setProcessingStep('Preparing media files...')
    
    try {
      const mediaData: StoredMediaFile[] = await Promise.all(
        mediaFiles.map(async (media) => {
          const base64 = await fileToBase64(media.file)
          return {
            url: base64,
            type: media.type,
          }
        })
      )

      // Prepare media inputs with actual base64 data for GPT-4 Vision
      setProcessingStep('Encoding media files...')
      const mediaInputs = await Promise.all(
        mediaFiles.map(async (media) => {
          const base64 = await fileToBase64(media.file)
          return {
            base64,
            type: media.type,
            description: media.type === 'video' 
              ? `A video showing work that needs to be done (${media.file.name})`
              : media.type === 'audio'
              ? `An audio recording describing work that needs to be done (${media.file.name})`
              : undefined
          }
        })
      )

      setProcessingStep('Analyzing with AI...')
      const taskData = await analyzeTaskFromMedia(mediaInputs)
      
      // Try to extract location from images
      setProcessingStep('Extracting location data...')
      let extractedLocation = null
      for (const media of mediaFiles) {
        if (media.type === 'image') {
          const locationData = await extractLocationFromImage(media.file)
          if (locationData) {
            extractedLocation = formatLocation(locationData)
            info('Location detected', `Found GPS coordinates in image`)
            break // Use the first image with location data
          }
        }
      }
      
      const taskId = uuidv4()
      const task = {
        id: taskId,
        ...taskData,
        // Use extracted location if AI didn't detect one
        location: taskData.location || extractedLocation || 'Not specified',
        media: mediaData,
        createdAt: new Date().toISOString(),
        status: 'draft' as const
      }

      setProcessingStep('Saving task...')
      saveTask(task)
      
      // Clear session storage since task was successfully created
      clearMediaSession()
      
      success('Task created!', 'Your task has been generated successfully')
      navigate({ to: '/task/$taskId', params: { taskId } })
    } catch (err: any) {
      console.error('Error processing task:', err)
      
      let errorMessage = 'An unexpected error occurred'
      if (err.message?.includes('rate limit')) {
        errorMessage = 'API rate limit reached. Please wait a moment and try again.'
      } else if (err.message?.includes('API key')) {
        errorMessage = 'Invalid API key. Please check your settings.'
      } else if (err.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      error('Failed to process task', errorMessage)
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Processing Overlay */}
      {isProcessing && (
        <ProcessingOverlay text={processingStep || 'Processing...'} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <Link to="/" className="p-1">
          <FiChevronLeft className="w-6 h-6 text-gray-400" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-blue-500 rounded"></div>
          <span className="text-lg font-semibold">AI Task Creator</span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1"
        >
          <FiSettings className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      <div className="p-4">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-red-900/30 to-blue-900/30 border border-red-500/20 rounded-xl p-4 mb-6">
          <p className="text-center text-sm">
            Upload visual/audio content with as much detail as possible and AI will analyze it to create a detailed ticket in seconds
          </p>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
            <h3 className="font-semibold text-white mb-3">Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSaveApiKey}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* Create Content Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Create your content</h2>
          
          {/* Capture Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={handleCameraCapture}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-gray-750 transition-colors"
            >
              <FiCamera className="w-8 h-8 mb-2 text-gray-300" />
              <span className="text-sm text-gray-300">Photo</span>
            </button>
            
            <button
              onClick={handleVideoCapture}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-gray-750 transition-colors"
            >
              <FiVideo className="w-8 h-8 mb-2 text-gray-300" />
              <span className="text-sm text-gray-300">Video</span>
            </button>
            
            <button
              onClick={handleAudioCapture}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-gray-750 transition-colors"
            >
              <FiMic className="w-8 h-8 mb-2 text-gray-300" />
              <span className="text-sm text-gray-300">Audio</span>
            </button>
          </div>

          {/* Upload Existing Button */}
          <button
            onClick={handleUploadExisting}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-gray-750 transition-colors mb-4"
          >
            <FiUpload className="w-5 h-5 text-gray-300" />
            <span className="text-gray-300">Upload existing</span>
          </button>

          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
              ${isDragActive 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 bg-gray-800/50'
              }
            `}
          >
            <input {...getInputProps()} />
            <p className="text-gray-400 text-sm">
              {mediaFiles.length === 0 
                ? 'Uploaded content will appear here'
                : `${mediaFiles.length} file(s) uploaded`
              }
            </p>
          </div>

          {/* Uploaded Files */}
          {mediaFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {mediaFiles.map((media, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between bg-gray-800 rounded-lg p-3 border border-gray-700 animate-slideIn hover:border-gray-600 transition-all"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {media.type === 'image' && <FiCamera className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                    {media.type === 'video' && <FiVideo className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                    {media.type === 'audio' && <FiMic className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                    <span className="text-sm text-gray-300 truncate flex-1 min-w-0" title={media.name}>
                      {media.name}
                    </span>
                    {media.type === 'audio' && (
                      <span className="text-xs text-gray-500 flex-shrink-0">Audio</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-gray-400 hover:text-red-400 ml-2 flex-shrink-0"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discard Button */}
        <button
          onClick={() => {
            // Clean up object URLs to prevent memory leaks
            mediaFiles.forEach(media => {
              if (media.preview && media.preview.startsWith('blob:')) {
                URL.revokeObjectURL(media.preview)
              }
            })
            setMediaFiles([])
            clearMediaSession()
            // Reset all file inputs
            if (fileInputRef.current) fileInputRef.current.value = ''
            if (cameraInputRef.current) cameraInputRef.current.value = ''
            if (videoInputRef.current) videoInputRef.current.value = ''
            if (audioInputRef.current) audioInputRef.current.value = ''
            
            success('Files cleared', 'All uploaded files have been removed')
          }}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-gray-750 transition-colors mb-4"
          disabled={mediaFiles.length === 0}
        >
          <FiX className="w-5 h-5 text-gray-400" />
          <span className="text-gray-400">Discard</span>
        </button>

        {/* Generate Ticket Button */}
        <button
          onClick={handleSubmit}
          disabled={mediaFiles.length === 0 || isProcessing}
          className={`
            w-full py-4 px-6 rounded-xl font-semibold
            transition-all duration-200 flex items-center justify-center gap-2
            ${mediaFiles.length === 0 || isProcessing
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-red-600 to-blue-600 text-white hover:from-red-700 hover:to-blue-700'
            }
          `}
        >
          <>
            <div className="w-5 h-5 bg-gradient-to-r from-red-400 to-blue-400 rounded"></div>
            Generate Ticket
          </>
        </button>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}