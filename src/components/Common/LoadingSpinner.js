import React from 'react'
import { School } from 'lucide-react'

const LoadingSpinner = ({ size = 'large', message = 'Cargando...' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  if (size === 'large') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <School className="h-12 w-12 text-blue-600 animate-pulse" />
            </div>
          </div>
          <div className="flex justify-center mb-4">
            <div className="spinner w-8 h-8"></div>
          </div>
          <p className="text-gray-600 text-lg">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-2">
          <div className={`spinner ${sizeClasses[size]}`}></div>
        </div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  )
}

export default LoadingSpinner