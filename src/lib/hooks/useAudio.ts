'use client';

import { useState, useEffect, useRef } from 'react';

interface UseAudioReturn {
  playing: boolean;
  duration: number;
  currentTime: number;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setCurrentTime: (time: number) => void;
}

/**
 * Hook for controlling audio playback
 * @param url URL of the audio file to play
 * @param autoPlay Whether to play the audio automatically
 * @returns Object with audio control methods and state
 */
export function useAudio(url: string, autoPlay = false): UseAudioReturn {
  const [playing, setPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTimeState] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Create audio element
    const audio = new Audio(url);
    audioRef.current = audio;
    
    // Set up event listeners
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
    
    audio.addEventListener('timeupdate', () => {
      setCurrentTimeState(audio.currentTime);
    });
    
    audio.addEventListener('ended', () => {
      setPlaying(false);
    });
    
    // Auto play if enabled
    if (autoPlay) {
      audio.play().catch(error => {
        console.error('Error auto-playing audio:', error);
      });
      setPlaying(true);
    }
    
    // Clean up on unmount
    return () => {
      audio.pause();
      audio.src = '';
      
      audio.removeEventListener('loadedmetadata', () => {});
      audio.removeEventListener('timeupdate', () => {});
      audio.removeEventListener('ended', () => {});
    };
  }, [url, autoPlay]);
  
  // Toggle play/pause
  const toggle = () => {
    if (!audioRef.current) return;
    
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
    
    setPlaying(!playing);
  };
  
  // Play audio
  const play = () => {
    if (!audioRef.current || playing) return;
    
    audioRef.current.play().catch(error => {
      console.error('Error playing audio:', error);
    });
    
    setPlaying(true);
  };
  
  // Pause audio
  const pause = () => {
    if (!audioRef.current || !playing) return;
    
    audioRef.current.pause();
    setPlaying(false);
  };
  
  // Stop audio (pause and reset position)
  const stop = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPlaying(false);
    setCurrentTimeState(0);
  };
  
  // Set current time
  const setCurrentTime = (time: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = time;
    setCurrentTimeState(time);
  };
  
  return {
    playing,
    duration,
    currentTime,
    toggle,
    play,
    pause,
    stop,
    setCurrentTime
  };
} 