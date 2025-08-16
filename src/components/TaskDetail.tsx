import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from '@tanstack/react-router'
import { FiMapPin, FiUser, FiFileText, FiArrowLeft, FiChevronDown, FiTrash2, FiCamera, FiVideo, FiUpload, FiMaximize2, FiEdit3, FiCheck, FiX } from 'react-icons/fi'
import { getTask, publishTask, deleteTask, updateTask, type Task } from '@/lib/storage'
import { retrieveVideo } from '@/lib/videoStorage'
import MediaViewer from './MediaViewer'

export default function TaskDetail() {
  const { taskId } = useParams({ from: '/task/$taskId' })
  const navigate = useNavigate()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Task>>({})

  useEffect(() => {
    async function loadTask() {
      const fetchedTask = getTask(taskId)
      console.log('Fetched task:', fetchedTask)
      console.log('Task media:', fetchedTask?.media)
      console.log('Media with transcripts:', fetchedTask?.media?.filter(m => m.transcript))
      
      // Load video from IndexedDB if needed
      if (fetchedTask?.media?.[0]?.type === 'video' && fetchedTask.media[0].url.startsWith('indexeddb://')) {
        const video = await retrieveVideo(fetchedTask.media[0].url)
        setVideoUrl(video)
      } else if (fetchedTask?.media?.[0]?.type === 'video') {
        setVideoUrl(fetchedTask.media[0].url)
      }
      
      setTask(fetchedTask)
      setLoading(false)
    }
    
    loadTask()
  }, [taskId])



  const handlePublish = () => {
    if (task) {
      publishTask(task.id)
      navigate({ to: '/' })
    }
  }

  const handleDiscard = () => {
    if (task) {
      deleteTask(task.id)
      navigate({ to: '/' })
    }
  }

  const startEditing = (field: string, currentValue: any) => {
    setEditingField(field)
    setEditValues({ [field]: currentValue })
  }

  const saveEdit = () => {
    if (task && editingField && editValues[editingField as keyof Task] !== undefined) {
      updateTask(task.id, editValues)
      setTask({ ...task, ...editValues })
      setEditingField(null)
      setEditValues({})
    }
  }

  const cancelEdit = () => {
    setEditingField(null)
    setEditValues({})
  }

  const handleEditChange = (field: string, value: any) => {
    setEditValues({ ...editValues, [field]: value })
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
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-gray-300"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-white">Task Details</h1>
          <div className="w-6" /> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Media Thumbnail */}
        {task.media.length > 0 && (
          <div 
            className="bg-gray-800 rounded-xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setViewerIndex(0)
              setViewerOpen(true)
            }}
          >
            <div className="relative">
              {task.media[0].type === 'video' && videoUrl && videoUrl.startsWith('data:video/') ? (
                <video 
                  src={videoUrl}
                  className="w-full h-48 object-cover"
                  controls
                  playsInline
                  muted
                />
              ) : task.media[0].type === 'video' && task.media[0].isPlayable ? (
                <div className="relative">
                  {videoUrl ? (
                    <video 
                      src={videoUrl}
                      className="w-full h-48 object-cover"
                      controls
                      playsInline
                      muted
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <p className="text-gray-500">Loading video...</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <img 
                    src={task.media[0].type === 'video' ? (videoUrl || task.media[0].url) : task.media[0].url}
                    alt={`${task.media[0].type === 'video' ? 'Video thumbnail' : 'Image'}`}
                    className="w-full h-48 object-cover"
                  />
                  {task.media[0].type === 'video' && !task.media[0].isPlayable && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                        <FiVideo className="w-6 h-6 text-gray-700" />
                      </div>
                    </div>
                  )}
                  {task.media[0].type === 'image' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
                        <FiCamera className="w-6 h-6 text-gray-700" />
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="absolute top-2 right-2">
                <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                  <FiMaximize2 className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-white">
                {task.media[0].type === 'video' 
                  ? (task.media[0].isPlayable ? 'Video - Click to play' : 'Video thumbnail - Full video analyzed')
                  : 'Image - Tap to view'}
              </p>
            </div>
          </div>
        )}

        {/* Task Summary Card */}
        <div className="bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="mb-3">
            <p className="text-sm font-medium text-white mb-1">Task summary</p>
            <p className="text-sm text-gray-300">{task.summary}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-white mb-1">Task description</p>
            <p className="text-sm text-gray-300 leading-relaxed">{task.description}</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-3">
          {/* Location */}
          <div className="bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">Location</p>
                {editingField === 'location' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editValues.location || ''}
                      onChange={(e) => handleEditChange('location', e.target.value)}
                      className="bg-gray-700 text-white text-sm px-2 py-1 rounded flex-1"
                      placeholder="Enter location"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="text-green-400 hover:text-green-300">
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEdit} className="text-red-400 hover:text-red-300">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-300">{task.location || 'Not specified'}</p>
                )}
              </div>
              {editingField !== 'location' && (
                <button
                  onClick={() => startEditing('location', task.location || '')}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <FiEdit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Trade */}
          <div className="bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">Trade</p>
                {editingField === 'professional' ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={editValues.professional || ''}
                      onChange={(e) => handleEditChange('professional', e.target.value)}
                      className="bg-gray-700 text-white text-sm px-2 py-1 rounded flex-1"
                      autoFocus
                    >
                      <option value="">General</option>
                      <option value="Electrician">Electrician</option>
                      <option value="Plumber">Plumber</option>
                      <option value="Carpenter">Carpenter</option>
                      <option value="HVAC">HVAC</option>
                      <option value="Painter">Painter</option>
                      <option value="Landscaper">Landscaper</option>
                      <option value="Roofing">Roofing</option>
                      <option value="Flooring">Flooring</option>
                      <option value="Other">Other</option>
                    </select>
                    <button onClick={saveEdit} className="text-green-400 hover:text-green-300">
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEdit} className="text-red-400 hover:text-red-300">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-300">{task.professional || 'General'}</p>
                )}
              </div>
              {editingField !== 'professional' && (
                <button
                  onClick={() => startEditing('professional', task.professional || '')}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <FiEdit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">Priority</p>
                {editingField === 'priority' ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={editValues.priority || ''}
                      onChange={(e) => handleEditChange('priority', e.target.value)}
                      className="bg-gray-700 text-white text-sm px-2 py-1 rounded flex-1"
                      autoFocus
                    >
                      <option value="">Not Set</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <button onClick={saveEdit} className="text-green-400 hover:text-green-300">
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEdit} className="text-red-400 hover:text-red-300">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    task.priority === 'high' ? 'bg-red-900 text-red-200' :
                    task.priority === 'medium' ? 'bg-yellow-900 text-yellow-200' :
                    task.priority === 'low' ? 'bg-green-900 text-green-200' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Not Set'}
                  </span>
                )}
              </div>
              {editingField !== 'priority' && (
                <button
                  onClick={() => startEditing('priority', task.priority || '')}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <FiEdit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Assignee */}
          <div className="bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">Assignee</p>
                {editingField === 'assignee' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editValues.assignee || ''}
                      onChange={(e) => handleEditChange('assignee', e.target.value)}
                      className="bg-gray-700 text-white text-sm px-2 py-1 rounded flex-1"
                      placeholder="Enter assignee name"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="text-green-400 hover:text-green-300">
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEdit} className="text-red-400 hover:text-red-300">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-300">{task.assignee || 'Unassigned'}</p>
                )}
              </div>
              {editingField !== 'assignee' && (
                <button
                  onClick={() => startEditing('assignee', task.assignee || '')}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <FiEdit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">Address</p>
                {editingField === 'address' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editValues.address || ''}
                      onChange={(e) => handleEditChange('address', e.target.value)}
                      className="bg-gray-700 text-white text-sm px-2 py-1 rounded flex-1"
                      placeholder="Enter full address"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="text-green-400 hover:text-green-300">
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEdit} className="text-red-400 hover:text-red-300">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-300">{task.address || 'Not specified'}</p>
                )}
              </div>
              {editingField !== 'address' && (
                <button
                  onClick={() => startEditing('address', task.address || '')}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <FiEdit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Assignor */}
          <div className="bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">Assignor</p>
                {editingField === 'assignor' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editValues.assignor || ''}
                      onChange={(e) => handleEditChange('assignor', e.target.value)}
                      className="bg-gray-700 text-white text-sm px-2 py-1 rounded flex-1"
                      placeholder="Who assigned this task?"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="text-green-400 hover:text-green-300">
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEdit} className="text-red-400 hover:text-red-300">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-300">{task.assignor || 'Not specified'}</p>
                )}
              </div>
              {editingField !== 'assignor' && (
                <button
                  onClick={() => startEditing('assignor', task.assignor || '')}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <FiEdit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div className="bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-1">Due Date</p>
                {editingField === 'dueDate' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={editValues.dueDate || ''}
                      onChange={(e) => handleEditChange('dueDate', e.target.value)}
                      className="bg-gray-700 text-white text-sm px-2 py-1 rounded flex-1"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="text-green-400 hover:text-green-300">
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEdit} className="text-red-400 hover:text-red-300">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-300">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                  </p>
                )}
              </div>
              {editingField !== 'dueDate' && (
                <button
                  onClick={() => startEditing('dueDate', task.dueDate || '')}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <FiEdit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>




        </div>

        {/* Uploaded Content */}
        <div className="bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm font-medium text-white mb-3">Uploaded content</p>
          <div className="space-y-2">
            {task.media.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                onClick={() => {
                  setViewerIndex(index)
                  setViewerOpen(true)
                }}
              >
                <div className="flex items-center gap-2">
                  {item.type === 'image' && <FiCamera className="w-4 h-4 text-gray-400" />}
                  {item.type === 'video' && <FiVideo className="w-4 h-4 text-gray-400" />}
                  <span className="text-sm text-gray-200">
                    {item.type === 'image' ? 'Image' : 'Video'} {index + 1}
                  </span>
                  <span className="text-xs text-gray-400">Tap to view</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiMaximize2 className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
          
        </div>

        {/* Video Transcript */}
        {task.media.some(m => m.transcript) && (
          <div className="bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className="text-sm font-medium text-white mb-3">Video transcript</p>
            <div className="text-sm text-gray-300 leading-relaxed">
              {task.media.find(m => m.transcript)?.transcript}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button 
            onClick={handleDiscard}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
          >
            <FiTrash2 className="w-5 h-5" />
            Discard
          </button>
          
          <button 
            onClick={handlePublish}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            Publish task
          </button>
        </div>
      </div>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-20"></div>

      {/* Media Viewer */}
      {viewerOpen && task && (
        <MediaViewer
          media={task.media}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
        <div className="flex justify-around py-2">
          <Link to="/" className="flex flex-col items-center py-2">
            <div className="w-6 h-6 mb-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
            <span className="text-xs text-blue-500">Home</span>
          </Link>
          
          <Link to="/create" className="flex flex-col items-center py-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mb-1">
              <span className="text-white text-lg font-bold">+</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}