import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  className?: string;
}

const variants = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  default: 'bg-gray-100 text-gray-700',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {variant === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>}
      {variant === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5"></span>}
      {variant === 'danger' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>}
      {children}
    </span>
  );
}
