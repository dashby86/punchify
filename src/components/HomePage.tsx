import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { useDropzone } from 'react-dropzone'
import { FiCamera, FiVideo, FiUpload, FiX, FiChevronLeft } from 'react-icons/fi'
import { v4 as uuidv4 } from 'uuid'
import { analyzeTaskFromMedia, getOpenAIClient, transcribeAudio } from '@/lib/openai'
import { saveTask, type MediaFile as StoredMediaFile } from '@/lib/storage'
import { extractLocationFromImage, formatLocation } from '@/lib/exif'
import { optimizeMediaFile, getFileSizeKB, extractVideoFrames } from '@/lib/compress'
import { storeVideoWithFallback } from '@/lib/videoStorage'
import { ProcessingOverlay } from './LoadingSpinner'
import { ToastContainer, useToast } from './Toast'
// Session storage removed - would be better implemented with backend + CDN

interface MediaFile {
  file: File
  preview: string
  type: 'image' | 'video'
  name: string
}

export default function HomePage() {
  const navigate = useNavigate()
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  // API key is now handled via environment variables
  const { toasts, removeToast, success, error, warning, info } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Cleanup object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      mediaFiles.forEach(media => {
        if (media.preview && media.preview.startsWith('blob:')) {
          URL.revokeObjectURL(media.preview)
        }
      })
    }
  }, [mediaFiles])

  // Warn user before leaving if they have uploaded media
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (mediaFiles.length > 0 && !isProcessing) {
        e.preventDefault()
        e.returnValue = 'You have uploaded media that will be lost. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [mediaFiles.length, isProcessing])

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(f => f.errors[0]?.message || 'Invalid file').join(', ')
      error('Files rejected', errors)
    }

    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
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
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
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

  // API key handling removed - now using environment variables

  const handleCameraCapture = (e?: React.MouseEvent) => {
    e?.preventDefault()
    cameraInputRef.current?.click()
  }

  const handleVideoCapture = (e?: React.MouseEvent) => {
    e?.preventDefault()
    videoInputRef.current?.click()
  }


  const handleUploadExisting = (e?: React.MouseEvent) => {
    e?.preventDefault()
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault() // Prevent any form submission
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
      error('API Key Required', 'Please check your OpenAI API key configuration')
      return
    }

    setIsProcessing(true)
    setProcessingStep('Preparing media files...')
    
    try {
      // Generate task ID early so we can use it for video storage
      const taskId = uuidv4()
      
      setProcessingStep('Processing media files...')
      const mediaData: StoredMediaFile[] = await Promise.all(
        mediaFiles.map(async (media) => {
          let transcript: string | undefined
          
          // Transcribe video files
          if (media.type === 'video') {
            try {
              setProcessingStep(`Transcribing ${media.type}...`)
              transcript = await transcribeAudio(media.file)
              info('Transcription complete', `Generated transcript for ${media.name}`)
            } catch (error) {
              console.error('Transcription failed:', error)
              warning('Transcription failed', `Could not transcribe ${media.name}`)
            }
          }
          
          setProcessingStep('Processing media files...')
          let processedUrl: string
          let isPlayable = false
          
          if (media.type === 'video') {
            // Store video for playback using IndexedDB
            setProcessingStep('Storing video for playback...')
            const videoResult = await storeVideoWithFallback(media.file, taskId)
            processedUrl = videoResult.url
            isPlayable = videoResult.isPlayable
            
            const videoSizeMB = media.file.size / (1024 * 1024)
            if (isPlayable) {
              success('Video stored', `${videoSizeMB.toFixed(1)}MB video saved for playback`)
            } else {
              warning('Video compressed', `${videoSizeMB.toFixed(1)}MB video saved as thumbnail only`)
            }
          } else {
            // For images, always compress
            processedUrl = await optimizeMediaFile(media.file, media.type)
            const sizeKB = getFileSizeKB(processedUrl)
            console.log(`Compressed image ${media.name}: ${sizeKB}KB`)
          }
          
          console.log(`Transcript for ${media.name}:`, transcript)
          return {
            url: processedUrl,
            type: media.type,
            transcript,
            isPlayable // Add flag to indicate if video is playable
          } as StoredMediaFile
        })
      )

      // Prepare media inputs for GPT-4 Vision analysis
      setProcessingStep('Preparing AI analysis...')
      const allMediaInputs: any[] = []
      
      for (let index = 0; index < mediaFiles.length; index++) {
        const media = mediaFiles[index]
        
        if (media.type === 'video') {
          // For videos, extract multiple frames for better analysis
          setProcessingStep(`Analyzing video frames...`)
          const frames = await extractVideoFrames(media.file, 3) // Get 3 frames for AI
          
          const transcript = mediaData[index]?.transcript
          
          // If there's a transcript, add it as a separate text input first
          if (transcript) {
            console.log('Adding transcript to AI analysis:', transcript)
            allMediaInputs.push({
              base64: '', // No image for transcript
              type: 'text' as const,
              description: `IMPORTANT - Video Audio Transcript: The person in the video says: "${transcript}". This describes the actual problem that needs to be fixed.`
            })
          }
          
          // Add each frame as a separate image for AI analysis
          frames.forEach((frame, frameIndex) => {
            allMediaInputs.push({
              base64: frame,
              type: 'image' as const,
              description: `Frame ${frameIndex + 1} of 3 from video "${media.file.name}"`
            })
          })
        } else {
          // For images, use compressed version
          const base64 = await optimizeMediaFile(media.file, media.type)
          allMediaInputs.push({
            base64,
            type: media.type,
            description: undefined
          })
        }
      }

      setProcessingStep('Analyzing with AI...')
      const taskData = await analyzeTaskFromMedia(allMediaInputs)
      
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
      
      const task = {
        id: taskId, // Use the pre-generated taskId
        ...taskData,
        // Use extracted location if AI didn't detect one
        location: taskData.location || extractedLocation || 'Not specified',
        media: mediaData,
        createdAt: new Date().toISOString(),
        status: 'draft' as const
      }

      setProcessingStep('Saving task...')
      try {
        saveTask(task)
        success('Task created!', 'Your task has been generated successfully')
        navigate({ to: '/task/$taskId', params: { taskId } })
      } catch (saveError: any) {
        if (saveError.message?.includes('storage full')) {
          warning('Task saved', 'Media files too large for storage - task saved without images')
          navigate({ to: '/task/$taskId', params: { taskId } })
        } else {
          throw saveError
        }
      }
    } catch (err: any) {
      console.error('Error processing task:', err)
      
      let errorMessage = 'An unexpected error occurred'
      if (err.message?.includes('rate limit')) {
        errorMessage = 'API rate limit reached. Please wait a moment and try again.'
      } else if (err.message?.includes('API key')) {
        errorMessage = 'Invalid API key. Please check your settings.'
      } else if (err.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.'
      } else if (err.message?.includes('JSON')) {
        errorMessage = 'AI response format error. Please try again.'
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
        <div className="w-6"></div> {/* Spacer for symmetry */}
      </div>

      <div className="p-4">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-red-900/30 to-blue-900/30 border border-red-500/20 rounded-xl p-4 mb-6">
          <p className="text-center text-sm">
            Upload photos and videos with as much detail as possible and AI will analyze them to create a detailed ticket in seconds
          </p>
        </div>


        {/* Create Content Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Create your content</h2>
          
          {/* Capture Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
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
                    <span className="text-sm text-gray-300 truncate flex-1 min-w-0" title={media.name}>
                      {media.name}
                    </span>
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
            // Reset all file inputs
            if (fileInputRef.current) fileInputRef.current.value = ''
            if (cameraInputRef.current) cameraInputRef.current.value = ''
            if (videoInputRef.current) videoInputRef.current.value = ''
            
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
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}