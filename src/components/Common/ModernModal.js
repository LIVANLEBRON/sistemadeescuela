import React, { useEffect } from 'react';
import { XIcon } from 'lucide-react';
import ModernButton from './ModernButton';

const ModernModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`
            relative w-full ${sizeClasses[size]} 
            backdrop-blur-lg bg-white/95 border border-white/20 
            rounded-2xl shadow-glass-lg 
            transform transition-all duration-300 
            animate-slide-up
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              {title && (
                <h3 className="text-xl font-semibold text-gray-800">
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="
                    p-2 rounded-xl text-gray-500 hover:text-gray-700 
                    hover:bg-gray-100/50 transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary-500/50
                  "
                >
                  <XIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = '¿Estás seguro?', 
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}) => {
  return (
    <ModernModal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-gray-600">{message}</p>
        <div className="flex space-x-3 justify-end">
          <ModernButton 
            variant="ghost" 
            onClick={onClose}
          >
            {cancelText}
          </ModernButton>
          <ModernButton 
            variant={variant} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </ModernButton>
        </div>
      </div>
    </ModernModal>
  );
};

export { ModernModal, ConfirmModal };
export default ModernModal;