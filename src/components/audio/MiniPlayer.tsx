"use client";

import React from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Heart } from 'lucide-react';
import { useAudio } from '@/lib/contexts/AudioContext';
import { formatAudioTime, calculateProgress } from '@/lib/utils/audioUtils';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

/**
 * MiniPlayer Component
 * 
 * A compact audio player that remains visible while browsing the app.
 * Implements Unicorn UX principles:
 * - Invisible Interface: Stays out of the way until needed
 * - Emotional Design: Subtle animations and visual feedback
 * - Contextual Intelligence: Shows relevant controls
 * - Progressive Disclosure: Minimal controls with expand option
 * - Sensory Harmony: Visual indicators match audio state
 */
const MiniPlayer: React.FC = () => {
  const { 
    state, 
    togglePlay, 
    toggleMute, 
    seek, 
    expandPlayer,
    addToFavorites,
    removeFromFavorites,
    isFavorite
  } = useAudio();
  
  const { currentSound, playback, ui } = state;
  
  // If no sound is loaded or player is hidden, don't render
  if (!currentSound || ui.playerMode === 'hidden') {
    return null;
  }
  
  // Calculate progress percentage
  const progressPercent = calculateProgress(playback.currentTime, playback.duration);
  
  // Determine if current sound is a favorite
  const isCurrentSoundFavorite = currentSound ? isFavorite(currentSound.id) : false;
  
  // Toggle favorite status
  const handleToggleFavorite = () => {
    if (!currentSound) return;
    
    if (isCurrentSoundFavorite) {
      removeFromFavorites(currentSound.id);
    } else {
      addToFavorites(currentSound);
    }
  };
  
  // Handle seeking when user clicks or drags the progress bar
  const handleSeek = (value: number[]) => {
    const newTime = (value[0] / 100) * playback.duration;
    seek(newTime);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-50 p-2 shadow-md">
      <div className="flex items-center max-w-7xl mx-auto">
        {/* Sound info */}
        <div className="flex-shrink-0 w-12 h-12 rounded bg-muted overflow-hidden mr-3">
          {currentSound.coverImage ? (
            <img 
              src={currentSound.coverImage} 
              alt={currentSound.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <Volume2 className="h-6 w-6 text-primary/60" />
            </div>
          )}
        </div>
        
        <div className="mr-4 flex-grow min-w-0">
          <div className="flex items-center justify-between mb-1">
            {/* Title and artist */}
            <div className="truncate pr-2">
              <p className="font-medium text-sm truncate">{currentSound.title}</p>
              {currentSound.artist && (
                <p className="text-xs text-muted-foreground truncate">{currentSound.artist}</p>
              )}
            </div>
            
            {/* Time display */}
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {formatAudioTime(playback.currentTime)} / {formatAudioTime(playback.duration)}
            </div>
          </div>
          
          {/* Progress bar */}
          <Slider
            value={[progressPercent]}
            max={100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full h-1.5"
          />
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Play/Pause button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            aria-label={playback.isPlaying ? "Pause" : "Play"}
            className="h-8 w-8"
          >
            {playback.isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          
          {/* Mute button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            aria-label={playback.muted ? "Unmute" : "Mute"}
            className="h-8 w-8"
          >
            {playback.muted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
          
          {/* Favorite button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            aria-label={isCurrentSoundFavorite ? "Remove from favorites" : "Add to favorites"}
            className="h-8 w-8"
          >
            <Heart 
              className={cn(
                "h-5 w-5",
                isCurrentSoundFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
              )}
            />
          </Button>
          
          {/* Expand button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={expandPlayer}
            aria-label="Expand player"
            className="h-8 w-8"
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer; 