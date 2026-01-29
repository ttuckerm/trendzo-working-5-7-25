'use client';

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { glassTokens } from '@/lib/design-system/glass-config';

export type GlassCardVariant = 'default' | 'elevated' | 'interactive' | 'video' | 'subtle';

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: GlassCardVariant;
  glowColor?: string;
  disableHoverEffects?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<GlassCardVariant, string> = {
  default: 'bg-[rgba(26,26,26,0.8)] backdrop-blur-[40px] border border-[rgba(255,255,255,0.08)]',
  elevated: 'bg-[rgba(26,26,26,0.9)] backdrop-blur-[60px] border border-[rgba(255,255,255,0.08)] shadow-glass-lg',
  interactive: 'bg-[rgba(26,26,26,0.7)] backdrop-blur-[40px] border border-[rgba(255,255,255,0.08)] cursor-pointer',
  video: 'bg-black/40 backdrop-blur-sm border border-[rgba(255,255,255,0.08)] overflow-hidden aspect-[9/16]',
  subtle: 'bg-[rgba(26,26,26,0.5)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.04)]',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({
    variant = 'default',
    glowColor,
    disableHoverEffects = false,
    className,
    children,
    ...props
  }, ref) => {
    const isInteractive = variant === 'interactive' || !!props.onClick;

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative rounded-2xl overflow-hidden',
          variantStyles[variant],
          className
        )}
        style={{
          boxShadow: glowColor ? `0 0 40px ${glowColor}` : undefined,
          WebkitBackdropFilter: variant === 'default' ? 'blur(40px) saturate(180%)' : undefined,
        }}
        whileHover={
          isInteractive && !disableHoverEffects
            ? {
                y: -4,
                scale: 1.01,
              }
            : undefined
        }
        whileTap={
          isInteractive && !disableHoverEffects
            ? { scale: 0.98 }
            : undefined
        }
        transition={glassTokens.spring.snappy}
        {...props}
      >
        {/* Cool-toned glass tint overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(100, 150, 255, 0.03) 0%, transparent 100%)',
          }}
        />

        {/* Inset highlight at top */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)',
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
