interface MediaFile {
  url: string
  type: 'image' | 'video' | 'audio'
  transcript?: string
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
  const tasks = getAllTasks()
  tasks[task.id] = task
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
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