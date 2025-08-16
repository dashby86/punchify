import { useEffect, useState } from 'react'
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi'
import type { SnackbarMessage } from '@/hooks/useSnackbar'

interface SnackbarProps {
  snackbar: SnackbarMessage
  onClose: (id: string) => void
}

function Snackbar({ snackbar, onClose }: SnackbarProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 50)

    // Auto dismiss
    const timer = setTimeout(() => {
      handleClose()
    }, snackbar.duration || 4000)

    return () => clearTimeout(timer)
  }, [snackbar.id, snackbar.duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(snackbar.id), 200)
    }, 100)
  }

  const icons = {
    success: <FiCheckCircle className="w-5 h-5 text-white" />,
    error: <FiXCircle className="w-5 h-5 text-white" />,
    warning: <FiAlertCircle className="w-5 h-5 text-white" />,
    info: <FiInfo className="w-5 h-5 text-white" />
  }

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600', 
    warning: 'bg-orange-600',
    info: 'bg-blue-600'
  }

  return (
    <div
      className={`
        fixed left-4 right-4 bottom-6 z-50 transform transition-all duration-400 ease-out
        ${isVisible && !isLeaving 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-8 opacity-0 scale-95'
        }
      `}
    >
      <div className={`
        flex items-center gap-3 p-4 rounded-2xl shadow-xl text-white backdrop-blur-sm
        ${colors[snackbar.type]}
        max-w-sm mx-auto border border-white/10
      `}>
        <div className="flex-shrink-0">
          {icons[snackbar.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{snackbar.title}</p>
          {snackbar.message && (
            <p className="mt-0.5 text-xs text-white/90">{snackbar.message}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors p-1"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

interface SnackbarContainerProps {
  snackbars: SnackbarMessage[]
  onClose: (id: string) => void
}

export function SnackbarContainer({ snackbars, onClose }: SnackbarContainerProps) {
  // Only show the most recent snackbar (Flutter-style)
  const currentSnackbar = snackbars[snackbars.length - 1]
  
  if (!currentSnackbar) return null

  return (
    <Snackbar snackbar={currentSnackbar} onClose={onClose} />
  )
}

