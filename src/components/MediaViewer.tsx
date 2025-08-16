import { useState, useEffect } from 'react'
import { FiX, FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi'
import { type MediaFile } from '@/lib/storage'

interface MediaViewerProps {
  media: MediaFile[]
  initialIndex?: number
  onClose: () => void
}

export default function MediaViewer({ media, initialIndex = 0, onClose }: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        navigatePrevious()
      } else if (e.key === 'ArrowRight') {
        navigateNext()
      }
    }

    document.addEventListener('keydown', handleKeydown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'auto'
    }
  }, [currentIndex])

  const navigatePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))
  }

  const navigateNext = () => {
    setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      navigateNext()
    } else if (isRightSwipe) {
      navigatePrevious()
    }
  }

  const downloadMedia = () => {
    const currentMedia = media[currentIndex]
    const link = document.createElement('a')
    link.href = currentMedia.url
    link.download = `media-${currentIndex + 1}.${currentMedia.type === 'image' ? 'jpg' : currentMedia.type === 'video' ? 'mp4' : 'mp3'}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const currentMedia = media[currentIndex]

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
          
          <div className="text-white text-sm font-medium">
            {currentIndex + 1} / {media.length}
          </div>
          
          <button
            onClick={downloadMedia}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <FiDownload className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media Content */}
      <div 
        className="flex-1 flex items-center justify-center relative px-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous Button */}
        {media.length > 1 && (
          <button
            onClick={navigatePrevious}
            className="absolute left-4 w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
          >
            <FiChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Media Display */}
        <div className="max-w-full max-h-full flex items-center justify-center">
          {currentMedia.type === 'image' ? (
            <img 
              src={currentMedia.url}
              alt={`Media ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
          ) : currentMedia.type === 'video' ? (
            <video
              src={currentMedia.url}
              controls
              autoPlay
              className="max-w-full max-h-full"
              playsInline
            />
          ) : (
            <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full">
              <div className="text-white text-center mb-6">
                <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Audio Recording</h3>
                <p className="text-gray-400 text-sm">Audio {currentIndex + 1}</p>
              </div>
              <audio
                src={currentMedia.url}
                controls
                autoPlay
                className="w-full"
              />
              {currentMedia.transcript && (
                <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">Transcript:</p>
                  <p className="text-white text-sm italic">"{currentMedia.transcript}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Next Button */}
        {media.length > 1 && (
          <button
            onClick={navigateNext}
            className="absolute right-4 w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
          >
            <FiChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Thumbnail Strip */}
      {media.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex gap-2 overflow-x-auto py-2 px-4 scrollbar-hide">
            {media.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {item.type === 'image' ? (
                  <img 
                    src={item.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : item.type === 'video' ? (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}