/**
 * Simple Button Component
 * Supports variants and sizes - Dark theme optimized
 */

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  children: React.ReactNode;
}

// Variant styles configuration for external use - Dark theme
export const buttonVariants = {
  variants: {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-zinc-600 bg-transparent text-white hover:bg-zinc-800 focus:ring-zinc-500',
    ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white focus:ring-zinc-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  },
  sizes: {
    default: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1.5 text-xs',
    lg: 'px-6 py-3 text-base',
  },
  base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed',
};

export function Button({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${buttonVariants.base} ${buttonVariants.variants[variant]} ${buttonVariants.sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
