'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface SoundControlsProps {
  soundUrl: string;
  showVolumeControl?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export default function SoundControls({
  soundUrl,
  showVolumeControl = true,
  size = 'medium',
  className = '',
  onPlayStateChange
}: SoundControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Set up audio element
  useEffect(() => {
    const audio = new Audio(soundUrl);
    audioRef.current = audio;
    
    audio.addEventListener('loadedmetadata', () => {
      setIsLoaded(true);
    });
    
    audio.addEventListener('error', () => {
      setLoadError('Failed to load audio');
      setIsLoaded(false);
    });
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    });
    
    return () => {
      audio.pause();
      audio.src = '';
      audio.remove();
      audioRef.current = null;
    };
  }, [soundUrl, onPlayStateChange]);
  
  // Control play/pause state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
          if (onPlayStateChange) onPlayStateChange(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, onPlayStateChange]);
  
  // Control volume and mute state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // Toggle play/pause
  const togglePlay = () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    if (onPlayStateChange) onPlayStateChange(newPlayingState);
  };
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Set icon and button size based on size prop
  const getIconSize = () => {
    switch (size) {
      case 'small': return 'w-4 h-4';
      case 'large': return 'w-6 h-6';
      default: return 'w-5 h-5';
    }
  };
  
  const getButtonSize = () => {
    switch (size) {
      case 'small': return 'p-1';
      case 'large': return 'p-3';
      default: return 'p-2';
    }
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        disabled={!isLoaded || !!loadError}
        className={`${getButtonSize()} ${isPlaying ? 'text-indigo-600' : 'text-gray-600'} hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? 
          <Pause className={getIconSize()} /> : 
          <Play className={getIconSize()} />
        }
      </button>
      
      {/* Volume controls */}
      {showVolumeControl && (
        <div className="flex items-center ml-2">
          <button
            onClick={toggleMute}
            disabled={!isLoaded || !!loadError}
            className={`${getButtonSize()} text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? 
              <VolumeX className={getIconSize()} /> : 
              <Volume2 className={getIconSize()} />
            }
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            disabled={!isLoaded || !!loadError}
            className={`ml-1 ${size === 'small' ? 'w-16' : size === 'large' ? 'w-28' : 'w-20'} h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label="Volume"
          />
        </div>
      )}
      
      {/* Error message */}
      {loadError && (
        <span className="ml-2 text-xs text-red-500">
          {loadError}
        </span>
      )}
    </div>
  );
} 