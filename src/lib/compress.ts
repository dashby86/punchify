// Client-side media compression utilities

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'image/jpeg' | 'image/webp' | 'image/png'
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'image/jpeg'
}

export async function compressImage(file: File, options?: CompressionOptions): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      try {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > opts.maxWidth! || height > opts.maxHeight!) {
          const ratio = Math.min(opts.maxWidth! / width, opts.maxHeight! / height)
          width *= ratio
          height *= ratio
        }
        
        // Set canvas size
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx!.drawImage(img, 0, 0, width, height)
        
        // Convert to compressed base64
        const compressed = canvas.toDataURL(opts.format, opts.quality)
        resolve(compressed)
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export async function createThumbnail(file: File): Promise<string> {
  return compressImage(file, {
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.7,
    format: 'image/jpeg'
  })
}

export async function compressVideo(file: File): Promise<string> {
  // Extract a single frame from video
  return extractSingleFrame(file, 1)
}

async function extractSingleFrame(file: File, timeInSeconds: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    video.onloadedmetadata = () => {
      try {
        canvas.width = Math.min(video.videoWidth, 800)
        canvas.height = Math.min(video.videoHeight, 600)
        
        // Ensure time is within video duration
        const seekTime = Math.min(timeInSeconds, video.duration * 0.5)
        video.currentTime = seekTime
      } catch (error) {
        reject(error)
      }
    }
    
    video.onseeked = () => {
      try {
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8)
        resolve(thumbnail)
      } catch (error) {
        reject(error)
      }
    }
    
    video.onerror = reject
    video.src = URL.createObjectURL(file)
    video.muted = true
    video.playsInline = true
  })
}

export async function extractVideoFrames(file: File, frameCount: number = 5): Promise<string[]> {
  return new Promise(async (resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const frames: string[] = []
    
    video.onloadedmetadata = async () => {
      try {
        canvas.width = Math.min(video.videoWidth, 800)
        canvas.height = Math.min(video.videoHeight, 600)
        
        const duration = video.duration
        const interval = duration / (frameCount + 1) // Distribute frames evenly
        
        // Extract frames at different timestamps
        for (let i = 1; i <= frameCount; i++) {
          const timestamp = interval * i
          
          await new Promise<void>((seekResolve) => {
            video.onseeked = () => {
              ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)
              const frame = canvas.toDataURL('image/jpeg', 0.7)
              frames.push(frame)
              seekResolve()
            }
            video.currentTime = timestamp
          })
        }
        
        resolve(frames)
      } catch (error) {
        reject(error)
      }
    }
    
    video.onerror = reject
    const videoUrl = URL.createObjectURL(file)
    video.src = videoUrl
    video.muted = true
    video.playsInline = true
  })
}

export function getFileSizeKB(base64String: string): number {
  // Remove data URL prefix if present
  const base64 = base64String.replace(/^data:.*,/, '')
  
  // Calculate size (base64 is ~33% larger than original)
  return Math.round((base64.length * 0.75) / 1024)
}

export function shouldCompress(file: File): boolean {
  const maxSizeKB = 500 // Compress files larger than 500KB
  return file.size > maxSizeKB * 1024
}

export async function optimizeMediaFile(file: File, type: 'image' | 'video'): Promise<string> {
  try {
    switch (type) {
      case 'image':
        if (shouldCompress(file)) {
          return await compressImage(file)
        } else {
          // Small image, convert to base64 directly
          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        }
        
      case 'video':
        // For videos, create a thumbnail representation
        return await compressVideo(file)
        
      default:
        throw new Error('Unsupported media type')
    }
  } catch (error) {
    console.error('Failed to optimize media:', error)
    // Fallback: try to convert to base64 with compression
    if (type === 'image') {
      return await compressImage(file, { quality: 0.6, maxWidth: 800, maxHeight: 600 })
    }
    throw error
  }
}