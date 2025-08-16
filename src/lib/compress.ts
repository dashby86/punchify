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
  // For videos, we can't compress on client side easily
  // So we'll create a thumbnail from the first frame
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    video.onloadedmetadata = () => {
      try {
        canvas.width = Math.min(video.videoWidth, 800)
        canvas.height = Math.min(video.videoHeight, 600)
        
        video.currentTime = 1 // Get frame at 1 second
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

export async function optimizeMediaFile(file: File, type: 'image' | 'video' | 'audio'): Promise<string> {
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
        
      case 'audio':
        // For audio, we'll store a small placeholder or metadata
        return 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="#374151"/>
            <text x="50" y="45" text-anchor="middle" fill="white" font-size="12">🎵</text>
            <text x="50" y="65" text-anchor="middle" fill="white" font-size="8">${file.name}</text>
          </svg>
        `)
        
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