import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { FiHome, FiFileText, FiPlus, FiUser, FiChevronRight } from 'react-icons/fi'
import { getPublishedTasks, type Task } from '@/lib/storage'

export default function TaskListHome() {
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const publishedTasks = getPublishedTasks()
    const taskList = Object.values(publishedTasks).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    setTasks(taskList)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'in progress':
        return 'bg-orange-100 text-orange-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with addresses */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex space-x-4 text-sm">
          <span className="text-white font-medium">180 Maiden Lane</span>
          <span className="text-gray-400">1290 Main Street</span>
          <span className="text-gray-400">98 5th Avenue</span>
          <span className="text-gray-400">231 14th</span>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FiFileText className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No tasks yet</h3>
            <p className="text-gray-500 text-center px-4">
              Create your first task by tapping the + button below
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.map((task, index) => (
              <Link
                key={task.id}
                to="/task/$taskId"
                params={{ taskId: task.id }}
                className="block animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="bg-gray-800 hover:bg-gray-750 transition-all duration-200 p-4 border-b border-gray-700 hover:shadow-lg">
                  {/* Task Title and Status */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-medium flex-1 pr-2">{task.title}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor('In Progress')}`}>
                      In Progress
                    </span>
                  </div>

                  {/* Assignor and Assignee */}
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-medium">S</span>
                    </div>
                    <span className="text-gray-300 text-sm">Sarah Martinez</span>
                    <FiChevronRight className="w-4 h-4 text-gray-500 mx-2" />
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-medium">M</span>
                    </div>
                    <span className="text-gray-300 text-sm">Mike Thompson</span>
                  </div>

                  {/* Summary */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-300 mb-1">Summary</p>
                    <p className="text-sm text-gray-400 line-clamp-2">{task.summary}</p>
                  </div>

                  {/* Description Preview */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-300 mb-1">Description</p>
                    <p className="text-sm text-gray-400 line-clamp-3">{task.description}</p>
                  </div>

                  {/* Location, Project, Address */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="text-gray-300">{task.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Project</p>
                      <p className="text-gray-300">180 Maiden Lane</p>
                    </div>
                  </div>

                  <div className="text-sm mb-3">
                    <p className="text-gray-500">Address</p>
                    <p className="text-gray-300">180 Maiden Lane, New York, NY 10012</p>
                  </div>

                  {/* Trade and Due Date */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-500">Trade</p>
                      <p className="text-gray-300">{task.professional || 'General'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Due</p>
                      <p className="text-gray-300">{formatDate(task.createdAt)}</p>
                    </div>
                  </div>

                  {/* Media thumbnails */}
                  {task.media && task.media.length > 0 && (
                    <div className="flex space-x-2">
                      {task.media.slice(0, 2).map((media, index) => (
                        <div key={index} className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                          {media.type === 'image' ? (
                            <img 
                              src={media.url} 
                              alt="Task media"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <FiFileText className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
        <div className="flex justify-around py-2">
          <button className="flex flex-col items-center py-2">
            <FiHome className="w-6 h-6 mb-1 text-blue-500" />
            <span className="text-xs text-blue-500">Home</span>
          </button>
          
          <button className="flex flex-col items-center py-2">
            <FiFileText className="w-6 h-6 mb-1 text-gray-400" />
            <span className="text-xs text-gray-400">Projects</span>
          </button>
          
          <Link to="/create" className="flex flex-col items-center py-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-1">
              <FiPlus className="w-6 h-6 text-white" />
            </div>
          </Link>
          
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

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-20"></div>
    </div>
  )
}