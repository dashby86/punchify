import { useState } from 'react'

export type SnackbarType = 'success' | 'error' | 'warning' | 'info'

export interface SnackbarMessage {
  id: string
  type: SnackbarType
  title: string
  message?: string
  duration?: number
}

// Snackbar hook for managing snackbars
export function useSnackbar() {
  const [snackbars, setSnackbars] = useState<SnackbarMessage[]>([])

  const showSnackbar = (snackbar: Omit<SnackbarMessage, 'id'>) => {
    const id = Date.now().toString()
    
    // Clear existing snackbars and show new one (Flutter behavior)
    setSnackbars([{ ...snackbar, id }])
  }

  const removeSnackbar = (id: string) => {
    setSnackbars(prev => prev.filter(s => s.id !== id))
  }

  const clearAll = () => {
    setSnackbars([])
  }

  return {
    snackbars,
    showSnackbar,
    removeSnackbar,
    clearAll,
    success: (title: string, message?: string) => 
      showSnackbar({ type: 'success', title, message }),
    error: (title: string, message?: string) => 
      showSnackbar({ type: 'error', title, message }),
    warning: (title: string, message?: string) => 
      showSnackbar({ type: 'warning', title, message }),
    info: (title: string, message?: string) => 
      showSnackbar({ type: 'info', title, message })
  }
}