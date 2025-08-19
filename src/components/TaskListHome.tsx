import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { FiHome, FiFileText, FiPlus, FiShare2 } from 'react-icons/fi'
import { getUniqueAddresses, getTasksByAddress, type Task } from '@/lib/storage'
import { shareTask } from '@/lib/share'
import { SnackbarContainer } from './Snackbar'
import { useSnackbar } from '@/hooks/useSnackbar'

export default function TaskListHome() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [addresses, setAddresses] = useState<string[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [sharingTaskId, setSharingTaskId] = useState<string | null>(null)
  const { snackbars, removeSnackbar, success } = useSnackbar()

  useEffect(() => {
    console.log('=== TaskListHome useEffect ====')
    console.log('Selected address:', selectedAddress)
    
    // Load unique addresses for tabs
    const uniqueAddresses = getUniqueAddresses()
    setAddresses(uniqueAddresses)
    
    // Load tasks based on selected address
    const filteredTasks = getTasksByAddress(selectedAddress || undefined)
    setTasks(filteredTasks)
    
    console.log('Available unique addresses:', uniqueAddresses)
    console.log('Tasks loaded for current filter:', filteredTasks.length)
    
    // Debug: show each task's address info
    const allTasks = getTasksByAddress()
    console.log('All tasks with address info:')
    allTasks.forEach(task => {
      console.log(`- Task ${task.id}: address="${task.address || 'none'}"`)
    })
  }, [selectedAddress])

  const handleShare = async (task: Task, e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation to task detail
    e.stopPropagation()
    
    setSharingTaskId(task.id)
    try {
      const shared = await shareTask(task)
      if (shared) {
        success('Task shared!', 'Task has been shared successfully')
      } else {
        success('Link copied!', 'Task link copied to clipboard')
      }
    } catch (shareError) {
      console.error('Share failed:', shareError)
      // Note: Using console.error since error function was removed
    } finally {
      setSharingTaskId(null)
    }
  }

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


  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Snackbar Notifications */}
      <SnackbarContainer snackbars={snackbars} onClose={removeSnackbar} />
      
      {/* Address Tabs - Show if there are any tasks OR addresses */}
      {(getTasksByAddress().length > 0 || addresses.length > 0) && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex space-x-4 text-sm overflow-x-auto">
            <button
              onClick={() => setSelectedAddress(null)}
              className={`whitespace-nowrap px-3 py-1 rounded-full transition-colors ${
                selectedAddress === null
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Tasks
            </button>
            {addresses.map((address) => (
              <button
                key={address}
                onClick={() => setSelectedAddress(address)}
                className={`whitespace-nowrap px-3 py-1 rounded-full transition-colors ${
                  selectedAddress === address
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
                title={`Full address: ${address}`}
              >
                {address.length > 20 ? `${address.substring(0, 17)}...` : address}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="flex-1">
        {/* Selected Address Header */}
        {selectedAddress && (
          <div className="mx-4 mt-4 mb-2 p-4 bg-gradient-to-r from-gray-800/50 to-gray-800/30 rounded-xl border border-gray-700/30">
            <h2 className="text-lg font-semibold text-white">
              📍 {selectedAddress}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} at this location
            </p>
          </div>
        )}
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="bg-gray-800/30 rounded-full p-6 mb-4">
              <FiFileText className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              {selectedAddress ? 'No tasks at this location' : 'No tasks yet'}
            </h3>
            <p className="text-gray-500 text-center max-w-sm">
              {selectedAddress 
                ? 'No tasks found for this address. Try another location or create a new task.'
                : 'Create your first task by tapping the + button below'
              }
            </p>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-3">
            {tasks.map((task, index) => (
              <Link
                key={task.id}
                to="/task/$taskId"
                params={{ taskId: task.id }}
                className="block animate-fadeIn transform transition-all duration-300 hover:scale-[1.01]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="bg-gray-800/80 backdrop-blur-sm hover:bg-gray-750/90 transition-all duration-300 p-5 rounded-xl border border-gray-700/50 shadow-sm hover:shadow-lg hover:border-gray-600/50">
                  {/* Task Title and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-white font-semibold text-lg flex-1 pr-2">{task.title}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleShare(task, e)}
                        disabled={sharingTaskId === task.id}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-all hover:bg-gray-700/50 rounded-lg disabled:opacity-50"
                        title="Share task"
                      >
                        <FiShare2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>


                  {/* Summary */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Summary</p>
                    <p className="text-sm text-gray-300 line-clamp-2">{task.summary}</p>
                  </div>

                  {/* Description Preview */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</p>
                    <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">{task.description}</p>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap gap-4 text-xs border-t border-gray-700/30 pt-4 mt-4">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Location:</span>
                      <span className="text-gray-300">{task.location || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Trade:</span>
                      <span className="text-gray-300">{task.professional || 'General'}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-300">{formatDate(task.createdAt)}</span>
                    </div>
                  </div>

                  {/* Media thumbnails */}
                  {task.media && task.media.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {task.media.slice(0, 3).map((media, index) => (
                        <div key={index} className="w-14 h-14 bg-gray-700/50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-600/30">
                          {media.type === 'image' ? (
                            <img 
                              src={media.url} 
                              alt="Task media"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FiFileText className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                      ))}
                      {task.media.length > 3 && (
                        <div className="w-14 h-14 bg-gray-700/50 rounded-lg flex items-center justify-center border border-gray-600/30">
                          <span className="text-xs text-gray-400">+{task.media.length - 3}</span>
                        </div>
                      )}
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
          
          <Link to="/create" className="flex flex-col items-center py-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mb-1">
              <FiPlus className="w-6 h-6 text-white" />
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-20"></div>
    </div>
  )
}