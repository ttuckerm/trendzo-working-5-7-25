"use client";

import React from 'react';
import { Play, Pause, Volume2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSound } from '@/lib/hooks/useSound';
import { Sound } from '@/lib/types/audio';
import { Tooltip } from '@/components/ui/tooltip';
import { formatAudioTime } from '@/lib/utils/audioUtils';

interface SoundButtonProps {
  sound: Sound;
  variant?: 'icon' | 'minimal' | 'inline' | 'card';
  size?: 'sm' | 'md' | 'lg';
  showFavorite?: boolean;
  showDuration?: boolean;
  className?: string;
}

/**
 * SoundButton Component
 * 
 * A reusable button for playing sounds, with different visual variants.
 * 
 * Variants:
 * - icon: Just the play/pause icon
 * - minimal: Icon + sound title
 * - inline: Icon, title, and optional artist/duration
 * - card: A card-like layout with more details
 */
const SoundButton: React.FC<SoundButtonProps> = ({
  sound,
  variant = 'inline',
  size = 'md',
  showFavorite = false,
  showDuration = true,
  className
}) => {
  // Use our custom hook to manage the sound
  const {
    isPlaying,
    isCurrentSound,
    togglePlayback,
    toggleFavorite,
    isInFavorites,
    duration
  } = useSound(sound);
  
  // Size-based classes
  const sizeClasses = {
    sm: 'h-7 text-xs',
    md: 'h-9 text-sm',
    lg: 'h-11 text-base'
  };
  
  // Render icon-only variant
  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayback}
        aria-label={isPlaying ? `Pause ${sound.title}` : `Play ${sound.title}`}
        className={cn(
          sizeClasses[size],
          isPlaying && 'text-primary',
          className
        )}
      >
        {isPlaying ? <Pause /> : <Play />}
      </Button>
    );
  }
  
  // Render minimal variant (icon + title)
  if (variant === 'minimal') {
    return (
      <Button
        variant="ghost"
        onClick={togglePlayback}
        className={cn(
          'flex items-center gap-2',
          sizeClasses[size],
          isPlaying && 'text-primary',
          className
        )}
      >
        {isPlaying ? <Pause className="shrink-0" /> : <Play className="shrink-0" />}
        <span className="truncate">{sound.title}</span>
      </Button>
    );
  }
  
  // Render inline variant
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayback}
          aria-label={isPlaying ? `Pause ${sound.title}` : `Play ${sound.title}`}
          className={cn(
            sizeClasses[size],
            isPlaying && 'text-primary'
          )}
        >
          {isPlaying ? <Pause /> : <Play />}
        </Button>
        
        <div className="flex flex-col">
          <span className="font-medium truncate">{sound.title}</span>
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            {sound.artist && <span className="truncate">{sound.artist}</span>}
            {showDuration && sound.duration && (
              <span>{formatAudioTime(sound.duration)}</span>
            )}
          </div>
        </div>
        
        {showFavorite && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite();
            }}
            aria-label={isInFavorites ? `Remove ${sound.title} from favorites` : `Add ${sound.title} to favorites`}
            className={sizeClasses[size]}
          >
            <Heart className={cn('w-4 h-4', isInFavorites && 'fill-red-500 text-red-500')} />
          </Button>
        )}
      </div>
    );
  }
  
  // Render card variant
  return (
    <div 
      className={cn(
        'border rounded-md p-3 hover:bg-accent/50 cursor-pointer transition-colors',
        className
      )}
      onClick={togglePlayback}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded bg-muted overflow-hidden flex items-center justify-center shrink-0">
          {sound.coverImage ? (
            <img 
              src={sound.coverImage} 
              alt={sound.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <Volume2 className="text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium truncate">{sound.title}</span>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayback();
              }}
              aria-label={isPlaying ? `Pause ${sound.title}` : `Play ${sound.title}`}
              className="h-7 w-7"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              {sound.artist && <span className="truncate">{sound.artist}</span>}
              {showDuration && sound.duration && (
                <span>{formatAudioTime(sound.duration)}</span>
              )}
            </div>
            
            {showFavorite && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite();
                }}
                aria-label={isInFavorites ? `Remove ${sound.title} from favorites` : `Add ${sound.title} to favorites`}
                className="h-7 w-7"
              >
                <Heart className={cn('w-4 h-4', isInFavorites && 'fill-red-500 text-red-500')} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoundButton; 