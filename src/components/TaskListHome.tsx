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
      
      {/* Address Tabs */}
      {addresses.length > 0 && (
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
          <div className="px-4 py-3 bg-gray-800/50">
            <h2 className="text-lg font-medium text-white">
              {selectedAddress}
            </h2>
            <p className="text-sm text-gray-400">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} at this location
            </p>
          </div>
        )}
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FiFileText className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              {selectedAddress ? 'No tasks at this location' : 'No tasks yet'}
            </h3>
            <p className="text-gray-500 text-center px-4">
              {selectedAddress 
                ? 'No tasks found for this address. Try another location or create a new task.'
                : 'Create your first task by tapping the + button below'
              }
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleShare(task, e)}
                        disabled={sharingTaskId === task.id}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
                        title="Share task"
                      >
                        <FiShare2 className="w-4 h-4" />
                      </button>
                    </div>
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
                      <p className="text-gray-500">Trade</p>
                      <p className="text-gray-300">{task.professional || 'General'}</p>
                    </div>
                  </div>


                  {/* Created Date */}
                  <div className="text-sm mb-4">
                    <p className="text-gray-500">Created</p>
                    <p className="text-gray-300">{formatDate(task.createdAt)}</p>
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