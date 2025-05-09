"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAudio } from '@/lib/contexts/AudioContext';
import { Sound } from '@/lib/types/audio';

/**
 * Hook for managing a specific sound
 * 
 * This hook simplifies working with individual sounds by providing
 * focused controls and state for a specific sound rather than the global
 * audio state.
 */
export function useSound(sound?: Sound) {
  const { 
    state,
    loadSound,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    setLoop,
    addToFavorites,
    removeFromFavorites,
    isFavorite
  } = useAudio();

  // Track if this is the currently loaded sound
  const [isCurrentSound, setIsCurrentSound] = useState(false);
  
  // Update isCurrentSound when the current sound changes
  useEffect(() => {
    if (sound && state.currentSound) {
      setIsCurrentSound(sound.id === state.currentSound.id);
    } else {
      setIsCurrentSound(false);
    }
  }, [sound, state.currentSound]);
  
  // Load the sound if it's provided
  const loadAndPlay = useCallback(() => {
    if (!sound) return;
    
    // Only load if it's not already the current sound
    if (!isCurrentSound) {
      loadSound(sound);
    }
    
    play();
  }, [sound, isCurrentSound, loadSound, play]);
  
  // Toggle play state for this sound
  const togglePlayback = useCallback(() => {
    if (!sound) return;
    
    if (!isCurrentSound) {
      loadSound(sound);
      play();
    } else {
      togglePlay();
    }
  }, [sound, isCurrentSound, loadSound, play, togglePlay]);
  
  // Check if this sound is in favorites
  const isInFavorites = useCallback(() => {
    if (!sound) return false;
    return isFavorite(sound.id);
  }, [sound, isFavorite]);
  
  // Toggle favorite status for this sound
  const toggleFavorite = useCallback(() => {
    if (!sound) return;
    
    if (isInFavorites()) {
      removeFromFavorites(sound.id);
    } else {
      addToFavorites(sound);
    }
  }, [sound, isInFavorites, addToFavorites, removeFromFavorites]);
  
  // Calculate if this sound is currently playing
  const isPlaying = isCurrentSound && state.playback.isPlaying;
  
  return {
    // Basic sound details from the parameter
    sound,
    
    // Current state
    isPlaying,
    isCurrentSound,
    currentTime: isCurrentSound ? state.playback.currentTime : 0,
    duration: isCurrentSound ? state.playback.duration : (sound?.duration || 0),
    volume: state.playback.volume,
    isMuted: state.playback.muted,
    isLooping: state.playback.loop,
    isInFavorites: isInFavorites(),
    
    // Actions
    loadAndPlay,
    togglePlayback,
    pause: isCurrentSound ? pause : () => {},
    seek: isCurrentSound ? seek : () => {},
    setVolume,
    toggleMute,
    setLoop,
    toggleFavorite,
  };
}

export default useSound; 