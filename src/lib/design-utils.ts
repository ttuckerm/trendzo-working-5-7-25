import { designTokens } from './design-tokens';
import { twMerge } from 'tailwind-merge';
import { ClassValue, clsx } from 'clsx';

// Utility function to combine Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Button variants based on minimalist principles
export const buttonVariants = {
  // Primary variant with minimal visual noise
  primary: {
    base: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    disabled: 'bg-neutral-200 text-neutral-400 cursor-not-allowed',
  },
  // Secondary variant with even less visual noise
  secondary: {
    base: 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 focus:ring-neutral-400',
    disabled: 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
  },
  // Ghost variant for ultimate minimalism
  ghost: {
    base: 'bg-transparent text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-400',
    disabled: 'text-neutral-300 cursor-not-allowed',
  },
  // Outline variant for subtle emphasis
  outline: {
    base: 'bg-transparent border border-neutral-300 text-neutral-800 hover:bg-neutral-50 focus:ring-neutral-400',
    disabled: 'bg-transparent border border-neutral-200 text-neutral-400 cursor-not-allowed',
  },
  // Link variant for text-like buttons
  link: {
    base: 'bg-transparent text-primary-500 hover:underline focus:ring-primary-500 p-0 h-auto',
    disabled: 'bg-transparent text-neutral-400 cursor-not-allowed p-0 h-auto',
  },
};

// Button sizes based on accessibility principles
export const buttonSizes = {
  sm: 'text-xs px-2.5 py-1.5 rounded-md',
  md: 'text-sm px-4 py-2 rounded-md',
  lg: 'text-base px-6 py-3 rounded-lg',
  icon: {
    sm: 'p-1.5 rounded-md',
    md: 'p-2 rounded-md',
    lg: 'p-3 rounded-lg',
  },
};

// Card variants
export const cardVariants = {
  default: 'bg-white border border-neutral-200 rounded-lg shadow-sm',
  flat: 'bg-white border border-neutral-200 rounded-lg',
  elevated: 'bg-white border border-neutral-100 rounded-lg shadow-md',
  invisible: 'bg-transparent border-none',
};

// Input variants
export const inputVariants = {
  default: 'border border-neutral-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
  minimal: 'border-b border-neutral-300 px-0 py-2 text-sm focus:ring-0 focus:border-primary-500',
  invisible: 'border-0 bg-transparent text-sm focus:ring-0',
};

// Feedback indicator variants
export const feedbackIndicatorVariants = {
  success: 'text-success-DEFAULT bg-success-light border-success-DEFAULT',
  warning: 'text-warning-DEFAULT bg-warning-light border-warning-DEFAULT',
  error: 'text-error-DEFAULT bg-error-light border-error-DEFAULT',
  info: 'text-info-DEFAULT bg-info-light border-info-DEFAULT',
};

// Helper to generate transition styles based on design tokens
export function getTransition(speed: 'DEFAULT' | 'fast' | 'slow' = 'DEFAULT') {
  return designTokens.animations.transition[speed];
}

// Helper to apply focus styles consistently
export function getFocusStyles(variant: 'DEFAULT' | 'within' = 'DEFAULT') {
  return designTokens.focus[variant];
}

// Helper to get animation styles
export function getAnimation(animationType: keyof typeof designTokens.animations.animation) {
  return designTokens.animations.animation[animationType];
}

// Helper for responsive spacing
export function getResponsiveSpacing(base: keyof typeof designTokens.spacing, sm?: keyof typeof designTokens.spacing, md?: keyof typeof designTokens.spacing, lg?: keyof typeof designTokens.spacing) {
  let classes = `p-${base}`;
  
  if (sm) classes += ` sm:p-${sm}`;
  if (md) classes += ` md:p-${md}`;
  if (lg) classes += ` lg:p-${lg}`;
  
  return classes;
}

// Export all utilities
export const designUtils = {
  cn,
  buttonVariants,
  buttonSizes,
  cardVariants,
  inputVariants,
  feedbackIndicatorVariants,
  getTransition,
  getFocusStyles,
  getAnimation,
  getResponsiveSpacing,
};

export default designUtils; 