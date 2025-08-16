import { type Task } from './storage'

export async function shareTask(task: Task): Promise<boolean> {
  const shareUrl = `${window.location.origin}/shared/${task.id}`
  const shareData = {
    title: task.title,
    text: task.summary,
    url: shareUrl,
  }

  // Check if Web Share API is available (mobile)
  if (navigator.share && isMobileDevice()) {
    try {
      await navigator.share(shareData)
      return true
    } catch (error) {
      // User cancelled or error occurred
      console.log('Share cancelled or failed:', error)
      return false
    }
  } else {
    // Fallback: Copy to clipboard
    try {
      await copyToClipboard(shareUrl)
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      document.execCommand('copy')
      textArea.remove()
    } catch (error) {
      textArea.remove()
      throw error
    }
  }
}

export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || (navigator.maxTouchPoints > 0)
}

export function generateShareableLink(taskId: string): string {
  return `${window.location.origin}/shared/${taskId}`
}

export function formatTaskForExport(task: Task): string {
  return `Task: ${task.title}

Summary: ${task.summary}

Description: ${task.description}

Location: ${task.location || 'Not specified'}
Trade: ${task.professional || 'General'}
Created: ${new Date(task.createdAt).toLocaleDateString()}

View online: ${generateShareableLink(task.id)}`
}