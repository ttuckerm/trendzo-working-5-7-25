"use client";

import React, { createContext, useContext } from 'react';

interface AnimationSettings {
  isReducedMotion: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  useAdvancedAnimations: boolean;
  isHapticsEnabled: boolean;
  toggleHaptics: () => void;
  toggleReducedMotion: () => void;
  setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  toggleAdvancedAnimations: () => void;
  getAnimationDuration: (baseDuration: number) => number;
}

// Default settings that don't break anything
const defaultSettings: AnimationSettings = {
  isReducedMotion: false,
  animationSpeed: 'normal',
  useAdvancedAnimations: true,
  isHapticsEnabled: true,
  toggleHaptics: () => {},
  toggleReducedMotion: () => {},
  setAnimationSpeed: () => {},
  toggleAdvancedAnimations: () => {},
  getAnimationDuration: (duration) => duration,
};

const AnimationContext = createContext<AnimationSettings>(defaultSettings);

// This hook will provide the default values but won't try to create state
export const useAnimationSettings = () => useContext(AnimationContext);

// For backward compatibility with older code
export const useAnimationContext = useAnimationSettings;

// A simple version of the provider that doesn't attempt to do much
export function AnimationProvider({ children }: { children: React.ReactNode }) {
  return (
    <AnimationContext.Provider value={defaultSettings}>
      {children}
    </AnimationContext.Provider>
  );
} 