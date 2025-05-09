"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useAnimationSettings } from '@/lib/contexts/AnimationContext';

type HapticIntensity = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

interface HapticPatterns {
  light: number[];
  medium: number[];
  heavy: number[];
  success: number[];
  warning: number[];
  error: number[];
}

export function useHapticFeedback() {
  const { isHapticsEnabled } = useAnimationSettings();
  const supportsHaptics = useRef<boolean>(false);
  
  // Haptic patterns (duration in milliseconds)
  const hapticPatterns: HapticPatterns = {
    light: [10],
    medium: [20],
    heavy: [30],
    success: [10, 30, 10],
    warning: [20, 40, 20],
    error: [30, 50, 100]
  };
  
  // Check for haptic support
  useEffect(() => {
    // Check if the device supports vibration
    supportsHaptics.current = 'vibrate' in navigator;
    
    // Some browsers need permission for vibration
    if (supportsHaptics.current && typeof document !== 'undefined') {
      const enableHaptics = () => {
        // Some browsers need a user interaction to enable vibration
        if (supportsHaptics.current) {
          navigator.vibrate(0);
        }
        document.removeEventListener('click', enableHaptics);
      };
      
      document.addEventListener('click', enableHaptics, { once: true });
    }
    
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('click', () => {});
      }
    };
  }, []);
  
  // Function to trigger haptic feedback
  const triggerHaptic = useCallback((
    intensity: HapticIntensity = 'light',
    customPattern?: number[]
  ) => {
    // Return early if haptics are disabled or not supported
    if (!isHapticsEnabled || !supportsHaptics.current) return;
    
    try {
      const pattern = customPattern || hapticPatterns[intensity];
      navigator.vibrate(pattern);
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
    }
  }, [isHapticsEnabled, hapticPatterns]);
  
  // Function to trigger haptic feedback based on an event
  const triggerHapticOnEvent = useCallback((
    event: 'click' | 'success' | 'error' | 'warning' | 'notification' | 'selection' | 'drag'
  ) => {
    if (!isHapticsEnabled || !supportsHaptics.current) return;
    
    // Map events to the appropriate intensities
    const eventIntensityMap: Record<string, HapticIntensity> = {
      click: 'light',
      success: 'success',
      error: 'error',
      warning: 'warning',
      notification: 'medium',
      selection: 'light',
      drag: 'medium'
    };
    
    const intensity = eventIntensityMap[event] || 'light';
    triggerHaptic(intensity);
  }, [isHapticsEnabled, triggerHaptic]);
  
  // Utility function to create haptic buttons/interactions
  const withHaptics = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    intensity: HapticIntensity = 'light'
  ) => {
    return ((...args: Parameters<T>): ReturnType<T> => {
      triggerHaptic(intensity);
      return callback(...args);
    }) as T;
  }, [triggerHaptic]);
  
  return {
    triggerHaptic,
    triggerHapticOnEvent,
    withHaptics,
    isHapticsSupported: supportsHaptics.current,
    isHapticsEnabled
  };
}

export default useHapticFeedback; 