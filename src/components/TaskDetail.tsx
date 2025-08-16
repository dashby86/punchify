import { useState, useEffect } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { FiShare2, FiMapPin, FiUser, FiFileText, FiArrowLeft, FiCopy } from 'react-icons/fi'
import { getTask, type Task } from '@/lib/storage'

export default function TaskDetail() {
  const { taskId } = useParams({ from: '/task/$taskId' })
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

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
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading task details...</p>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Task not found</p>
          <Link to="/" className="text-blue-600 hover:underline">
            Return to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-6">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {copied ? <FiCopy className="w-5 h-5" /> : <FiShare2 className="w-5 h-5" />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </header>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{task.title}</h1>
            <p className="text-gray-600 mb-4">{task.summary}</p>
            
            <div className="space-y-3 mb-6">
              {task.location && (
                <div className="flex items-start gap-3">
                  <FiMapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-gray-900">{task.location}</p>
                  </div>
                </div>
              )}
              
              {task.professional && (
                <div className="flex items-start gap-3">
                  <FiUser className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Recommended Professional</p>
                    <p className="text-gray-900">{task.professional}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-start gap-3">
                <FiFileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-2">Detailed Description</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{task.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Media Files</h2>
            <div className="grid grid-cols-2 gap-4">
              {task.media.map((item, index) => (
                <div key={index} className="space-y-2">
                  {item.type === 'image' ? (
                    <img 
                      src={item.url} 
                      alt={`Task media ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        const newWindow = window.open()
                        if (newWindow) {
                          newWindow.document.write(`<img src="${item.url}" style="max-width:100%; height:auto;" />`)
                        }
                      }}
                    />
                  ) : (
                    <video 
                      src={item.url} 
                      controls
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  {item.transcript && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Transcript:</p>
                      <p className="text-sm text-gray-700">{item.transcript}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          Created on {new Date(task.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  )
}