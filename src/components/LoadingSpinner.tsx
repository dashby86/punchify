interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
  text?: string
  fullScreen?: boolean
}

export default function LoadingSpinner({ 
  size = 'medium', 
  color = 'blue-600',
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4'
  }

  const spinner = (
    <>
      <div className={`${sizeClasses[size]} border-${color} border-t-transparent rounded-full animate-spin`} />
      {text && (
        <p className={`mt-3 text-${size === 'small' ? 'xs' : size === 'medium' ? 'sm' : 'base'} text-gray-600`}>
          {text}
        </p>
      )}
    </>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
        {spinner}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center">
      {spinner}
    </div>
  )
}

export function LoadingOverlay({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
      <LoadingSpinner size="medium" text={text} />
    </div>
  )
}

export function ProcessingOverlay({ 
  text = 'Processing...', 
  progress 
}: { 
  text?: string
  progress?: number 
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-900 font-medium">{text}</p>
          
          {progress !== undefined && (
            <div className="w-full mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}