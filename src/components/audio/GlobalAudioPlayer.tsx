"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, X, Maximize2, Minimize2, Music } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sound } from '@/lib/types/audio';
import { formatAudioTime } from '@/lib/utils/audioUtils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface GlobalAudioPlayerProps {
  currentSound?: Sound | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onToggleSound?: (sound?: Sound) => void;
  onVolumeChange?: (volume: number) => void;
  volume?: number;
  showSoundPanel?: () => void;
}

/**
 * GlobalAudioPlayer - A persistent audio player with enhanced UX
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Collapses to a minimal button when not in focus
 * - Emotional Design: Micro-interactions for controls and feedback
 * - Progressive Disclosure: Expands to show more controls when active
 * - Sensory Harmony: Visual and audio feedback aligned
 */
const GlobalAudioPlayer: React.FC<GlobalAudioPlayerProps> = ({
  currentSound,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onToggleSound,
  onVolumeChange,
  volume = 1,
  showSoundPanel
}) => {
  const [expanded, setExpanded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const [recentlyActive, setRecentlyActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  // Handle toggling play/pause
  const handlePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };
  
  // Handle time update on audio element
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  
  // Handle metadata loaded for getting duration
  const handleMetadataLoaded = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  // Handle seeking on progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && audioRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pos * duration;
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    if (onVolumeChange) {
      onVolumeChange(value[0]);
    }
  };
  
  // Effect for managing audio element's playing state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          // Handle autoplay restrictions
          console.log("Autoplay prevented");
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);
  
  // Effect to set audio element src when current sound changes
  useEffect(() => {
    if (audioRef.current && currentSound?.url) {
      audioRef.current.src = currentSound.url;
      audioRef.current.load();
      setCurrentTime(0);
      
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          console.log("Autoplay prevented");
        });
      }
    }
  }, [currentSound]);
  
  // Set volume effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  // Show recently active state for a short time when controls are used
  const activateRecentlyActive = () => {
    setRecentlyActive(true);
    setTimeout(() => setRecentlyActive(false), 2000);
  };
  
  // Handle interaction with player
  const handleInteraction = () => {
    setExpanded(true);
    activateRecentlyActive();
  };
  
  // Toggle sound panel
  const handleShowSoundPanel = () => {
    if (showSoundPanel) {
      showSoundPanel();
    }
    activateRecentlyActive();
  };
  
  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Only show the floating button when there's no active sound
  const showMinimalButton = !currentSound && showFloatingButton;
  
  // Render a minimal floating button when no sound is playing
  if (showMinimalButton) {
    return (
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <Button
          onClick={handleShowSoundPanel}
          className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all"
          size="icon"
        >
          <Music className="h-5 w-5" />
          <span className="sr-only">Open Sound Panel</span>
        </Button>
      </motion.div>
    );
  }
  
  // Return null if no sound and no floating button
  if (!currentSound) {
    return null;
  }
  
  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleMetadataLoaded}
        onEnded={() => onPause()}
      />
      
      <motion.div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg",
          expanded ? "h-24" : "h-12"
        )}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        onMouseEnter={handleInteraction}
        onClick={handleInteraction}
      >
        {/* Progress bar - always visible */}
        <div 
          className="absolute top-0 left-0 right-0 h-1 bg-gray-100 cursor-pointer group"
          onClick={handleProgressClick}
          ref={progressRef}
        >
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        
        {/* Compact player - always visible */}
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-700 hover:text-primary"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium text-sm">{currentSound.title}</div>
              <div className="truncate text-xs text-gray-500">{currentSound.artist}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-primary"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Expanded controls */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              className="px-4 py-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {onPrevious && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-700 hover:text-primary"
                      onClick={onPrevious}
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {onNext && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-700 hover:text-primary"
                      onClick={onNext}
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <div className="flex items-center space-x-2 w-32">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-700 hover:text-primary"
                      onClick={() => onVolumeChange?.(volume > 0 ? 0 : 1)}
                    >
                      {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    
                    <Slider
                      value={[volume * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={handleVolumeChange}
                      className="w-24"
                    />
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={handleShowSoundPanel}
                >
                  <Music className="h-3 w-3 mr-2" />
                  Sound Library
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default GlobalAudioPlayer; 