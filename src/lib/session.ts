export interface PersistedMediaFile {
  name: string
  type: 'image' | 'video' | 'audio'
  base64: string
  lastModified: number
}

const SESSION_KEY = 'task_creator_session_media'

export function saveMediaToSession(files: { file: File; type: 'image' | 'video' | 'audio' }[]): Promise<void> {
  return new Promise(async (resolve) => {
    try {
      const persistedFiles: PersistedMediaFile[] = await Promise.all(
        files.map(async ({ file, type }) => {
          const base64 = await fileToBase64(file)
          return {
            name: file.name,
            type,
            base64,
            lastModified: file.lastModified
          }
        })
      )
      
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(persistedFiles))
      resolve()
    } catch (error) {
      console.error('Failed to save media to session:', error)
      resolve()
    }
  })
}

export function loadMediaFromSession(): PersistedMediaFile[] {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY)
    if (!stored) return []
    
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Failed to load media from session:', error)
    return []
  }
}

export function clearMediaSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch (error) {
    console.error('Failed to clear media session:', error)
  }
}

export function hasMediaInSession(): boolean {
  const media = loadMediaFromSession()
  return media.length > 0
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

export function base64ToFile(base64: string, name: string, lastModified: number): File {
  // Convert base64 to blob
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  
  const blob = new Blob([u8arr], { type: mime })
  return new File([blob], name, { lastModified, type: mime })
}