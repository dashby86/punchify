import { useState, useEffect } from 'react'
import { FiAlertTriangle, FiX } from 'react-icons/fi'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'warning' | 'danger' | 'info'
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning'
}: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200)
      document.body.style.overflow = 'auto'
      return () => clearTimeout(timer)
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const variantStyles = {
    warning: {
      icon: 'text-yellow-500',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    danger: {
      icon: 'text-red-500',
      button: 'bg-red-600 hover:bg-red-700 text-white'
    },
    info: {
      icon: 'text-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  if (!isVisible) return null

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onCancel}
    >
      <div 
        className={`bg-white rounded-2xl shadow-xl max-w-sm w-full transform transition-all duration-200 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${variantStyles[variant].icon}`}>
              <FiAlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="px-6 pb-6">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${variantStyles[variant].button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for managing confirm dialogs
export function useConfirmDialog() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'warning' | 'danger' | 'info'
    onConfirm?: () => void
  }>({
    isOpen: false,
    title: '',
    message: ''
  })

  const showConfirm = (options: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'warning' | 'danger' | 'info'
    onConfirm?: () => void
  }) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        ...options,
        isOpen: true,
        onConfirm: () => {
          options.onConfirm?.()
          setDialog(prev => ({ ...prev, isOpen: false }))
          resolve(true)
        }
      })
    })
  }

  const hideConfirm = () => {
    setDialog(prev => ({ ...prev, isOpen: false }))
  }

  return {
    dialog,
    showConfirm,
    hideConfirm,
    ConfirmDialog: (
      <ConfirmDialog
        {...dialog}
        onConfirm={dialog.onConfirm || (() => {})}
        onCancel={hideConfirm}
      />
    )
  }
}