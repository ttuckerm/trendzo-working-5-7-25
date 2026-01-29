'use client';

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { glassTokens } from '@/lib/design-system/glass-config';

export type GlassButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
export type GlassButtonSize = 'sm' | 'md' | 'lg';

export interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  glow?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<GlassButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-[#FF4757] to-[#FF6B7A] text-white',
  secondary: 'bg-gradient-to-r from-[#9B59B6] to-[#8E44AD] text-white',
  tertiary: 'bg-gradient-to-r from-[#00D9FF] to-[#00B4D8] text-[#0a0a0a]',
  ghost: 'bg-[rgba(26,26,26,0.5)] backdrop-blur-[40px] border border-[rgba(255,255,255,0.08)] text-white',
  danger: 'bg-gradient-to-r from-[#E74C3C] to-[#C0392B] text-white',
};

const sizeStyles: Record<GlassButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3.5 text-base rounded-2xl gap-2.5',
};

const glowStyles: Record<GlassButtonVariant, string> = {
  primary: 'shadow-[0_0_30px_rgba(255,71,87,0.4)]',
  secondary: 'shadow-[0_0_30px_rgba(155,89,182,0.4)]',
  tertiary: 'shadow-[0_0_30px_rgba(0,217,255,0.4)]',
  ghost: '',
  danger: 'shadow-[0_0_30px_rgba(231,76,60,0.4)]',
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    glow = false,
    loading = false,
    leftIcon,
    rightIcon,
    className,
    disabled,
    children,
    ...props
  }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center font-medium',
          'transition-shadow duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          glow && glowStyles[variant],
          className
        )}
        whileHover={!disabled ? { scale: 1.02 } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        transition={glassTokens.spring.snappy}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton';

export default GlassButton;
