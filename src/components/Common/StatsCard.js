import React from 'react';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  color = 'primary',
  className = '',
  loading = false 
}) => {
  const colorClasses = {
    primary: 'from-primary-500/20 to-primary-600/20 border-primary-300/30',
    secondary: 'from-secondary-500/20 to-secondary-600/20 border-secondary-300/30',
    success: 'from-success-500/20 to-success-600/20 border-success-300/30',
    warning: 'from-warning-500/20 to-warning-600/20 border-warning-300/30',
    danger: 'from-danger-500/20 to-danger-600/20 border-danger-300/30'
  };

  const iconColorClasses = {
    primary: 'text-primary-600 bg-primary-100',
    secondary: 'text-secondary-600 bg-secondary-100',
    success: 'text-success-600 bg-success-100',
    warning: 'text-warning-600 bg-warning-100',
    danger: 'text-danger-600 bg-danger-100'
  };

  if (loading) {
    return (
      <div className={`backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl p-6 shadow-glass animate-pulse ${className}`}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-white/20 rounded w-24"></div>
            <div className="h-8 bg-white/20 rounded w-16"></div>
          </div>
          <div className="h-12 w-12 bg-white/20 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      backdrop-blur-lg bg-gradient-to-br ${colorClasses[color]} 
      border border-white/20 rounded-2xl p-6 shadow-glass 
      hover:shadow-glass-lg transition-all duration-300 
      hover:scale-105 animate-fade-in
      ${className}
    `}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-800 animate-bounce-in">
            {value}
          </p>
          {trend && trendValue && (
            <div className="flex items-center space-x-1">
              {trend === 'up' ? (
                <TrendingUpIcon className="h-4 w-4 text-success-500" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 text-danger-500" />
              )}
              <span className={`text-sm font-medium ${
                trend === 'up' ? 'text-success-600' : 'text-danger-600'
              }`}>
                {trendValue}
              </span>
              <span className="text-sm text-gray-500">vs mes anterior</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`
            p-3 rounded-xl ${iconColorClasses[color]} 
            shadow-lg transform transition-transform duration-300 
            hover:scale-110 hover:rotate-6
          `}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;