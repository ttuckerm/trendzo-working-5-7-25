'use client';

import { useState, useRef, useEffect } from 'react';
import { useAnimationSettings } from '@/lib/contexts/AnimationContext';
import { animationScheduler, memoize } from '@/lib/utils/performanceOptimization';

type AnimationType = 'fade' | 'slide' | 'scale' | 'bounce' | 'elastic' | 'none';
type TransitionType = 'tween' | 'spring' | 'inertia';

interface AnimationOptions {
  // Animation type
  type?: AnimationType;
  
  // Duration in milliseconds
  duration?: number;
  
  // Delay before animation starts in milliseconds
  delay?: number;
  
  // Transition type 
  transitionType?: TransitionType;
  
  // Spring configuration for spring transitions
  springConfig?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
    bounce?: number;
  };
  
  // Initial state values
  initialOpacity?: number;
  initialScale?: number;
  initialY?: number;
  initialX?: number;
  initialRotation?: number;
  
  // Repetition settings
  repeatType?: 'loop' | 'mirror' | 'reverse' | null;
  repeat?: number;
  
  // Easing function
  easing?: string;
  
  // Intersection observer options for entry animations
  intersectionOptions?: IntersectionObserverInit;
  
  // Whether to observe element visibility before animating
  animateOnIntersection?: boolean;
  
  // Threshold for how much of element should be visible before animating
  intersectionThreshold?: number;
  
  // Root margin for intersection observer
  intersectionRootMargin?: string;
  
  // Whether to use GPU acceleration for this animation
  useGPU?: boolean;
  
  // Memory optimization: if true, will disconnect observers when animation completes
  cleanupAfterAnimation?: boolean;
  
  // Option to animate children staggered
  staggerChildren?: boolean;
  
  // Stagger delay between children in milliseconds 
  staggerDelay?: number;
}

interface MotionProps {
  initial: Record<string, any>;
  animate: Record<string, any>;
  transition: Record<string, any>;
  exit?: Record<string, any>;
  key?: number;
  style?: Record<string, any>;
  className?: string;
}

/**
 * Hook for applying optimized animations with improved performance
 * 
 * @param options - Animation configuration options
 * @returns Object containing motion props and animation control functions
 * 
 * @example
 * ```tsx
 * const { motionProps, ref } = useOptimizedAnimation({ 
 *   type: 'fade', 
 *   delay: 0.2,
 *   animateOnIntersection: true 
 * });
 * 
 * return (
 *   <motion.div {...motionProps} ref={ref}>
 *     Animated content
 *   </motion.div>
 * );
 * ```
 */
export function useOptimizedAnimation(options: AnimationOptions = {}) {
  const {
    type = 'fade',
    duration,
    delay = 0,
    transitionType = 'tween',
    springConfig = { stiffness: 200, damping: 20 },
    initialOpacity = 0,
    initialScale = 0.95,
    initialY = 20,
    initialX = 0,
    initialRotation = 0,
    repeatType = null,
    repeat = 0,
    easing = 'easeOut',
    animateOnIntersection = false,
    intersectionThreshold = 0.1,
    intersectionRootMargin = '0px',
    useGPU = true,
    cleanupAfterAnimation = true,
    staggerChildren = false,
    staggerDelay = 0.05
  } = options;

  // Get animation settings from context
  const { 
    isReducedMotion, 
    animationSpeed,
    useAdvancedAnimations,
    getAnimationDuration
  } = useAnimationSettings();

  // State for animation control
  const [isPlaying, setIsPlaying] = useState(!animateOnIntersection);
  const [key, setKey] = useState(0);
  const [isIntersecting, setIsIntersecting] = useState(!animateOnIntersection);
  
  // Ref for the animated element
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const animationIdRef = useRef<string>(`animation-${Math.random().toString(36).substr(2, 9)}`);

  // Speed multipliers based on user settings
  const speedMap = {
    slow: 1.5,
    normal: 1,
    fast: 0.6
  };
  
  // Effective duration with user preferences applied
  const effectiveDuration = isReducedMotion ? 0.001 : 
    duration !== undefined ? duration * speedMap[animationSpeed] : 
    getAnimationDuration(300) / 1000;

  // Create memoized animation props to prevent unnecessary recalculations
  const getInitialProps = memoize(() => {
    if (isReducedMotion || type === 'none') {
      return { opacity: 1 };
    }

    const props: Record<string, any> = {};
    
    switch (type) {
      case 'fade':
        props.opacity = initialOpacity;
        break;
      case 'slide':
        props.opacity = initialOpacity;
        props.y = initialY;
        props.x = initialX;
        break;
      case 'scale':
        props.opacity = initialOpacity;
        props.scale = initialScale;
        break;
      case 'bounce':
        props.opacity = initialOpacity;
        props.y = initialY;
        break;
      case 'elastic':
        props.opacity = initialOpacity;
        props.scale = initialScale;
        break;
      default:
        props.opacity = 1;
    }

    if (initialRotation !== 0) {
      props.rotate = initialRotation;
    }

    return props;
  });

  const getAnimateProps = memoize(() => {
    return {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      rotate: 0
    };
  });

  const getExitProps = memoize(() => {
    if (isReducedMotion || type === 'none') {
      return { opacity: 0 };
    }

    const props: Record<string, any> = {};
    
    switch (type) {
      case 'fade':
        props.opacity = 0;
        break;
      case 'slide':
        props.opacity = 0;
        props.y = -initialY;
        props.x = -initialX;
        break;
      case 'scale':
        props.opacity = 0;
        props.scale = initialScale;
        break;
      case 'bounce':
        props.opacity = 0;
        props.y = -initialY;
        break;
      case 'elastic':
        props.opacity = 0;
        props.scale = initialScale;
        break;
      default:
        props.opacity = 0;
    }

    if (initialRotation !== 0) {
      props.rotate = -initialRotation;
    }

    return props;
  });

  const getTransitionProps = memoize(() => {
    if (isReducedMotion) {
      return { duration: 0.001 };
    }

    const transitionProps: Record<string, any> = {
      duration: effectiveDuration,
      delay,
      type: useAdvancedAnimations ? transitionType : 'tween',
      ease: easing
    };

    if (repeatType) {
      transitionProps.repeatType = repeatType;
      transitionProps.repeat = repeat;
    }

    // Add spring configuration if using spring transitions
    if (transitionType === 'spring' && useAdvancedAnimations) {
      transitionProps.stiffness = springConfig.stiffness;
      transitionProps.damping = springConfig.damping;
      
      if (springConfig.mass) {
        transitionProps.mass = springConfig.mass;
      }
      
      if (springConfig.bounce) {
        transitionProps.bounce = springConfig.bounce;
      }
    }

    // Add staggered children properties if enabled
    if (staggerChildren) {
      transitionProps.staggerChildren = staggerDelay;
      transitionProps.delayChildren = delay;
    }

    return transitionProps;
  });

  // Animation control functions
  const play = () => {
    setIsPlaying(true);
  };

  const reset = () => {
    setIsPlaying(false);
    // Force re-render of animation by changing the key
    setTimeout(() => {
      setKey(prev => prev + 1);
      setIsPlaying(true);
    }, 50);
  };

  const pause = () => {
    setIsPlaying(false);
  };

  // Intersection Observer setup for trigger-on-view animations
  useEffect(() => {
    if (!animateOnIntersection || !elementRef.current) return;

    // Setup intersection observer to trigger animation when element is in view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            setIsPlaying(true);
            
            // Disconnect observer if cleanup is enabled and animation doesn't repeat
            if (cleanupAfterAnimation && (!repeatType || repeat === 0)) {
              observer.disconnect();
              observerRef.current = null;
            }
          } else {
            setIsIntersecting(false);
            
            // Only pause if repeating and should restart on re-entry
            if (repeatType === 'loop' || repeatType === 'reverse') {
              setIsPlaying(false);
            }
          }
        });
      },
      {
        threshold: intersectionThreshold,
        rootMargin: intersectionRootMargin
      }
    );

    observer.observe(elementRef.current);
    observerRef.current = observer;

    // Cleanup observer on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [animateOnIntersection, cleanupAfterAnimation, repeatType, repeat, intersectionThreshold, intersectionRootMargin]);

  // Schedule performance-optimized animations with requestAnimationFrame
  useEffect(() => {
    if (isPlaying && type !== 'none') {
      const animationId = animationIdRef.current;
      let startTime = performance.now();
      let progress = 0;
      
      // Use the animation scheduler for coordinated animations
      animationScheduler.schedule(animationId, (deltaTime) => {
        // Animation is complete, unschedule
        if (progress >= 1) {
          animationScheduler.unschedule(animationId);
          return;
        }
        
        // Update progress
        progress = Math.min((performance.now() - startTime) / (effectiveDuration * 1000), 1);
      });
      
      return () => {
        // Clean up animation when component unmounts or animation state changes
        animationScheduler.unschedule(animationId);
      };
    }
  }, [isPlaying, type, effectiveDuration]);

  // Reset animation when settings change
  useEffect(() => {
    reset();
  }, [isReducedMotion, animationSpeed, useAdvancedAnimations]);

  // Generate style properties for optimized rendering
  const getOptimizedStyle = () => {
    const style: Record<string, any> = {};
    
    // Add GPU acceleration for smoother animations
    if (useGPU && !isReducedMotion && type !== 'none') {
      style.willChange = 'opacity, transform';
      style.transform = 'translateZ(0)';
    }
    
    return style;
  };

  return {
    motionProps: {
      initial: getInitialProps(),
      animate: isPlaying ? getAnimateProps() : getInitialProps(),
      exit: getExitProps(),
      transition: getTransitionProps(),
      key,
      style: getOptimizedStyle()
    } as MotionProps,
    ref: elementRef,
    play,
    reset,
    pause,
    isPlaying,
    isIntersecting
  };
}

export default useOptimizedAnimation; 