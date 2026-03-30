import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimation, AnimationVariant } from '@/lib/hooks/useAnimation';

interface AnimatedContainerProps {
  children: ReactNode;
  show?: boolean;
  variant?: AnimationVariant;
  duration?: number;
  delay?: number;
  className?: string;
  layoutId?: string;
  onExitComplete?: () => void;
}

/**
 * AnimatedContainer is a wrapper component that applies consistent animations 
 * to its children when they mount, unmount, or when the `show` prop changes.
 * 
 * Use this component to wrap sections, cards, modals, or any UI element
 * that should animate in/out of the view.
 */
export function AnimatedContainer({
  children,
  show = true,
  variant = 'fadeIn',
  duration = 200,
  delay = 0,
  className = '',
  layoutId,
  onExitComplete
}: AnimatedContainerProps) {
  const { getFramerMotionProps, isEnabled } = useAnimation();
  
  // Get animation properties based on the variant
  const motionProps = getFramerMotionProps({
    variant,
    duration,
    delay,
  });
  
  // If animations are disabled, just render children
  if (!isEnabled) {
    return <div className={className}>{show && children}</div>;
  }
  
  return (
    <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
      {show && (
        <motion.div
          className={className}
          layoutId={layoutId}
          initial={motionProps.initial}
          animate={motionProps.animate}
          exit={motionProps.exit}
          transition={motionProps.transition}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * AnimatedList applies staggered animations to a list of items
 */
interface AnimatedListProps {
  children: ReactNode[];
  show?: boolean;
  variant?: AnimationVariant;
  staggerDelay?: number;
  className?: string;
  itemClassName?: string;
}

export function AnimatedList({
  children,
  show = true,
  variant = 'fadeIn',
  staggerDelay = 0.05,
  className = '',
  itemClassName = ''
}: AnimatedListProps) {
  const { getFramerMotionProps, isEnabled } = useAnimation();
  
  // Get base animation properties
  const motionProps = getFramerMotionProps({
    variant,
  });
  
  // If animations are disabled or nothing to show
  if (!isEnabled || !show || children.length === 0) {
    return (
      <div className={className}>
        {show && children.map((child, i) => (
          <div key={i} className={itemClassName}>
            {child}
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <motion.div className={className}>
      <AnimatePresence>
        {show && children.map((child, i) => (
          <motion.div
            key={i}
            className={itemClassName}
            initial={motionProps.initial}
            animate={motionProps.animate}
            exit={motionProps.exit}
            transition={{
              ...motionProps.transition,
              delay: staggerDelay * i,
            }}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * AnimatedTransition component handles element replacement with animation
 */
interface AnimatedTransitionProps {
  children: ReactNode;
  show: boolean;
  fallback?: ReactNode;
  variant?: AnimationVariant;
  duration?: number;
  className?: string;
}

export function AnimatedTransition({
  children,
  show,
  fallback,
  variant = 'fadeIn',
  duration = 200,
  className = ''
}: AnimatedTransitionProps) {
  const { getFramerMotionProps, isEnabled } = useAnimation();
  
  // Get animation properties
  const motionProps = getFramerMotionProps({
    variant,
    duration,
  });
  
  // If animations are disabled
  if (!isEnabled) {
    return <div className={className}>{show ? children : fallback}</div>;
  }
  
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {show ? (
          <motion.div
            key="content"
            initial={motionProps.initial}
            animate={motionProps.animate}
            exit={motionProps.exit}
            transition={motionProps.transition}
          >
            {children}
          </motion.div>
        ) : fallback ? (
          <motion.div
            key="fallback"
            initial={motionProps.initial}
            animate={motionProps.animate}
            exit={motionProps.exit}
            transition={motionProps.transition}
          >
            {fallback}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default AnimatedContainer; 