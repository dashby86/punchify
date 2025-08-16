import { useState, useEffect } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { FiMapPin, FiUser, FiFileText, FiArrowLeft, FiChevronDown, FiTrash2, FiCamera, FiVideo, FiMic, FiUpload } from 'react-icons/fi'
import { getTask, type Task } from '@/lib/storage'

export default function TaskDetail() {
  const { taskId } = useParams({ from: '/task/$taskId' })
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchedTask = getTask(taskId)
    setTask(fetchedTask)
    setLoading(false)
  }, [taskId])

  const handleShare = async () => {
    const shareUrl = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: task?.title || 'Task Details',
          text: task?.summary || '',
          url: shareUrl
        })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading task details...</p>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Task not found</p>
          <Link to="/" className="text-blue-500 hover:underline">
            Return to home
          </Link>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-gray-700"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Task Details</h1>
          <div className="w-6" /> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Video Thumbnail */}
        {task.media.length > 0 && task.media[0].type === 'video' && (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="relative">
              <video 
                src={task.media[0].url}
                className="w-full h-48 object-cover"
                poster=""
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                  <FiVideo className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-gray-900">Video</p>
            </div>
          </div>
        )}

        {/* Task Summary Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900 mb-1">Task summary</p>
            <p className="text-sm text-gray-600">{task.summary}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Task description</p>
            <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-3">
          {/* Location */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Location</p>
                <p className="text-sm text-gray-600">{task.location || 'Not specified'}</p>
              </div>
              <FiChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Project */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Project</p>
                <p className="text-sm text-gray-600">Default Project</p>
              </div>
              <FiChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Address</p>
                <p className="text-sm text-gray-600">{task.location || 'Not specified'}</p>
              </div>
              <FiMapPin className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Trade */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Trade</p>
                <p className="text-sm text-gray-600">{task.professional || 'General'}</p>
              </div>
              <FiChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Priority */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Priority</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Not Set
                </span>
              </div>
              <FiChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Assignor */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Assignor</p>
                <p className="text-sm text-gray-600">User</p>
              </div>
              <FiChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Assignee */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Assignee</p>
                <p className="text-sm text-gray-600">{task.professional ? `${task.professional} Specialist` : 'Unassigned'}</p>
              </div>
              <FiChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Due Date */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Due date</p>
                <p className="text-sm text-gray-600">Not set</p>
              </div>
              <FiChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Uploaded Content */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-900 mb-3">Uploaded content</p>
          <div className="space-y-2">
            {task.media.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {item.type === 'image' && <FiCamera className="w-4 h-4 text-gray-500" />}
                  {item.type === 'video' && <FiVideo className="w-4 h-4 text-gray-500" />}
                  {item.type === 'audio' && <FiMic className="w-4 h-4 text-gray-500" />}
                  <span className="text-sm text-gray-700">
                    {item.type === 'image' ? 'Image' : item.type === 'video' ? 'Video' : 'Audio'} {index + 1}
                  </span>
                </div>
                <FiTrash2 className="w-4 h-4 text-red-500" />
              </div>
            ))}
          </div>
          
          <button className="w-full mt-3 py-2 border border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:border-gray-400 transition-colors">
            <FiUpload className="w-4 h-4" />
            <span className="text-sm">Upload additional content</span>
          </button>
        </div>

        {/* Audio Transcript */}
        {task.media.some(m => m.transcript) && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-900 mb-3">Audio transcript</p>
            <div className="text-sm text-gray-700 leading-relaxed">
              {task.media.find(m => m.transcript)?.transcript}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button 
            onClick={handleShare}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
          >
            <FiTrash2 className="w-5 h-5" />
            Discard
          </button>
          
          <button className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors">
            Publish task
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          <Link to="/" className="flex flex-col items-center py-2">
            <div className="w-6 h-6 mb-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
            <span className="text-xs text-blue-600">Home</span>
          </Link>
          
          <button className="flex flex-col items-center py-2">
            <FiFileText className="w-6 h-6 mb-1 text-gray-400" />
            <span className="text-xs text-gray-400">Projects</span>
          </button>
          
          <button className="flex flex-col items-center py-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mb-1">
              <span className="text-white text-lg font-bold">+</span>
            </div>
          </button>
          
          <button className="flex flex-col items-center py-2">
            <FiFileText className="w-6 h-6 mb-1 text-gray-400" />
            <span className="text-xs text-gray-400">Feed</span>
          </button>
          
          <button className="flex flex-col items-center py-2">
            <FiUser className="w-6 h-6 mb-1 text-gray-400" />
            <span className="text-xs text-gray-400">Profile</span>
          </button>
        </div>
      </div>
    </div>
  )
}