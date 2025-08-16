interface MediaFile {
  url: string
  type: 'image' | 'video'
  transcript?: string
  isPlayable?: boolean
}

interface Task {
  id: string
  title: string
  summary: string
  description: string
  location?: string
  professional?: string
  media: MediaFile[]
  createdAt: string
  status: 'draft' | 'published'
}

const TASKS_KEY = 'task_creator_tasks'

export function saveTask(task: Task): void {
  try {
    const tasks = getAllTasks()
    tasks[task.id] = task
    
    const dataToStore = JSON.stringify(tasks)
    
    // Check if we're approaching localStorage limit (typically 5-10MB)
    const storageLimit = 4 * 1024 * 1024 // 4MB to be safe
    if (dataToStore.length > storageLimit) {
      console.warn('Task storage approaching limit, media has been compressed but still too large')
      // Save task without media as last resort
      const taskWithoutMedia = { ...task, media: [] }
      tasks[task.id] = taskWithoutMedia
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
      throw new Error('Media files too large for storage - task saved without images')
    }
    
    localStorage.setItem(TASKS_KEY, dataToStore)
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded despite compression')
      try {
        // Retry without media as fallback
        const tasks = getAllTasks()
        const taskWithoutMedia = { ...task, media: [] }
        tasks[task.id] = taskWithoutMedia
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
        throw new Error('Storage quota exceeded - task saved without media')
      } catch (retryError) {
        console.error('Failed to save task even without media:', retryError)
        throw new Error('Unable to save task - storage full')
      }
    } else {
      throw error
    }
  }
}

export function getTask(taskId: string): Task | null {
  const tasks = getAllTasks()
  return tasks[taskId] || null
}

export function getAllTasks(): Record<string, Task> {
  try {
    const tasksJson = localStorage.getItem(TASKS_KEY)
    const tasks = tasksJson ? JSON.parse(tasksJson) : {}
    
    // Migrate existing tasks without status field
    let needsSave = false
    Object.values(tasks).forEach((task: any) => {
      if (!task.status) {
        task.status = 'published' // Treat existing tasks as published
        needsSave = true
      }
    })
    
    if (needsSave) {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
    }
    
    return tasks
  } catch {
    return {}
  }
}

export function getPublishedTasks(): Record<string, Task> {
  const allTasks = getAllTasks()
  const publishedTasks: Record<string, Task> = {}
  
  Object.values(allTasks).forEach(task => {
    if (task.status === 'published') {
      publishedTasks[task.id] = task
    }
  })
  
  return publishedTasks
}

export function publishTask(taskId: string): void {
  const tasks = getAllTasks()
  if (tasks[taskId]) {
    tasks[taskId].status = 'published'
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  }
}

export function deleteTask(taskId: string): void {
  const tasks = getAllTasks()
  delete tasks[taskId]
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}

export { type Task, type MediaFile }