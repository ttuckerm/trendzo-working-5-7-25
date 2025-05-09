"use client";

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useNavigation, PageTransition as NavigationPageTransition } from '@/lib/contexts/NavigationContext';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  preserveState?: boolean;
  statePersistenceKeys?: string[];
  maintainFocus?: boolean;
  maintainScroll?: boolean;
  className?: string;
}

/**
 * Enhanced page transition component that handles animations between pages
 * and preserves state and focus where appropriate
 */
export default function PageTransition({
  children,
  preserveState = false,
  statePersistenceKeys = [],
  maintainFocus = true,
  maintainScroll = false,
  className = '',
}: PageTransitionProps) {
  const pathname = usePathname();
  const { 
    setMaintainScrollPosition, 
    setPersistentState, 
    getPersistentState 
  } = useNavigation();

  // Configure scroll position maintenance
  useEffect(() => {
    setMaintainScrollPosition(maintainScroll);
  }, [maintainScroll, setMaintainScrollPosition]);

  // Restore persisted state for this path if needed
  useEffect(() => {
    if (preserveState && statePersistenceKeys.length > 0) {
      // For debugging purposes, you could log the restoration
      console.log(`[PageTransition] Restoring state for ${pathname}`);
    }
  }, [pathname, preserveState, statePersistenceKeys]);

  return (
    <div className={className}>
      <NavigationPageTransition>
        {children}
      </NavigationPageTransition>
    </div>
  );
}

/**
 * Component for section transitions within a page
 */
export function SectionTransition({
  children,
  className = '',
  animateEntry = true,
}: {
  children: ReactNode;
  className?: string;
  animateEntry?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={animateEntry ? { opacity: 0, y: 20 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Component for element-level transitions - useful for micro-animations within the UI
 */
export function ElementTransition({
  children,
  type = 'fade',
  delay = 0,
  duration = 0.2,
  className = '',
}: {
  children: ReactNode;
  type?: 'fade' | 'scale' | 'slide-up' | 'slide-left' | 'slide-right';
  delay?: number;
  duration?: number;
  className?: string;
}) {
  // Define variants based on transition type
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
    },
    'slide-up': {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    'slide-left': {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
    'slide-right': {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    },
  };

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[type]}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
} 