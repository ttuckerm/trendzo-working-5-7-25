"use client";

import React, { useState } from 'react';
import { Play, Pause, Heart, Volume2, TrendingUp, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAudio } from '@/lib/contexts/AudioContext';
import { TikTokSound } from '@/lib/types/tiktok';
import { cn } from '@/lib/utils';

interface SoundCardProps {
  sound: TikTokSound;
  variant?: 'horizontal' | 'card' | 'basic' | 'detailed' | 'compact' | 'grid';
  showStats?: boolean;
  showTrend?: boolean;
  className?: string;
  onClick?: () => void;
}

const SoundCard: React.FC<SoundCardProps> = ({
  sound,
  variant = 'basic',
  showStats = false,
  showTrend = false,
  className,
  onClick
}) => {
  const { currentSound, isPlaying, toggle } = useAudio();
  const isCurrentSound = currentSound?.id === sound.id;
  const soundPlaying = isCurrentSound && isPlaying;
  
  // Map the TikTokSound to the format expected by the AudioContext
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Need to map the TikTokSound to a format that includes properties expected by useAudio
    const soundToPlay = {
      ...sound,
      playUrl: sound.playUrl || '',
    };
    
    // Call toggle with the TikTokSound object
    toggle(soundToPlay);
  };
  
  const formatNumber = (num?: number) => {
    if (num === undefined) return '0';
    return new Intl.NumberFormat().format(num);
  };

  const getTrendIcon = () => {
    if (!sound.stats?.trend) return null;
    
    if (sound.stats.trend === 'rising') {
      return <TrendingUp className="w-3 h-3 text-green-500" />;
    } else if (sound.stats.trend === 'falling') {
      return <TrendingUp className="w-3 h-3 text-red-500 transform rotate-180" />;
    }
    return <TrendingUp className="w-3 h-3 text-gray-400" />;
  };
  
  const getPercentageChange = () => {
    if (!sound.stats?.usageCount || !sound.stats?.usageChange7d) return 0;
    return Math.round((sound.stats.usageChange7d / sound.stats.usageCount) * 100);
  };
  
  const getTrendClass = () => {
    if (!sound.stats?.trend) return 'text-gray-500';
    
    if (sound.stats.trend === 'rising') {
      return 'text-green-500';
    } else if (sound.stats.trend === 'falling') {
      return 'text-red-500';
    }
    return 'text-gray-500';
  };
  
  // Horizontal variant
  if (variant === 'horizontal') {
    return (
      <div 
        className={cn(
          "flex items-center p-3 rounded-lg border",
          soundPlaying ? "border-primary/50 bg-primary/5" : "border-border",
          className
        )}
        onClick={onClick}
      >
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-full h-8 w-8 p-0 mr-3",
            soundPlaying ? "text-primary bg-primary/10" : ""
          )}
          onClick={handlePlay}
        >
          {soundPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <div className="flex-grow min-w-0">
          <div className="font-medium truncate">{sound.title}</div>
          <div className="text-sm text-muted-foreground truncate">{sound.authorName}</div>
        </div>
        
        {showStats && (
          <div className="ml-4 text-right">
            <div className="font-medium">{formatNumber(sound.stats?.usageCount)}</div>
            {showTrend && sound.stats?.usageChange7d && (
              <div className={cn("flex items-center justify-end text-sm", getTrendClass())}>
                {getTrendIcon()}
                <span className="ml-1">
                  {sound.stats.usageChange7d > 0 ? '+' : ''}{formatNumber(sound.stats.usageChange7d)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  // Card variant
  if (variant === 'card') {
    return (
      <div 
        className={cn(
          "flex flex-col p-4 rounded-lg border h-full",
          soundPlaying ? "border-primary/50 bg-primary/5" : "border-border",
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              {sound.coverThumb ? (
                <img src={sound.coverThumb} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <Volume2 className="h-5 w-5 text-primary/60" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{sound.title}</div>
              <div className="text-sm text-muted-foreground truncate">{sound.authorName}</div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full h-8 w-8 p-0",
              soundPlaying ? "text-primary bg-primary/10" : ""
            )}
            onClick={handlePlay}
          >
            {soundPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
        
        {showStats && (
          <div className="mt-auto pt-3 border-t">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">Usage Count</div>
                <div className="font-medium">{formatNumber(sound.stats?.usageCount)}</div>
              </div>
              {showTrend && sound.stats?.usageChange7d && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">7-Day Growth</div>
                  <div className={cn("flex items-center font-medium", getTrendClass())}>
                    {getTrendIcon()}
                    <span className="ml-1">
                      {sound.stats.usageChange7d > 0 ? '+' : ''}{formatNumber(sound.stats.usageChange7d)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Basic/Default variant
  return (
    <div 
      className={cn(
        "flex items-center p-2 rounded-lg border",
        soundPlaying ? "border-primary/50 bg-primary/5" : "border-border",
        className
      )}
      onClick={onClick}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "rounded-full h-8 w-8 p-0 mr-2",
          soundPlaying ? "text-primary bg-primary/10" : ""
        )}
        onClick={handlePlay}
      >
        {soundPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      
      <div className="flex-grow min-w-0">
        <div className="font-medium truncate">{sound.title}</div>
        <div className="text-xs text-muted-foreground truncate">{sound.authorName}</div>
      </div>
    </div>
  );
};

export default SoundCard; 