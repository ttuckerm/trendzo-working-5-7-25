import React, { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/design-utils';
import { useAnimation } from '@/lib/hooks/useAnimation';
import { animations } from '@/lib/design-tokens';

export type InteractiveVariant = 'button' | 'card' | 'input' | 'link' | 'scale' | 'highlight' | 'expandable' | 'fade' | 'custom';

interface InteractiveElementProps {
  /**
   * Content to wrap with interactive animations
   */
  children: ReactNode | (({ isHovered }: { isHovered: boolean }) => ReactNode);
  
  /**
   * Element type variant that determines animation behavior
   */
  variant?: InteractiveVariant;
  
  /**
   * Additional class names
   */
  className?: string;
  
  /**
   * Whether the element is disabled
   */
  disabled?: boolean;
  
  /**
   * Function called when element is clicked
   */
  onClick?: () => void;
  
  /**
   * Whether to track hover state for component consumers
   */
  trackHover?: boolean;
  
  /**
   * Custom animation values override (for custom variant)
   */
  customAnimation?: {
    scale?: number;
    hoverScale?: number;
    tapScale?: number;
    transition?: { duration: number; ease: string };
  };
  
  /**
   * Whether the element is focusable (for accessibility)
   */
  focusable?: boolean;
}

/**
 * InteractiveElement adds consistent, subtle animations to interactive elements
 * throughout the application based on the element type.
 */
export function InteractiveElement({
  children,
  variant = 'button',
  className = '',
  disabled = false,
  onClick,
  trackHover = false,
  customAnimation = {},
  focusable = true,
  ...props
}: InteractiveElementProps) {
  const { isEnabled, getInteractionTransition } = useAnimation();
  const [isHovered, setIsHovered] = useState(false);
  
  // If animations are disabled or element is disabled, render without animations
  if (!isEnabled || disabled) {
    return (
      <div 
        className={cn(className, { 'opacity-60 cursor-not-allowed': disabled })}
        onClick={disabled ? undefined : onClick}
        tabIndex={focusable && !disabled ? 0 : -1}
        aria-disabled={disabled}
        {...props}
      >
        {typeof children === 'function' 
          ? (children as ({ isHovered }: { isHovered: boolean }) => ReactNode)({ isHovered })
          : children}
      </div>
    );
  }
  
  // Get animation properties based on variant
  const getAnimationProps = () => {
    // Default animation properties
    const defaults = {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
      transition: { duration: 0.2, ease: 'easeInOut' }
    };
    
    // Custom animations override defaults
    if (variant === 'custom' && customAnimation) {
      return {
        whileHover: { scale: customAnimation.hoverScale || 1.02 },
        whileTap: { scale: customAnimation.tapScale || 0.98 },
        transition: customAnimation.transition || defaults.transition
      };
    }
    
    // Variant-specific animations
    switch (variant) {
      case 'button':
        return {
          whileHover: { scale: 1.03 },
          whileTap: { scale: 0.97 },
          transition: { duration: 0.2, ease: 'easeInOut' }
        };
      case 'card':
        return {
          whileHover: { scale: 1.01, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' },
          whileTap: { scale: 0.99 },
          transition: { duration: 0.3, ease: 'easeInOut' }
        };
      case 'input':
        return {
          whileHover: { boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.15)' },
          whileFocus: { boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.25)' },
          transition: { duration: 0.2, ease: 'easeInOut' }
        };
      case 'link':
        return {
          whileHover: { textDecoration: 'underline' },
          transition: { duration: 0.15, ease: 'easeInOut' }
        };
      case 'scale':
        return {
          whileHover: { scale: 1.03 },
          whileTap: { scale: 0.98 },
          transition: { duration: 0.2, ease: 'easeInOut' }
        };
      case 'highlight':
        return {
          whileHover: { backgroundColor: 'rgba(0, 0, 0, 0.05)' },
          transition: { duration: 0.2, ease: 'easeInOut' }
        };
      case 'expandable':
        return {
          whileHover: { height: 'auto' },
          transition: { duration: 0.3, ease: 'easeInOut' }
        };
      case 'fade':
        return {
          whileHover: { opacity: 0.8 },
          transition: { duration: 0.2, ease: 'easeInOut' }
        };
      default:
        return defaults;
    }
  };
  
  // Use Tailwind classes for transitions when possible
  const getInteractionClass = () => {
    // If custom animation is provided, use Framer Motion instead
    if (variant === 'custom' && customAnimation) {
      return '';
    }
    
    // Convert variant to accepted type for getInteractionTransition
    const interactionType = 
      variant === 'button' || variant === 'card' || variant === 'input' || variant === 'link'
        ? variant
        : 'button'; // default fallback
    
    return getInteractionTransition(interactionType);
  };
  
  // Get the appropriate properties based on whether to use CSS or Framer Motion
  const animationProps = getAnimationProps();
  const interactionClass = getInteractionClass();
  
  // For variants that use Framer Motion
  if (
    variant === 'custom' || 
    variant === 'input' || 
    variant === 'expandable'
  ) {
    return (
      <motion.div
        className={className}
        onClick={onClick}
        onHoverStart={trackHover ? () => setIsHovered(true) : undefined}
        onHoverEnd={trackHover ? () => setIsHovered(false) : undefined}
        tabIndex={focusable ? 0 : -1}
        {...animationProps}
        {...props}
      >
        {typeof children === 'function'
          ? (children as ({ isHovered }: { isHovered: boolean }) => ReactNode)({ isHovered })
          : children}
      </motion.div>
    );
  }
  
  // For variants that can use CSS transitions (better performance)
  return (
    <div
      className={cn(
        className,
        interactionClass
      )}
      onClick={onClick}
      onMouseEnter={trackHover ? () => setIsHovered(true) : undefined}
      onMouseLeave={trackHover ? () => setIsHovered(false) : undefined}
      tabIndex={focusable ? 0 : -1}
      {...props}
    >
      {typeof children === 'function'
        ? (children as ({ isHovered }: { isHovered: boolean }) => ReactNode)({ isHovered })
        : children}
    </div>
  );
}

/**
 * Shorthand components for specific interactive elements
 */
export function InteractiveButton(props: Omit<InteractiveElementProps, 'variant'>) {
  return <InteractiveElement variant="button" {...props} />;
}

export function InteractiveCard(props: Omit<InteractiveElementProps, 'variant'>) {
  return <InteractiveElement variant="card" {...props} />;
}

export function InteractiveLink(props: Omit<InteractiveElementProps, 'variant'>) {
  return <InteractiveElement variant="link" {...props} />;
}

export default InteractiveElement; 