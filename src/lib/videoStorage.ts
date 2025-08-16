// Video storage using IndexedDB for larger capacity
const DB_NAME = 'TaskCreatorVideos'
const DB_VERSION = 1
const STORE_NAME = 'videos'

interface VideoData {
  id: string
  data: Blob
  type: string
  timestamp: number
}

class VideoStorageService {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async saveVideo(id: string, file: File): Promise<string> {
    if (!this.db) await this.init()
    
    const sizeMB = file.size / (1024 * 1024)
    console.log(`Saving video ${id}: ${sizeMB.toFixed(2)}MB`)
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const videoData: VideoData = {
        id,
        data: file,
        type: file.type,
        timestamp: Date.now()
      }
      
      const request = store.put(videoData)
      
      request.onsuccess = () => {
        // Return a reference URL that we'll use to retrieve the video
        const videoUrl = `indexeddb://${id}`
        resolve(videoUrl)
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async getVideo(id: string): Promise<string | null> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)
      
      request.onsuccess = () => {
        const result = request.result as VideoData | undefined
        if (result && result.data) {
          // Convert Blob to data URL
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(result.data)
        } else {
          resolve(null)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async deleteVideo(id: string): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async cleanupOldVideos(daysToKeep: number = 7): Promise<void> {
    if (!this.db) await this.init()
    
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000)
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('timestamp')
      const range = IDBKeyRange.upperBound(cutoffTime)
      const request = index.openCursor(range)
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          store.delete(cursor.primaryKey)
          cursor.continue()
        } else {
          resolve()
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async getStorageSize(): Promise<number> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    }
    return 0
  }
}

export const videoStorage = new VideoStorageService()

// Helper function to handle video storage
export async function storeVideoWithFallback(file: File, taskId: string): Promise<{ url: string; isPlayable: boolean }> {
  const sizeMB = file.size / (1024 * 1024)
  
  try {
    // Try to store in IndexedDB first (can handle larger files)
    const videoUrl = await videoStorage.saveVideo(`${taskId}-video`, file)
    console.log(`Video stored in IndexedDB: ${sizeMB.toFixed(2)}MB`)
    return { url: videoUrl, isPlayable: true }
  } catch (error) {
    console.error('Failed to store video in IndexedDB:', error)
    
    // Fallback to thumbnail for localStorage
    const { extractSingleFrame } = await import('./compress')
    const thumbnail = await extractSingleFrame(file, 1)
    console.warn(`Stored video thumbnail only due to storage error`)
    return { url: thumbnail, isPlayable: false }
  }
}

// Helper to retrieve video from IndexedDB
export async function retrieveVideo(url: string): Promise<string | null> {
  if (url.startsWith('indexeddb://')) {
    const id = url.replace('indexeddb://', '')
    return await videoStorage.getVideo(id)
  }
  return url // Already a data URL
}