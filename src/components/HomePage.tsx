import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDropzone } from 'react-dropzone'
import { FiCamera, FiVideo, FiUpload, FiX, FiSettings } from 'react-icons/fi'
import { v4 as uuidv4 } from 'uuid'
import { analyzeTaskFromMedia, getOpenAIClient } from '@/lib/openai'
import { saveTask, type MediaFile as StoredMediaFile } from '@/lib/storage'

interface MediaFile {
  file: File
  preview: string
  type: 'image' | 'video'
}

export default function HomePage() {
  const navigate = useNavigate()
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [apiKey, setApiKey] = useState(() => 
    localStorage.getItem('openai_api_key') || ''
  )
  const [showSettings, setShowSettings] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const
    }))
    setMediaFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    maxFiles: 10,
    multiple: true
  })

  const removeFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSaveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey)
    setShowSettings(false)
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
    if (mediaFiles.length === 0) return

    try {
      getOpenAIClient()
    } catch (error) {
      alert('Please set your OpenAI API key in settings')
      setShowSettings(true)
      return
    }

    setIsProcessing(true)
    
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

      const mediaDescriptions = mediaFiles.map((media, i) => {
        if (media.type === 'video') {
          return `Video ${i + 1}: A video showing work that needs to be done (${media.file.name})`
        }
        return `Image ${i + 1}: A photo showing an area or item that needs repair or maintenance (${media.file.name})`
      })

      const taskData = await analyzeTaskFromMedia(mediaDescriptions)
      
      const taskId = uuidv4()
      const task = {
        id: taskId,
        ...taskData,
        media: mediaData,
        createdAt: new Date().toISOString()
      }

      saveTask(task)
      navigate({ to: `/task/${taskId}` })
    } catch (error) {
      console.error('Error processing task:', error)
      alert('Failed to process task. Please check your API key and try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8">
        <header className="text-center mb-8 relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="absolute right-0 top-0 p-2 text-gray-600 hover:text-gray-900"
          >
            <FiSettings className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Creator</h1>
          <p className="text-gray-600">Upload photos or videos to create a detailed task</p>
        </header>

        {showSettings && (
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200 mb-6
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 bg-white'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex justify-center gap-4 mb-4">
            <FiCamera className="w-8 h-8 text-gray-400" />
            <FiVideo className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-2">
            {isDragActive 
              ? 'Drop your files here...' 
              : 'Drag & drop photos or videos here'
            }
          </p>
          <p className="text-sm text-gray-500">or click to select files</p>
          <p className="text-xs text-gray-400 mt-2">Max 15 seconds for videos</p>
        </div>

        {mediaFiles.length > 0 && (
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">
              Uploaded Files ({mediaFiles.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {mediaFiles.map((media, index) => (
                <div key={index} className="relative group">
                  {media.type === 'image' ? (
                    <img 
                      src={media.preview} 
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="relative w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FiVideo className="w-8 h-8 text-gray-400" />
                      <video 
                        src={media.preview} 
                        className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-50"
                        muted
                      />
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={mediaFiles.length === 0 || isProcessing}
          className={`
            w-full py-4 px-6 rounded-xl font-semibold text-white
            transition-all duration-200 flex items-center justify-center gap-2
            ${mediaFiles.length === 0 || isProcessing
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }
          `}
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing with AI...
            </>
          ) : (
            <>
              <FiUpload className="w-5 h-5" />
              Create Task
            </>
          )}
        </button>
      </div>
    </div>
  )
}