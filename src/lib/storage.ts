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
    return tasksJson ? JSON.parse(tasksJson) : {}
  } catch {
    return {}
  }
}

export function deleteTask(taskId: string): void {
  const tasks = getAllTasks()
  delete tasks[taskId]
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
}

export { type Task, type MediaFile }