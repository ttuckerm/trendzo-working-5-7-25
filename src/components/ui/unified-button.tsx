/**
 * Unified Button Component
 * 
 * This component provides a consistent Button interface regardless of the underlying implementation.
 * It attempts to import the standard Button component and falls back to a simple implementation if needed.
 */

import React, { forwardRef } from 'react';
import { resolveComponents } from '@/lib/utils/import-resolver';

// Try to import from button-component.tsx (standard implementation)
let Button: any;
try {
  const buttonModule = require('./button-component');
  Button = buttonModule.Button;
} catch (error) {
  // If import fails, provide a simple implementation
  Button = forwardRef<
    HTMLButtonElement, 
    React.ButtonHTMLAttributes<HTMLButtonElement> & { 
      variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'link';
      size?: 'default' | 'sm' | 'lg' | 'icon';
      asChild?: boolean;
    }
  >(({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const getVariantClasses = () => {
      switch (variant) {
        case 'default':
          return 'bg-blue-500 text-white hover:bg-blue-600';
        case 'destructive':
          return 'bg-red-500 text-white hover:bg-red-600';
        case 'outline':
          return 'border border-gray-300 bg-white hover:bg-gray-100 text-gray-700';
        case 'secondary':
          return 'bg-gray-200 text-gray-800 hover:bg-gray-300';
        case 'ghost':
          return 'hover:bg-gray-100 text-gray-700';
        case 'link':
          return 'text-blue-500 underline-offset-4 hover:underline';
        default:
          return 'bg-blue-500 text-white hover:bg-blue-600';
      }
    };

    const getSizeClasses = () => {
      switch (size) {
        case 'default':
          return 'h-9 px-4 py-2';
        case 'sm':
          return 'h-8 rounded-md px-3 text-xs';
        case 'lg':
          return 'h-10 rounded-md px-8';
        case 'icon':
          return 'h-9 w-9';
        default:
          return 'h-9 px-4 py-2';
      }
    };

    return (
      <button
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${getVariantClasses()} ${getSizeClasses()} ${className || ""}`}
        ref={ref}
        {...props}
      />
    );
  });
  Button.displayName = 'Button';
}

// Resolve with component info
const {
  Button: ResolvedButton
} = resolveComponents({
  Button: {
    component: Button,
    displayName: 'Button'
  }
});

export { ResolvedButton as Button };

// Also export as default for dynamic imports
export default { Button: ResolvedButton }; 