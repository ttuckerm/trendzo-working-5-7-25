"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

// Define types for navigation history items
interface NavigationHistoryItem {
  path: string;
  state: Record<string, any>;
  timestamp: number;
}

// Define types for view transitions
type TransitionType = 'fade' | 'slide' | 'scale' | 'flip' | 'none';

interface TransitionConfig {
  type: TransitionType;
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

// Navigation context type
interface NavigationContextType {
  // Current and previous paths
  currentPath: string;
  previousPath: string | null;
  
  // Navigation history management
  navigationHistory: NavigationHistoryItem[];
  
  // State persistence across routes
  getPersistentState: <T>(key: string, defaultValue?: T) => T | undefined;
  setPersistentState: <T>(key: string, value: T) => void;
  
  // Navigation with state
  navigateTo: (path: string, transitionConfig?: TransitionConfig, state?: Record<string, any>) => void;
  
  // Transition management
  getTransitionFor: (fromPath: string, toPath: string) => TransitionConfig;
  
  // View relationship management
  relatedViews: Record<string, string[]>;
  registerRelatedView: (sourcePath: string, targetPath: string) => void;
  
  // Context awareness features
  isReturningToView: boolean;
  maintainScrollPosition: boolean;
  setMaintainScrollPosition: (maintain: boolean) => void;
  
  // Last active element on each screen (for maintaining focus)
  lastActiveElementByPath: Record<string, string>;
}

// Create the context with default values
const NavigationContext = createContext<NavigationContextType>({
  currentPath: '',
  previousPath: null,
  navigationHistory: [],
  getPersistentState: () => undefined,
  setPersistentState: () => {},
  navigateTo: () => {},
  getTransitionFor: () => ({ type: 'fade', duration: 300 }),
  relatedViews: {},
  registerRelatedView: () => {},
  isReturningToView: false,
  maintainScrollPosition: false,
  setMaintainScrollPosition: () => {},
  lastActiveElementByPath: {},
});

// Custom hook to use the navigation context
export const useNavigation = () => useContext(NavigationContext);

// Props for the provider
interface NavigationProviderProps {
  children: ReactNode;
  initialState?: Record<string, any>;
}

// Provider component
export const NavigationProvider: React.FC<NavigationProviderProps> = ({ 
  children, 
  initialState = {} 
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const isReducedMotion = false;
  const getAnimationDuration = (duration: number) => duration;
  
  // State for navigation tracking
  const [currentPath, setCurrentPath] = useState<string>(pathname || '');
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryItem[]>([]);
  const [persistentState, setPersistentState] = useState<Record<string, any>>(initialState);
  const [isReturningToView, setIsReturningToView] = useState(false);
  const [maintainScrollPosition, setMaintainScrollPosition] = useState(false);
  const [relatedViews, setRelatedViews] = useState<Record<string, string[]>>({});
  const [lastActiveElementByPath, setLastActiveElementByPath] = useState<Record<string, string>>({});
  
  // Route change detection
  useEffect(() => {
    if (pathname && pathname !== currentPath) {
      // Store the last active element before leaving the page
      if (document.activeElement instanceof HTMLElement) {
        const elementId = document.activeElement.id || document.activeElement.getAttribute('data-id');
        if (elementId) {
          setLastActiveElementByPath(prev => ({
            ...prev,
            [currentPath]: elementId
          }));
        }
      }
      
      // Check if we're going back to a previously visited path
      const isReturning = navigationHistory.some(item => item.path === pathname);
      setIsReturningToView(isReturning);
      
      // Update navigation history
      setPreviousPath(currentPath);
      setCurrentPath(pathname);
      
      // Capture current scroll position if needed
      if (maintainScrollPosition) {
        sessionStorage.setItem(`scroll_${currentPath}`, window.scrollY.toString());
      }
      
      // Add to history if not returning
      if (!isReturning) {
        setNavigationHistory(prev => [
          ...prev, 
          { 
            path: pathname, 
            state: {}, 
            timestamp: Date.now() 
          }
        ]);
      }
    }
  }, [pathname, currentPath, navigationHistory, maintainScrollPosition]);
  
  // Restore scroll position when returning to a view
  useEffect(() => {
    if (isReturningToView && maintainScrollPosition) {
      const savedScrollPosition = sessionStorage.getItem(`scroll_${currentPath}`);
      if (savedScrollPosition) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScrollPosition, 10));
        }, 100);
      }
    }
    
    // Restore focus to the last active element
    const lastElementId = lastActiveElementByPath[currentPath];
    if (lastElementId) {
      setTimeout(() => {
        const element = document.getElementById(lastElementId) || 
                        document.querySelector(`[data-id="${lastElementId}"]`);
        if (element instanceof HTMLElement) {
          element.focus();
        }
      }, 300);
    }
  }, [currentPath, isReturningToView, maintainScrollPosition, lastActiveElementByPath]);
  
  // Get persistent state
  const getPersistentState = <T,>(key: string, defaultValue?: T): T | undefined => {
    if (key in persistentState) {
      return persistentState[key] as T;
    }
    return defaultValue;
  };
  
  // Set persistent state
  const setPersistentStateValue = <T,>(key: string, value: T) => {
    setPersistentState(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Navigate to a new path with transition
  const navigateTo = (
    path: string, 
    transitionConfig?: TransitionConfig,
    state?: Record<string, any>
  ) => {
    // Save current state to history
    if (state) {
      setNavigationHistory(prev => {
        const newHistory = [...prev];
        const currentIndex = newHistory.findIndex(item => item.path === currentPath);
        
        if (currentIndex >= 0) {
          newHistory[currentIndex] = {
            ...newHistory[currentIndex],
            state: {
              ...newHistory[currentIndex].state,
              ...state
            }
          };
        }
        
        return newHistory;
      });
    }
    
    // Navigate to the new path
    router.push(path);
  };
  
  // Determine the appropriate transition for path pairs
  const getTransitionFor = (fromPath: string, toPath: string): TransitionConfig => {
    // If user prefers reduced motion, use a simple fade or no transition
    if (isReducedMotion) {
      return { type: 'fade', duration: 150 };
    }
    
    // Library to Editor transitions (zoom effect)
    if (fromPath.includes('template-library') && toPath.includes('editor')) {
      return { type: 'scale', duration: 400 };
    }
    
    // Editor to Preview transitions (slide right)
    if (fromPath.includes('editor') && toPath.includes('preview')) {
      return { type: 'slide', duration: 300, direction: 'left' };
    }
    
    // Analytics to Detail transitions (slide up)
    if (fromPath.includes('analytics') && toPath.includes('detail')) {
      return { type: 'slide', duration: 300, direction: 'up' };
    }
    
    // Related views should slide horizontally
    const isRelated = relatedViews[fromPath]?.includes(toPath) || relatedViews[toPath]?.includes(fromPath);
    if (isRelated) {
      // Determine direction (generally right to left for forward navigation)
      const direction = isReturningToView ? 'right' : 'left';
      return { type: 'slide', duration: 300, direction };
    }
    
    // Default transition is a fade
    return { type: 'fade', duration: 200 };
  };
  
  // Register related views for appropriate transitions
  const registerRelatedView = (sourcePath: string, targetPath: string) => {
    setRelatedViews(prev => {
      const newRelatedViews = { ...prev };
      
      // Add target to source's related views
      if (!newRelatedViews[sourcePath]) {
        newRelatedViews[sourcePath] = [];
      }
      if (!newRelatedViews[sourcePath].includes(targetPath)) {
        newRelatedViews[sourcePath] = [...newRelatedViews[sourcePath], targetPath];
      }
      
      // Also add source to target's related views for symmetry
      if (!newRelatedViews[targetPath]) {
        newRelatedViews[targetPath] = [];
      }
      if (!newRelatedViews[targetPath].includes(sourcePath)) {
        newRelatedViews[targetPath] = [...newRelatedViews[targetPath], sourcePath];
      }
      
      return newRelatedViews;
    });
  };
  
  // Create the context value
  const contextValue: NavigationContextType = {
    currentPath,
    previousPath,
    navigationHistory,
    getPersistentState,
    setPersistentState: setPersistentStateValue,
    navigateTo,
    getTransitionFor,
    relatedViews,
    registerRelatedView,
    isReturningToView,
    maintainScrollPosition,
    setMaintainScrollPosition,
    lastActiveElementByPath,
  };
  
  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

// PageTransition component to wrap pages with appropriate animations
interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const { currentPath, previousPath, getTransitionFor } = useNavigation();
  const transition = previousPath ? getTransitionFor(previousPath, currentPath) : { type: 'none', duration: 0 };
  
  // Define animation variants based on transition type
  const getVariants = () => {
    switch (transition.type) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
      case 'slide':
        // Check if the direction property exists in the transition object
        const slideTransition = transition as TransitionConfig;
        const direction = slideTransition.direction || 'left';
        const xOffset = direction === 'left' ? 20 : direction === 'right' ? -20 : 0;
        const yOffset = direction === 'up' ? 20 : direction === 'down' ? -20 : 0;
        
        return {
          initial: { opacity: 0, x: xOffset, y: yOffset },
          animate: { opacity: 1, x: 0, y: 0 },
          exit: { opacity: 0, x: -xOffset, y: -yOffset },
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.1 },
        };
      case 'flip':
        return {
          initial: { opacity: 0, rotateY: 90 },
          animate: { opacity: 1, rotateY: 0 },
          exit: { opacity: 0, rotateY: -90 },
        };
      case 'none':
      default:
        return {
          initial: { opacity: 1 },
          animate: { opacity: 1 },
          exit: { opacity: 1 },
        };
    }
  };
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPath}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={getVariants()}
        transition={{ duration: transition.duration / 1000 }}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}; 