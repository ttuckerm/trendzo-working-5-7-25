"use client";

import React from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useSound } from '@/lib/hooks/useSound';
import { Sound } from '@/lib/types/audio';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';

interface InlinePlayerProps {
  sound: Sound;
  size?: 'xs' | 'sm' | 'md';
  showTitle?: boolean;
  showArtist?: boolean;
  showControls?: boolean;
  className?: string;
  onSelect?: () => void;
}

/**
 * InlinePlayer - A compact audio player for embedding in templates/editor
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Minimal UI that doesn't distract from the main task
 * - Contextual Intelligence: Adapts to its container with different sizes
 * - Progressive Disclosure: Shows essential controls with options for more
 */
const InlinePlayer: React.FC<InlinePlayerProps> = ({
  sound,
  size = 'md',
  showTitle = true,
  showArtist = true,
  showControls = true,
  className,
  onSelect
}) => {
  const {
    isPlaying,
    togglePlayback,
    isMuted,
    toggleMute,
    currentTime,
    duration
  } = useSound(sound);

  // Size-based classes
  const sizeClasses = {
    xs: 'h-8 text-xs',
    sm: 'h-10 text-sm',
    md: 'h-12 text-base'
  };

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className={cn(
        'flex items-center rounded-md border bg-card p-1 shadow-sm',
        sizeClasses[size],
        className
      )}
      onClick={onSelect}
    >
      {/* Play/Pause button */}
      <Button
        variant="ghost"
        size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'default'}
        className="rounded-full flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          togglePlayback();
        }}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className={size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
        ) : (
          <Play className={size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
        )}
      </Button>

      {/* Sound info */}
      <div className="flex-grow truncate mx-2">
        {showTitle && (
          <div className="font-medium truncate leading-tight">
            {sound.title}
          </div>
        )}
        {showArtist && sound.artist && (
          <div className="text-muted-foreground truncate text-xs leading-tight">
            {sound.artist}
          </div>
        )}
      </div>

      {/* Progress bar (simple version) */}
      <div className="w-full max-w-[100px] h-1 bg-muted rounded-full overflow-hidden hidden sm:block">
        <div 
          className="h-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Duration */}
      <div className="text-xs text-muted-foreground mx-2 hidden sm:block">
        {formatTime(currentTime)} / {formatTime(duration || 0)}
      </div>

      {/* Volume control */}
      {showControls && (
        <Tooltip content={isMuted ? "Unmute" : "Mute"}>
          <Button
            variant="ghost"
            size={size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'default'}
            className="rounded-full flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className={size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
            ) : (
              <Volume2 className={size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
            )}
          </Button>
        </Tooltip>
      )}
    </div>
  );
};

export default InlinePlayer; 