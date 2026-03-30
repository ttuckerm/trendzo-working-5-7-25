"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Sound } from '@/lib/types/audio';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

// Simplified helper function to extract URL from various sound object types
const getSoundUrl = (sound: Sound): string => {
  if (typeof sound === 'string') return sound;
  return sound.url;
};

export interface AudioVisualSynchronizerProps {
  sound: Sound;
  children?: React.ReactNode;
  showControls?: boolean;
  onTimeUpdate?: (time: number) => void;
  onPlayPauseChange?: (isPlaying: boolean) => void;
}

/**
 * A component that synchronizes audio playback with visual elements
 */
const AudioVisualSynchronizer: React.FC<AudioVisualSynchronizerProps> = ({
  sound,
  children,
  showControls = true,
  onTimeUpdate,
  onPlayPauseChange
}) => {
  // Audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Component state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Initialize audio on mount
  useEffect(() => {
    if (audioRef.current) {
      const url = getSoundUrl(sound);
      audioRef.current.src = url;
      audioRef.current.load();
    }
  }, [sound]);
  
  // Handle duration change
  const handleDurationChange = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };
  
  // Handle play/pause
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
      onPlayPauseChange?.(!isPlaying);
    }
  };
  
  // Handle mute toggle
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  // Handle ended
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    onPlayPauseChange?.(false);
  };
  
  // Format time display
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div className="relative w-full h-full">
      {/* Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onEnded={handleEnded}
      />
      
      {/* Visual Content */}
      <div className="w-full h-full">
        {children}
      </div>
      
      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 flex items-center gap-2">
          <button 
            onClick={togglePlayPause}
            className="p-1 rounded-full hover:bg-white/20"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <button
            onClick={toggleMute}
            className="p-1 rounded-full hover:bg-white/20"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          
          <div className="flex-1 mx-2">
            <div className="h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="text-xs">
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioVisualSynchronizer; 