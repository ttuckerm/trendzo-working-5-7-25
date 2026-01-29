'use client'

import { useState, useCallback, useEffect } from 'react'
import { InterfaceMode, ModeConfiguration, ComponentPriority, TransitionSettings } from '@/types/unified-interface'

// Mode Configurations based on Creative Phase Design
const MODE_CONFIGURATIONS: Record<InterfaceMode, ModeConfiguration> = {
  focus: {
    mode: 'focus',
    layerVisibility: {
      primary: true,
      secondary: false,
      tertiary: false
    },
    componentPriorities: [
      { componentId: 'system-health', priority: 1, loadOrder: 1 },
      { componentId: 'prediction-summary', priority: 2, loadOrder: 2 },
      { componentId: 'quick-actions', priority: 3, loadOrder: 3 },
      { componentId: 'essential-metrics', priority: 4, loadOrder: 4 }
    ],
    transitionSettings: {
      duration: 200,
      easing: 'easeInOut',
      stagger: 50
    }
  },
  deepdive: {
    mode: 'deepdive',
    layerVisibility: {
      primary: true,
      secondary: true,
      tertiary: false
    },
    componentPriorities: [
      { componentId: 'system-health', priority: 1, loadOrder: 1 },
      { componentId: 'recipe-book-panel', priority: 2, loadOrder: 2 },
      { componentId: 'armory-slideout', priority: 3, loadOrder: 3 },
      { componentId: 'analytics-widgets', priority: 4, loadOrder: 4 },
      { componentId: 'prediction-summary', priority: 5, loadOrder: 5 }
    ],
    transitionSettings: {
      duration: 300,
      easing: 'easeInOut',
      stagger: 75
    }
  },
  demo: {
    mode: 'demo',
    layerVisibility: {
      primary: true,
      secondary: true,
      tertiary: true
    },
    componentPriorities: [
      { componentId: 'objectives-visualization', priority: 1, loadOrder: 1 },
      { componentId: 'real-time-poc', priority: 2, loadOrder: 2 },
      { componentId: 'success-metrics', priority: 3, loadOrder: 3 },
      { componentId: 'stakeholder-dashboard', priority: 4, loadOrder: 4 },
      { componentId: 'system-health', priority: 5, loadOrder: 5 }
    ],
    transitionSettings: {
      duration: 400,
      easing: 'easeInOut',
      stagger: 100
    }
  }
}

// Hook for managing interface modes
export function useModeManager(initialMode: InterfaceMode = 'focus') {
  const [currentMode, setCurrentMode] = useState<InterfaceMode>(initialMode)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [previousMode, setPreviousMode] = useState<InterfaceMode | null>(null)

  // Get current mode configuration
  const getCurrentConfig = useCallback((): ModeConfiguration => {
    return MODE_CONFIGURATIONS[currentMode]
  }, [currentMode])

  // Check if a layer should be visible in current mode
  const isLayerVisible = useCallback((layer: 'primary' | 'secondary' | 'tertiary'): boolean => {
    return getCurrentConfig().layerVisibility[layer]
  }, [getCurrentConfig])

  // Get component priorities for current mode
  const getComponentPriorities = useCallback((): ComponentPriority[] => {
    return getCurrentConfig().componentPriorities
  }, [getCurrentConfig])

  // Get component priority by ID
  const getComponentPriority = useCallback((componentId: string): number => {
    const priorities = getComponentPriorities()
    const component = priorities.find(p => p.componentId === componentId)
    return component?.priority || 999
  }, [getComponentPriorities])

  // Get component load order
  const getComponentLoadOrder = useCallback((componentId: string): number => {
    const priorities = getComponentPriorities()
    const component = priorities.find(p => p.componentId === componentId)
    return component?.loadOrder || 999
  }, [getComponentPriorities])

  // Switch to a new mode
  const switchMode = useCallback(async (newMode: InterfaceMode): Promise<void> => {
    if (newMode === currentMode || isTransitioning) return

    setIsTransitioning(true)
    setPreviousMode(currentMode)

    const config = MODE_CONFIGURATIONS[newMode]
    
    try {
      // Wait for transition duration
      await new Promise(resolve => setTimeout(resolve, config.transitionSettings.duration))
      
      setCurrentMode(newMode)
    } catch (error) {
      console.error('Mode transition failed:', error)
      // Revert to previous mode on error
      setCurrentMode(currentMode)
    } finally {
      setIsTransitioning(false)
    }
  }, [currentMode, isTransitioning])

  // Get transition settings for current mode
  const getTransitionSettings = useCallback((): TransitionSettings => {
    return getCurrentConfig().transitionSettings
  }, [getCurrentConfig])

  // Check if component should be loaded in current mode
  const shouldLoadComponent = useCallback((componentId: string): boolean => {
    const priorities = getComponentPriorities()
    return priorities.some(p => p.componentId === componentId)
  }, [getComponentPriorities])

  // Get components sorted by load order
  const getComponentsByLoadOrder = useCallback((): ComponentPriority[] => {
    const priorities = getComponentPriorities()
    return [...priorities].sort((a, b) => a.loadOrder - b.loadOrder)
  }, [getComponentPriorities])

  // Predict optimal mode based on usage patterns (placeholder for adaptive intelligence)
  const predictOptimalMode = useCallback((context: any): InterfaceMode => {
    // This would integrate with adaptive intelligence in Phase 4
    // For now, return current mode
    return currentMode
  }, [currentMode])

  // Get mode-specific CSS classes
  const getModeClasses = useCallback((): string => {
    const baseClasses = 'unified-interface'
    const modeClasses = `mode-${currentMode}`
    const transitionClasses = isTransitioning ? 'transitioning' : ''
    
    return `${baseClasses} ${modeClasses} ${transitionClasses}`.trim()
  }, [currentMode, isTransitioning])

  // Get animation variants for mode transitions
  const getAnimationVariants = useCallback(() => {
    const settings = getTransitionSettings()
    
    return {
      initial: { opacity: 0, scale: 0.95 },
      animate: { 
        opacity: 1, 
        scale: 1,
        transition: {
          duration: settings.duration / 1000,
          ease: settings.easing,
          staggerChildren: settings.stagger / 1000
        }
      },
      exit: { 
        opacity: 0, 
        scale: 1.05,
        transition: {
          duration: settings.duration / 1000,
          ease: settings.easing
        }
      }
    }
  }, [getTransitionSettings])

  // Persistence: Save mode preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('trendzo_interface_mode', currentMode)
    } catch (error) {
      console.warn('Failed to save mode preference:', error)
    }
  }, [currentMode])

  // Load saved mode preference on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('trendzo_interface_mode') as InterfaceMode
      if (savedMode && MODE_CONFIGURATIONS[savedMode]) {
        setCurrentMode(savedMode)
      }
    } catch (error) {
      console.warn('Failed to load mode preference:', error)
    }
  }, [])

  return {
    // State
    currentMode,
    isTransitioning,
    previousMode,
    
    // Configuration
    getCurrentConfig,
    getTransitionSettings,
    getModeClasses,
    getAnimationVariants,
    
    // Layer Management
    isLayerVisible,
    
    // Component Management
    getComponentPriorities,
    getComponentPriority,
    getComponentLoadOrder,
    shouldLoadComponent,
    getComponentsByLoadOrder,
    
    // Mode Control
    switchMode,
    predictOptimalMode,
    
    // Available modes
    availableModes: Object.keys(MODE_CONFIGURATIONS) as InterfaceMode[]
  }
}

// Helper hook for component-specific mode logic
export function useComponentMode(componentId: string) {
  const {
    currentMode,
    isLayerVisible,
    getComponentPriority,
    getComponentLoadOrder,
    shouldLoadComponent
  } = useModeManager()

  const priority = getComponentPriority(componentId)
  const loadOrder = getComponentLoadOrder(componentId)
  const shouldLoad = shouldLoadComponent(componentId)

  // Determine which layer this component belongs to based on priority
  const getComponentLayer = useCallback((): 'primary' | 'secondary' | 'tertiary' => {
    if (priority <= 4) return 'primary'
    if (priority <= 8) return 'secondary'
    return 'tertiary'
  }, [priority])

  const layer = getComponentLayer()
  const isVisible = shouldLoad && isLayerVisible(layer)

  return {
    currentMode,
    layer,
    priority,
    loadOrder,
    shouldLoad,
    isVisible,
    componentId
  }
}

// Hook for mode-aware animations
export function useModeTransitions() {
  const { getAnimationVariants, isTransitioning, getTransitionSettings } = useModeManager()

  const variants = getAnimationVariants()
  const settings = getTransitionSettings()

  // Component enter animation
  const getEnterAnimation = useCallback((delay: number = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: settings.duration / 1000,
        delay: delay / 1000,
        ease: settings.easing
      }
    }
  }), [settings])

  // Component exit animation
  const getExitAnimation = useCallback(() => ({
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: settings.duration / 1000,
        ease: settings.easing
      }
    }
  }), [settings])

  // Layer transition animation
  const getLayerAnimation = useCallback((isVisible: boolean) => ({
    initial: { opacity: 0, height: 0 },
    animate: { 
      opacity: isVisible ? 1 : 0, 
      height: isVisible ? 'auto' : 0,
      transition: {
        duration: settings.duration / 1000,
        ease: settings.easing
      }
    }
  }), [settings])

  return {
    variants,
    isTransitioning,
    getEnterAnimation,
    getExitAnimation,
    getLayerAnimation,
    transitionSettings: settings
  }
}

export default useModeManager