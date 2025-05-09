"use client";

import React, { useState, useEffect } from 'react';
import { Music, Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/lib/contexts/AudioContext';
import { cn } from '@/lib/utils';
import { formatAudioTime } from '@/lib/utils/audioUtils';
import { useRouter } from 'next/navigation';

interface AudioButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showTrendingBadge?: boolean;
  onCustomPanelToggle?: () => void;
  useCustomPanel?: boolean;
}

/**
 * AudioButton - A floating button for quick access to sound features
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Appears minimally when no sound is playing
 * - Emotional Design: Provides delightful micro-interactions on hover/click
 * - Progressive Disclosure: Expands to reveal controls when interacted with
 * - Contextual Intelligence: Shows relevant information based on current state
 * - Sensory Harmony: Visual feedback matches audio state seamlessly
 */
const AudioButton: React.FC<AudioButtonProps> = ({
  position = 'bottom-right',
  showTrendingBadge = true,
  onCustomPanelToggle,
  useCustomPanel = false
}) => {
  // Local state
  const [isExpanded, setIsExpanded] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [hasNewTrends, setHasNewTrends] = useState(showTrendingBadge);
  
  // Get audio context values
  const { 
    currentSound, 
    isPlaying, 
    toggle, 
    showSoundPanel,
    volume,
    setVolume,
    progress,
    duration
  } = useAudio();
  
  const router = useRouter();
  
  // Debug: Log current state on every render
  useEffect(() => {
    console.log("AudioButton rendered:", { 
      currentSound, 
      isPlaying, 
      position, 
      useCustomPanel 
    });
  }, [currentSound, isPlaying, position, useCustomPanel]);
  
  // Map position to CSS classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };
  
  // Effect to collapse after period of inactivity
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 6000); // Auto-collapse after 6 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);
  
  // Handle clicks on the main button - with enhanced debug logging
  const handleButtonClick = () => {
    console.log("🔊 Audio button clicked!", { 
      currentSound, 
      isPlaying, 
      useCustomPanel, 
      onCustomPanelToggle: !!onCustomPanelToggle 
    });
    
    try {
      if (currentSound) {
        console.log("Toggling sound playback");
        toggle();
      } else {
        console.log("No sound - showing sound panel");
        if (useCustomPanel && onCustomPanelToggle) {
          console.log("Using custom panel toggle");
          onCustomPanelToggle();
        } else {
          console.log("Using default sound panel");
          showSoundPanel();
        }
      }
      
      setHasNewTrends(false);
    } catch (error) {
      console.error("Error in audio button click handler:", error);
    }
  };
  
  // Handle hover
  const handleMouseEnter = () => {
    console.log("Mouse entered audio button");
    setShowControls(true);
  };
  
  const handleMouseLeave = () => {
    if (!isExpanded) {
      console.log("Mouse left audio button");
      setShowControls(false);
    }
  };
  
  // Open the full sound browser page
  const openSoundBrowser = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Opening sound browser");
    
    if (useCustomPanel && onCustomPanelToggle) {
      console.log("Using custom panel toggle for browser");
      onCustomPanelToggle();
    } else {
      console.log("Navigating to sounds browser");
      router.push('/sounds/browser');
    }
    setHasNewTrends(false);
  };
  
  // Toggle expanded state for more controls
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Toggling expanded state");
    setIsExpanded(prev => !prev);
  };
  
  // Toggle mute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Toggling mute state");
    setVolume(volume > 0 ? 0 : 0.8);
  };
  
  // Calculate progress bar width
  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
  
  // Minimal floating button (when no sound is playing)
  if (!currentSound) {
    return (
      <motion.div 
        className={cn("fixed z-40", positionClasses[position])}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 500, damping: 30 }}
      >
        <Button
          onClick={handleButtonClick}
          className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all"
          size="icon"
        >
          <Music className="h-5 w-5" />
          <span className="sr-only">Open Sound Panel</span>
          
          {/* Trending badge */}
          {hasNewTrends && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center">
                <TrendingUp className="h-2 w-2 text-white" />
              </span>
            </span>
          )}
        </Button>
      </motion.div>
    );
  }
  
  // Enhanced floating button (when sound is playing)
  return (
    <motion.div
      className={cn("fixed z-40", positionClasses[position])}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence>
        {/* Expanded panel */}
        {isExpanded && (
          <motion.div
            className="bg-white rounded-lg shadow-lg p-3 mb-3 border w-60"
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-sm truncate">
                {currentSound.title || 'Unknown Sound'}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={toggleExpanded}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 mb-2 truncate">
              {currentSound.authorName || 'Unknown Artist'}
            </div>
            
            {/* Progress bar */}
            <div className="h-1 bg-gray-100 rounded-full mb-2 overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mb-3">
              <span>{formatAudioTime(progress)}</span>
              <span>{formatAudioTime(duration)}</span>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs h-8"
                onClick={toggleMute}
              >
                {volume === 0 ? <VolumeX className="h-3 w-3 mr-1" /> : <Volume2 className="h-3 w-3 mr-1" />}
                {volume === 0 ? 'Unmute' : 'Mute'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs h-8"
                onClick={openSoundBrowser}
              >
                <Music className="h-3 w-3 mr-1" />
                Sound Library
              </Button>
            </div>
          </motion.div>
        )}
        
        {/* Main button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <Button
            onClick={handleButtonClick}
            className={cn(
              "rounded-full shadow-lg text-white flex items-center justify-center p-2 transition-all",
              isPlaying 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-primary hover:bg-primary/90"
            )}
            size="icon"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          
          {/* Show expand toggle when hovering */}
          {showControls && !isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-10 left-1/2 transform -translate-x-1/2"
            >
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 rounded-full bg-white shadow-md"
                onClick={toggleExpanded}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default AudioButton; 