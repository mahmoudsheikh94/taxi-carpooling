import { forwardRef } from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink';
  variant?: 'solid' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, color = 'gray', variant = 'solid', size = 'md', className = '', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center font-medium rounded-full';
    
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-0.5 text-sm',
    };

    const colorClasses = {
      solid: {
        gray: 'bg-gray-100 text-gray-800',
        red: 'bg-red-100 text-red-800',
        yellow: 'bg-yellow-100 text-yellow-800',
        green: 'bg-green-100 text-green-800',
        blue: 'bg-blue-100 text-blue-800',
        indigo: 'bg-indigo-100 text-indigo-800',
        purple: 'bg-purple-100 text-purple-800',
        pink: 'bg-pink-100 text-pink-800',
      },
      outline: {
        gray: 'border border-gray-200 text-gray-600',
        red: 'border border-red-200 text-red-600',
        yellow: 'border border-yellow-200 text-yellow-600',
        green: 'border border-green-200 text-green-600',
        blue: 'border border-blue-200 text-blue-600',
        indigo: 'border border-indigo-200 text-indigo-600',
        purple: 'border border-purple-200 text-purple-600',
        pink: 'border border-pink-200 text-pink-600',
      },
    };

    const classes = [
      baseClasses,
      sizeClasses[size],
      colorClasses[variant][color],
      className,
    ].join(' ');

    return (
      <span ref={ref} className={classes} {...props}>
        {children}
      </span>
    );
  }
);