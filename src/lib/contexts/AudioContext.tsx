"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { TikTokSound } from '@/lib/types/tiktok';

// Extend TikTokSound with properties needed for the audio player
interface ExtendedTikTokSound extends TikTokSound {
  audioUrl?: string; // Will be mapped from playUrl
  coverUrl?: string; // Will be mapped from coverMedium or coverThumb
}

interface AudioState {
  currentSound: ExtendedTikTokSound | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  history: ExtendedTikTokSound[];
  favorites: ExtendedTikTokSound[];
  queue: ExtendedTikTokSound[];
  showSoundPanel: boolean;
  premiumFeaturesEnabled: boolean;
}

interface AudioContextProps {
  // Current state
  state: AudioState;
  currentSound: ExtendedTikTokSound | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  
  // Collections
  history: ExtendedTikTokSound[];
  favorites: ExtendedTikTokSound[];
  queue: ExtendedTikTokSound[];
  
  // Primary actions
  play: (sound: TikTokSound) => void;
  pause: () => void;
  toggle: (sound?: TikTokSound) => void;
  stop: () => void;
  
  // Sound management
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  next: () => void;
  previous: () => void;
  
  // Collection management
  addToFavorites: (sound: TikTokSound) => void;
  removeFromFavorites: (soundId: string) => void;
  clearHistory: () => void;
  addToQueue: (sound: TikTokSound) => void;
  removeFromQueue: (soundId: string) => void;
  
  // UI state helpers
  isFavorite: (soundId: string) => boolean;
  isInHistory: (soundId: string) => boolean;
  
  // Advanced control
  playAt: (sound: TikTokSound, startTime: number) => void;
  setPlaybackRate: (rate: number) => void;
  
  // Context awareness
  getRelatedSounds: (sound: TikTokSound) => Promise<TikTokSound[]>;
  lastActiveTimestamp: number;
  
  // UI controls
  showSoundPanel: () => void;
  hideSoundPanel: () => void;
  toggleSoundPanel: () => void;
}

// Default context values
const defaultContext: AudioContextProps = {
  // Current state
  state: {
    currentSound: null,
    isPlaying: false,
    volume: 0.8, // 80% volume by default
    progress: 0,
    duration: 0,
    history: [],
    favorites: [],
    queue: [],
    showSoundPanel: false,
    premiumFeaturesEnabled: false
  },
  currentSound: null,
  isPlaying: false,
  volume: 0.8, // 80% volume by default
  progress: 0,
  duration: 0,
  
  // Collections
  history: [],
  favorites: [],
  queue: [],
  
  // Functions with empty implementations (will be replaced by provider)
  play: () => {},
  pause: () => {},
  toggle: () => {},
  stop: () => {},
  setVolume: () => {},
  seek: () => {},
  next: () => {},
  previous: () => {},
  addToFavorites: () => {},
  removeFromFavorites: () => {},
  clearHistory: () => {},
  addToQueue: () => {},
  removeFromQueue: () => {},
  isFavorite: () => false,
  isInHistory: () => false,
  playAt: () => {},
  setPlaybackRate: () => {},
  getRelatedSounds: async () => [],
  lastActiveTimestamp: Date.now(),
  
  // UI controls
  showSoundPanel: () => {},
  hideSoundPanel: () => {},
  toggleSoundPanel: () => {}
};

// Create context
const AudioContext = createContext<AudioContextProps>(defaultContext);

// Max history items to keep
const MAX_HISTORY_ITEMS = 50;

// Helper to extend TikTokSound with the needed properties
const extendTikTokSound = (sound: TikTokSound): ExtendedTikTokSound => {
  return {
    ...sound,
    audioUrl: sound.playUrl,
    coverUrl: sound.coverMedium || sound.coverThumb || sound.coverLarge
  };
};

// Hook for components to access the audio context
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

// The provider component
export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // State management
  const [state, setState] = useState<AudioState>({
    currentSound: null,
    isPlaying: false,
    volume: defaultContext.volume,
    progress: 0,
    duration: 0,
    history: [],
    favorites: [],
    queue: [],
    showSoundPanel: false,
    premiumFeaturesEnabled: false
  });
  
  // Playback rate state
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  
  // Last active timestamp
  const [lastActiveTimestamp, setLastActiveTimestamp] = useState<number>(Date.now());
  
  // Load saved favorites from localStorage
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem('audio_favorites');
      if (savedFavorites) {
        setState(prev => ({
          ...prev,
          favorites: JSON.parse(savedFavorites),
        }));
      }
      
      const savedHistory = localStorage.getItem('audio_history');
      if (savedHistory) {
        setState(prev => ({
          ...prev,
          history: JSON.parse(savedHistory),
        }));
      }
      
      // Check if premium features are enabled
      const userSubscription = localStorage.getItem('user_subscription');
      if (userSubscription) {
        const { tier } = JSON.parse(userSubscription);
        setState(prev => ({
          ...prev,
          premiumFeaturesEnabled: tier === 'premium' || tier === 'platinum'
        }));
      }
    } catch (error) {
      console.error('Error loading audio preferences:', error);
    }
  }, []);
  
  // Save favorites to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('audio_favorites', JSON.stringify(state.favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, [state.favorites]);
  
  // Save history to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('audio_history', JSON.stringify(state.history));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }, [state.history]);
  
  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      
      // Set initial volume
      if (audioRef.current) {
        audioRef.current.volume = state.volume;
      }
      
      // Cleanup on unmount
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
      };
    }
  }, [state.volume]);
  
  // Update audio element when currentSound changes
  useEffect(() => {
    if (audioRef.current && state.currentSound) {
      // Set the source URL
      const audioUrl = state.currentSound.audioUrl || state.currentSound.playUrl || '';
      audioRef.current.src = audioUrl;
      
      // Load the audio
      audioRef.current.load();
      
      // Play if isPlaying is true
      if (state.isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
      
      // Add to history if not already the most recent
      if (!state.history.length || state.history[0].id !== state.currentSound.id) {
        // Extract the sound to add and ensure it's a valid sound object
        const soundToAdd = state.currentSound;
        
        // Create a new history array with type safety
        const newHistory: ExtendedTikTokSound[] = [soundToAdd];
        
        // Add the rest of history items, filtering out nulls and the current sound
        for (const historicalSound of state.history) {
          if (historicalSound && historicalSound.id !== soundToAdd.id) {
            newHistory.push(historicalSound);
            if (newHistory.length >= MAX_HISTORY_ITEMS) {
              break;
            }
          }
        }
        
        setState(prev => ({
          ...prev,
          history: newHistory,
        }));
      }
    }
  }, [state.currentSound]);
  
  // Set up audio element event listeners
  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    
    // Update progress
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        console.log("Audio time update:", audioRef.current.currentTime);
        setState(prev => ({
          ...prev,
          progress: audioRef.current.currentTime,
        }));
      }
    };
    
    // Update duration when metadata is loaded
    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        console.log("Audio metadata loaded, duration:", audioRef.current.duration);
        setState(prev => ({
          ...prev,
          duration: audioRef.current.duration,
        }));
      }
    };
    
    // Handle playback ending
    const handleEnded = () => {
      console.log("Audio playback ended");
      if (state.queue.length > 0) {
        // Play next in queue
        const nextSound = state.queue[0];
        const remainingQueue = state.queue.slice(1);
        setState(prev => ({
          ...prev,
          currentSound: nextSound,
          queue: remainingQueue,
          isPlaying: true,
        }));
      } else {
        // Just stop playback
        setState(prev => ({
          ...prev,
          isPlaying: false,
          progress: 0,
        }));
      }
    };
    
    // Handle play event
    const handlePlay = () => {
      console.log("Audio play event triggered");
      setState(prev => ({
        ...prev,
        isPlaying: true,
      }));
    };
    
    // Handle pause event
    const handlePause = () => {
      console.log("Audio pause event triggered");
      setState(prev => ({
        ...prev,
        isPlaying: false,
      }));
    };
    
    // Attach event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    
    // Cleanup
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [state.queue]);
  
  // Sync playback rate changes with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);
  
  // Main action handlers
  
  // Play a sound
  const play = useCallback((sound: TikTokSound) => {
    setState(prev => ({
      ...prev,
      currentSound: extendTikTokSound(sound),
      isPlaying: true,
    }));
    setLastActiveTimestamp(Date.now());
  }, []);
  
  // Pause playback
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setState(prev => ({
      ...prev,
      isPlaying: false,
    }));
  }, []);
  
  // Toggle play/pause, optionally with a new sound
  const toggle = useCallback((sound?: TikTokSound) => {
    console.log("🎵 Toggle called", {
      sound: sound?.title || "none provided",
      currentSound: state.currentSound?.title || "none",
      isPlaying: state.isPlaying
    });
    
    try {
      if (sound) {
        // If a sound is provided and it's different from current, play it
        console.log("New sound provided, playing it");
        play(sound);
        return;
      }
      
      // Otherwise toggle current playback
      if (state.isPlaying) {
        console.log("Currently playing, pausing");
        pause();
      } else if (state.currentSound && audioRef.current) {
        console.log("Currently paused, playing");
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
        });
        setState(prev => ({
          ...prev,
          isPlaying: true,
        }));
      } else {
        console.log("No current sound to toggle");
      }
      
      setLastActiveTimestamp(Date.now());
    } catch (error) {
      console.error("Error in toggle function:", error);
    }
  }, [state.currentSound, state.isPlaying, play, pause]);
  
  // Create a type-safe version of toggle for event handlers
  const handleToggle = useCallback(() => {
    toggle();
  }, [toggle]);
  
  // Stop playback completely
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState(prev => ({
      ...prev,
      isPlaying: false,
      progress: 0,
    }));
  }, []);
  
  // Set volume (0 to 1)
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
    setState(prev => ({
      ...prev,
      volume: clampedVolume,
    }));
  }, []);
  
  // Seek to a specific time
  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, state.duration));
      setState(prev => ({
        ...prev,
        progress: audioRef.current?.currentTime || 0,
      }));
    }
    setLastActiveTimestamp(Date.now());
  }, [state.duration]);
  
  // Play next sound in queue
  const next = useCallback(() => {
    if (state.queue.length > 0) {
      const nextSound = state.queue[0];
      const remainingQueue = state.queue.slice(1);
      setState(prev => ({
        ...prev,
        currentSound: nextSound,
        queue: remainingQueue,
        isPlaying: true,
      }));
    }
    setLastActiveTimestamp(Date.now());
  }, [state.queue]);
  
  // Play previous sound from history
  const previous = useCallback(() => {
    if (state.history.length > 1) {
      // Skip the current sound (which is at index 0) and get the previous one
      const previousSound = state.history[1];
      setState(prev => ({
        ...prev,
        currentSound: previousSound,
        isPlaying: true,
      }));
    }
    setLastActiveTimestamp(Date.now());
  }, [state.history]);
  
  // Add a sound to favorites
  const addToFavorites = useCallback((sound: TikTokSound) => {
    const extendedSound = extendTikTokSound(sound);
    setState(prev => ({
      ...prev,
      favorites: [extendedSound, ...prev.favorites.filter(s => s.id !== sound.id)],
    }));
  }, []);
  
  // Remove a sound from favorites
  const removeFromFavorites = useCallback((soundId: string) => {
    setState(prev => ({
      ...prev,
      favorites: prev.favorites.filter(s => s.id !== soundId),
    }));
  }, []);
  
  // Clear playback history
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: prev.currentSound ? [prev.currentSound] : [],
    }));
  }, []);
  
  // Add a sound to the playback queue
  const addToQueue = useCallback((sound: TikTokSound) => {
    const extendedSound = extendTikTokSound(sound);
    setState(prev => ({
      ...prev,
      queue: [...prev.queue, extendedSound],
    }));
  }, []);
  
  // Remove a sound from the queue
  const removeFromQueue = useCallback((soundId: string) => {
    setState(prev => ({
      ...prev,
      queue: prev.queue.filter(s => s.id !== soundId),
    }));
  }, []);
  
  // Check if a sound is in favorites
  const isFavorite = useCallback((soundId: string) => {
    return state.favorites.some(s => s.id === soundId);
  }, [state.favorites]);
  
  // Check if a sound is in history
  const isInHistory = useCallback((soundId: string) => {
    return state.history.some(s => s.id === soundId);
  }, [state.history]);
  
  // Play a sound at a specific timestamp
  const playAt = useCallback((sound: TikTokSound, startTime: number) => {
    const extendedSound = extendTikTokSound(sound);
    setState(prev => ({
      ...prev,
      currentSound: extendedSound,
      isPlaying: true,
    }));
    
    // After the sound is loaded, seek to the specified time
    if (audioRef.current) {
      const seekFn = () => {
        if (audioRef.current) {
          audioRef.current.currentTime = startTime;
        }
        audioRef.current?.removeEventListener('loadedmetadata', seekFn);
      };
      
      audioRef.current.addEventListener('loadedmetadata', seekFn);
    }
    
    setLastActiveTimestamp(Date.now());
  }, []);
  
  // Get related sounds based on the current sound
  const getRelatedSounds = useCallback(async (sound: TikTokSound): Promise<TikTokSound[]> => {
    try {
      // This would typically call an API endpoint
      const response = await fetch(`/api/sounds/related?id=${sound.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch related sounds');
      }
      const data = await response.json();
      return data.sounds || [];
    } catch (error) {
      console.error('Error fetching related sounds:', error);
      return [];
    }
  }, []);
  
  // Function to show the sound panel
  const showSoundPanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      showSoundPanel: true
    }));
    setLastActiveTimestamp(Date.now());
  }, []);
  
  // Function to hide the sound panel
  const hideSoundPanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      showSoundPanel: false
    }));
  }, []);
  
  // Function to toggle the sound panel
  const toggleSoundPanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      showSoundPanel: !prev.showSoundPanel
    }));
    setLastActiveTimestamp(Date.now());
  }, []);
  
  // Context value that will be provided
  const contextValue: AudioContextProps = {
    // Current state
    state: state,
    currentSound: state.currentSound,
    isPlaying: state.isPlaying,
    volume: state.volume,
    progress: state.progress,
    duration: state.duration,
    
    // Collections
    history: state.history,
    favorites: state.favorites,
    queue: state.queue,
    
    // Actions
    play,
    pause,
    toggle,
    stop,
    setVolume,
    seek,
    next,
    previous,
    addToFavorites,
    removeFromFavorites,
    clearHistory,
    addToQueue,
    removeFromQueue,
    isFavorite,
    isInHistory,
    playAt,
    setPlaybackRate: setPlaybackRate,
    getRelatedSounds,
    lastActiveTimestamp,
    
    // UI controls
    showSoundPanel,
    hideSoundPanel,
    toggleSoundPanel
  };
  
  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

export default AudioContext; 