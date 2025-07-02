import React from 'react';

const ModernCard = ({ children, className = '', variant = 'default', ...props }) => {
  const baseClasses = 'backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-glass transition-all duration-300 hover:shadow-glass-lg hover:bg-white/15';
  
  const variants = {
    default: 'p-6',
    compact: 'p-4',
    large: 'p-8',
    gradient: 'bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border-primary-300/30'
  };

  return (
    <div 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default ModernCard;