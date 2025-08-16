import { useState, useEffect } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { FiMapPin, FiUser, FiArrowLeft, FiCamera, FiVideo, FiMic, FiShare2, FiExternalLink } from 'react-icons/fi'
import { getTask, type Task } from '@/lib/storage'
import { shareTask } from '@/lib/share'

export default function SharedTaskView() {
  const { taskId } = useParams({ from: '/shared/$taskId' })
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageExpanded, setImageExpanded] = useState<number | null>(null)

  useEffect(() => {
    const fetchedTask = getTask(taskId)
    setTask(fetchedTask)
    setLoading(false)
  }, [taskId])

  const handleShare = async () => {
    if (task) {
      await shareTask(task)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading task details...</p>
        </div>
      </div>
    )
  }

  if (!task || task.status !== 'published') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiArrowLeft className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Task Not Found</h2>
          <p className="text-gray-600 mb-6">This task may have been removed or is not publicly available.</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Go to App
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-blue-500 rounded"></div>
            <h1 className="text-lg font-semibold text-gray-900">Task Details</h1>
          </div>
          <button
            onClick={handleShare}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            title="Share task"
          >
            <FiShare2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Media Gallery */}
        {task.media && task.media.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 gap-2 p-2">
              {task.media.map((media, index) => (
                <div 
                  key={index} 
                  className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setImageExpanded(index)}
                >
                  {media.type === 'image' ? (
                    <img 
                      src={media.url} 
                      alt={`Task image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : media.type === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <video 
                        src={media.url}
                        className="w-full h-full object-cover"
                        controls
                        playsInline
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                      <FiMic className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Audio {index + 1}</span>
                      <audio 
                        src={media.url} 
                        controls 
                        className="mt-2 w-full px-4"
                      />
                    </div>
                  )}
                  
                  {media.type !== 'audio' && (
                    <div className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                      {media.type === 'image' ? (
                        <FiCamera className="w-4 h-4 text-white" />
                      ) : (
                        <FiVideo className="w-4 h-4 text-white" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Title & Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{task.title}</h2>
          <p className="text-gray-600 leading-relaxed">{task.summary}</p>
        </div>

        {/* Task Description */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
        </div>

        {/* Task Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <FiMapPin className="w-4 h-4" />
              <span className="text-sm">Location</span>
            </div>
            <p className="font-medium text-gray-900">{task.location || 'Not specified'}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <FiUser className="w-4 h-4" />
              <span className="text-sm">Trade</span>
            </div>
            <p className="font-medium text-gray-900">{task.professional || 'General'}</p>
          </div>
        </div>

        {/* Transcript if available */}
        {task.media.some(m => m.transcript) && (
          <div className="bg-blue-50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Audio/Video Transcript</h3>
            <div className="text-gray-700 leading-relaxed italic">
              "{task.media.find(m => m.transcript)?.transcript}"
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Need help with similar tasks?</h3>
          <p className="text-white/90 mb-4">
            Create your own tasks with AI-powered analysis from photos and videos.
          </p>
          <Link 
            to="/create"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Try Task Creator
            <FiExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            Created on {new Date(task.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Full Screen Image Viewer */}
      {imageExpanded !== null && task.media[imageExpanded]?.type === 'image' && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setImageExpanded(null)}
        >
          <img 
            src={task.media[imageExpanded].url}
            alt="Expanded view"
            className="max-w-full max-h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            onClick={() => setImageExpanded(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}