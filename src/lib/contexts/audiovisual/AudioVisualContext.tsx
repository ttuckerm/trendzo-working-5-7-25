"use client";

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

// AudioVisual Context Interface
interface AudioVisualContextType {
  isMuted: boolean;
  volume: number;
  currentTone: string | null;
  currentTime: number;
  isPlaying: boolean;
  setIsMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTone: (tone: string | null) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
}

// Create the context
const AudioVisualContext = createContext<AudioVisualContextType | undefined>(undefined);

// Props for the provider component
interface AudioVisualProviderProps {
  children: ReactNode;
}

/**
 * Provider component for audio-visual functionality
 */
export const AudioVisualProvider: React.FC<AudioVisualProviderProps> = ({ children }) => {
  // State for audio settings
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTone, setCurrentTone] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Create memoized context value
  const contextValue = useMemo(() => ({
    isMuted,
    volume,
    currentTone,
    currentTime,
    isPlaying,
    setIsMuted,
    setVolume,
    setCurrentTone,
    setCurrentTime,
    setIsPlaying,
  }), [isMuted, volume, currentTone, currentTime, isPlaying]);

  return (
    <AudioVisualContext.Provider value={contextValue}>
      {children}
    </AudioVisualContext.Provider>
  );
};

/**
 * Hook for using the audio-visual context
 */
export const useAudioVisual = (): AudioVisualContextType => {
  const context = useContext(AudioVisualContext);
  if (context === undefined) {
    throw new Error('useAudioVisual must be used within an AudioVisualProvider');
  }
  return context;
};

export default AudioVisualContext; 