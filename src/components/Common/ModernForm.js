import React from 'react';
import { AlertCircleIcon, CheckCircleIcon } from 'lucide-react';

const ModernInput = ({ 
  label, 
  error, 
  success, 
  icon, 
  className = '', 
  ...props 
}) => {
  const inputClasses = `
    w-full px-4 py-3 pl-${icon ? '12' : '4'} 
    backdrop-blur-lg bg-white/20 border border-white/30 
    rounded-xl text-gray-800 placeholder-gray-500
    focus:outline-none focus:ring-4 focus:ring-primary-500/50 
    focus:border-primary-500 focus:bg-white/30
    transition-all duration-300
    ${error ? 'border-danger-500 focus:ring-danger-500/50' : ''}
    ${success ? 'border-success-500 focus:ring-success-500/50' : ''}
  `;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500">{icon}</span>
          </div>
        )}
        <input className={inputClasses} {...props} />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <AlertCircleIcon className="h-5 w-5 text-danger-500" />
          </div>
        )}
        {success && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-success-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-danger-600 flex items-center space-x-1">
          <AlertCircleIcon className="h-4 w-4" />
          <span>{error}</span>
        </p>
      )}
      {success && (
        <p className="text-sm text-success-600 flex items-center space-x-1">
          <CheckCircleIcon className="h-4 w-4" />
          <span>{success}</span>
        </p>
      )}
    </div>
  );
};

const ModernSelect = ({ 
  label, 
  options, 
  error, 
  className = '', 
  ...props 
}) => {
  const selectClasses = `
    w-full px-4 py-3 
    backdrop-blur-lg bg-white/20 border border-white/30 
    rounded-xl text-gray-800
    focus:outline-none focus:ring-4 focus:ring-primary-500/50 
    focus:border-primary-500 focus:bg-white/30
    transition-all duration-300
    ${error ? 'border-danger-500 focus:ring-danger-500/50' : ''}
  `;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <select className={selectClasses} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-danger-600 flex items-center space-x-1">
          <AlertCircleIcon className="h-4 w-4" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

const ModernTextarea = ({ 
  label, 
  error, 
  className = '', 
  rows = 4,
  ...props 
}) => {
  const textareaClasses = `
    w-full px-4 py-3 
    backdrop-blur-lg bg-white/20 border border-white/30 
    rounded-xl text-gray-800 placeholder-gray-500
    focus:outline-none focus:ring-4 focus:ring-primary-500/50 
    focus:border-primary-500 focus:bg-white/30
    transition-all duration-300 resize-none
    ${error ? 'border-danger-500 focus:ring-danger-500/50' : ''}
  `;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <textarea 
        className={textareaClasses} 
        rows={rows}
        {...props} 
      />
      {error && (
        <p className="text-sm text-danger-600 flex items-center space-x-1">
          <AlertCircleIcon className="h-4 w-4" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

const ModernForm = ({ children, className = '', ...props }) => {
  return (
    <form 
      className={`space-y-6 backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-8 shadow-glass ${className}`}
      {...props}
    >
      {children}
    </form>
  );
};

export { ModernForm, ModernInput, ModernSelect, ModernTextarea };