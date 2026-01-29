"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useStateContext } from '@/lib/contexts/StateContext';

interface AppIntegrationProps {
  children: React.ReactNode;
  disableAnimations?: boolean;
  preserveScroll?: boolean;
}

// Define transition direction patterns for different routes
const getTransitionDirection = (from: string, to: string): 'left' | 'right' | 'up' | 'down' | 'fade' => {
  // From template library to editor (go deeper)
  if (from?.includes('template-library') && to?.includes('editor')) {
    return 'left';
  }
  
  // From editor back to template library (go back)
  if (from?.includes('editor') && to?.includes('template-library')) {
    return 'right';
  }
  
  // From dashboard to analytics (go deeper)
  if (from?.includes('dashboard') && to?.includes('analytics')) {
    return 'left';
  }
  
  // From analytics back to dashboard (go back)
  if (from?.includes('analytics') && to?.includes('dashboard')) {
    return 'right';
  }
  
  // From landing to auth (move up)
  if ((from === '/' || from === '') && to?.includes('auth')) {
    return 'up';
  }
  
  // Default: use a simple fade transition
  return 'fade';
};

/**
 * Main integration component that provides seamless transitions
 * and state persistence between different application views
 */
export default function AppIntegration({ 
  children, 
  disableAnimations = false,
  preserveScroll = true 
}: AppIntegrationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { getState, setState } = useStateContext();
  
  // Get previous path from state
  const previousPath = getState<string>('navigation.previousPath');
  
  // Track path changes for navigation history
  useEffect(() => {
    if (pathname) {
      const currentPath = getState<string>('navigation.currentPath');
      if (currentPath && currentPath !== pathname) {
        setState('navigation.previousPath', currentPath);
      }
      setState('navigation.currentPath', pathname);
    }
  }, [pathname, setState, getState]);
  
  // Determine transition direction based on navigation path
  const direction = previousPath && pathname 
    ? getTransitionDirection(previousPath, pathname)
    : 'fade';
  
  // Restore scroll position when returning to certain pages
  useEffect(() => {
    if (!preserveScroll) return;
    
    if (pathname?.includes('template-library')) {
      const savedScrollPosition = getState<number>('templateLibrary.scrollPosition');
      if (savedScrollPosition && savedScrollPosition > 0) {
        setTimeout(() => {
          window.scrollTo(0, savedScrollPosition);
        }, 100);
      }
    }
  }, [pathname, getState, preserveScroll]);
  
  // Define transition variants for different directions
  const getVariants = (direction: string) => {
    switch (direction) {
      case 'left':
        return {
          hidden: { opacity: 0, x: 300 },
          visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
          exit: { opacity: 0, x: -300, transition: { duration: 0.3 } }
        };
      case 'right':
        return {
          hidden: { opacity: 0, x: -300 },
          visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
          exit: { opacity: 0, x: 300, transition: { duration: 0.3 } }
        };
      case 'up':
        return {
          hidden: { opacity: 0, y: 200 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
          exit: { opacity: 0, y: -200, transition: { duration: 0.3 } }
        };
      case 'down':
        return {
          hidden: { opacity: 0, y: -200 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
          exit: { opacity: 0, y: 200, transition: { duration: 0.3 } }
        };
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.3 } },
          exit: { opacity: 0, transition: { duration: 0.3 } }
        };
    }
  };
  
  // Skip animations for users who prefer reduced motion
  const prefersReducedMotion = 
    typeof window !== 'undefined' && 
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    
  // If animations are disabled or reduced motion is preferred, render without transitions
  if (disableAnimations || prefersReducedMotion) {
    return <div className="w-full h-full">{children}</div>;
  }
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={getVariants(direction)}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
} 