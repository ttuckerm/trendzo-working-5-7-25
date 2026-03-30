"use client";

import { useState, useEffect } from 'react';
import { useAnimationSettings } from '@/lib/contexts/AnimationContext';

type AnimationType = 'fade' | 'slide' | 'scale' | 'bounce' | 'elastic' | 'none';
type TransitionType = 'tween' | 'spring' | 'inertia';

interface AnimationOptions {
  type?: AnimationType;
  duration?: number;
  delay?: number;
  transitionType?: TransitionType;
  springConfig?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
    bounce?: number;
  };
  initialOpacity?: number;
  initialScale?: number;
  initialY?: number;
  initialX?: number;
  initialRotation?: number;
  repeatType?: 'loop' | 'mirror' | 'reverse' | null;
  repeat?: number;
  easing?: string;
}

interface MotionProps {
  initial: Record<string, any>;
  animate: Record<string, any>;
  transition: Record<string, any>;
  exit?: Record<string, any>;
  key?: number;
}

/**
 * Hook for applying animations with respect to user animation settings
 * 
 * @example
 * ```tsx
 * const { motionProps } = useAnimation({ type: 'fade', delay: 0.2 });
 * 
 * return (
 *   <motion.div {...motionProps}>
 *     Animated content
 *   </motion.div>
 * );
 * ```
 */
export function useAnimation(options: AnimationOptions = {}): {
  motionProps: MotionProps;
  play: () => void;
  reset: () => void;
  isPlaying: boolean;
} {
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
    easing = 'easeOut'
  } = options;

  const { 
    isReducedMotion, 
    animationSpeed,
    useAdvancedAnimations,
    getAnimationDuration
  } = useAnimationSettings();

  const [isPlaying, setIsPlaying] = useState(true);
  const [key, setKey] = useState(0);

  // Speed multipliers based on user settings
  const speedMap = {
    slow: 1.5,
    normal: 1,
    fast: 0.6
  };
  
  // If reduced motion is enabled, override values
  const effectiveDuration = isReducedMotion ? 0.001 : 
    duration !== undefined ? duration * speedMap[animationSpeed] : 
    getAnimationDuration(300) / 1000;

  const getInitialProps = () => {
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
  };

  const getAnimateProps = () => {
    return {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      rotate: 0
    };
  };

  const getExitProps = () => {
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
  };

  const getTransitionProps = () => {
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

    return transitionProps;
  };

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

  // Reset animation when settings change
  useEffect(() => {
    reset();
  }, [isReducedMotion, animationSpeed, useAdvancedAnimations]);

  return {
    motionProps: {
      initial: getInitialProps(),
      animate: isPlaying ? getAnimateProps() : getInitialProps(),
      exit: getExitProps(),
      transition: getTransitionProps(),
      key
    },
    play,
    reset,
    isPlaying
  };
}

export default useAnimation; 