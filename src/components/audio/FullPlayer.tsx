"use client";

import React, { useState } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Minimize2, 
  Heart, Repeat, ListMusic, X, Settings
} from 'lucide-react';
import { useAudio } from '@/lib/contexts/AudioContext';
import { formatAudioTime, calculateProgress, getTimeRemaining } from '@/lib/utils/audioUtils';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSoundCollection } from '@/lib/hooks/useSoundCollection';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * FullPlayer Component
 * 
 * An expanded audio player with advanced controls and visualizations.
 * Implements Unicorn UX principles:
 * - Invisible Interface: Clean, focused UI that highlights content
 * - Emotional Design: Rich interactions and visual feedback
 * - Contextual Intelligence: Shows related content and history
 * - Progressive Disclosure: Advanced features organized in tabs
 * - Sensory Harmony: Visual representation of audio through waveform
 */
const FullPlayer: React.FC = () => {
  const { 
    state, 
    togglePlay, 
    toggleMute, 
    seek, 
    setVolume,
    setLoop,
    setPlaybackRate,
    collapsePlayer,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    updatePreferences
  } = useAudio();
  
  const { currentSound, playback, ui } = state;
  const recentSounds = useSoundCollection('recent');
  
  const [activeTab, setActiveTab] = useState<string>('waveform');
  const [volumeHovered, setVolumeHovered] = useState(false);
  
  // Handle closing the full player
  const handleClose = () => {
    collapsePlayer();
  };
  
  // If no sound is loaded, don't render
  if (!currentSound) {
    return null;
  }
  
  // Calculate progress percentage
  const progressPercent = calculateProgress(playback.currentTime, playback.duration);
  
  // Determine if current sound is a favorite
  const isCurrentSoundFavorite = isFavorite(currentSound.id);
  
  // Toggle favorite status
  const handleToggleFavorite = () => {
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
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };
  
  // Toggle loop mode
  const handleToggleLoop = () => {
    setLoop(!playback.loop);
  };

  // Handle playback rate change
  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
  };

  // Toggle time remaining display preference
  const handleToggleTimeRemaining = () => {
    updatePreferences({
      showTimeRemaining: !state.preferences.showTimeRemaining
    });
  };

  // Toggle autoplay preference
  const handleToggleAutoplay = () => {
    updatePreferences({
      autoplay: !state.preferences.autoplay
    });
  };
  
  // Render a placeholder waveform visualization
  const renderWaveform = () => {
    const waveformCount = 100;
    const randomHeights = Array.from({ length: waveformCount }, () => 
      Math.random() * 0.8 + 0.2
    );
    
    return (
      <div className="flex items-end h-32 gap-[2px] px-4 py-6">
        {randomHeights.map((height, index) => {
          const isActive = (index / waveformCount) * 100 <= progressPercent;
          
          return (
            <div 
              key={index}
              className={cn(
                "w-1 rounded-sm transition-all duration-100",
                isActive ? "bg-primary" : "bg-gray-300"
              )}
              style={{ 
                height: `${height * 100}%`,
                opacity: isActive ? 1 : 0.5
              }}
            />
          );
        })}
      </div>
    );
  };
  
  // Render recent sounds list
  const renderRecentSounds = () => {
    if (recentSounds.isEmpty) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          <p>No recently played sounds</p>
        </div>
      );
    }
    
    return (
      <div className="max-h-64 overflow-y-auto p-2">
        {recentSounds.sounds.map(sound => (
          <div 
            key={sound.id} 
            className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer"
            onClick={() => recentSounds.playSound(sound)}
          >
            <div className="w-10 h-10 bg-primary/10 rounded flex-shrink-0 flex items-center justify-center mr-3">
              {sound.coverImage ? (
                <img src={sound.coverImage} alt="" className="w-full h-full object-cover rounded" />
              ) : (
                <Volume2 className="h-5 w-5 text-primary/60" />
              )}
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-medium text-sm truncate">{sound.title}</p>
              {sound.artist && (
                <p className="text-xs text-muted-foreground truncate">{sound.artist}</p>
              )}
            </div>
            <div className="text-xs text-muted-foreground ml-2">
              {formatAudioTime(sound.duration || 0)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render settings panel
  const renderSettings = () => {
    return (
      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Playback Settings</h3>
          
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Playback Speed</Label>
            <div className="flex justify-between items-center space-x-2">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(rate => (
                <Button
                  key={rate}
                  variant={playback.playbackRate === rate ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePlaybackRateChange(rate)}
                  className="h-8 px-2 min-w-[40px]"
                >
                  {rate}x
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-time-remaining">Show Time Remaining</Label>
                <p className="text-xs text-muted-foreground">
                  Display remaining time instead of total duration
                </p>
              </div>
              <Switch
                id="show-time-remaining"
                checked={state.preferences.showTimeRemaining}
                onCheckedChange={handleToggleTimeRemaining}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoplay">Autoplay</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically play sound when loaded
                </p>
              </div>
              <Switch
                id="autoplay"
                checked={state.preferences.autoplay}
                onCheckedChange={handleToggleAutoplay}
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Volume</h3>
          <Slider
            value={[playback.volume * 100]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>{Math.round(playback.volume * 100)}%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Now Playing</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <Minimize2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Sound info */}
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-36 h-36 bg-muted rounded-md shadow-md overflow-hidden mb-4">
          {currentSound.coverImage ? (
            <img 
              src={currentSound.coverImage} 
              alt={currentSound.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <Volume2 className="h-16 w-16 text-primary/60" />
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-bold">{currentSound.title}</h3>
        {currentSound.artist && (
          <p className="text-muted-foreground mt-1">{currentSound.artist}</p>
        )}
      </div>
      
      {/* Tabs for different views */}
      <Tabs
        defaultValue="waveform"
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-grow flex flex-col"
      >
        <div className="border-b px-4">
          <TabsList className="mb-0">
            <TabsTrigger value="waveform">Waveform</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-grow overflow-auto">
          <TabsContent value="waveform" className="h-full">
            {renderWaveform()}
          </TabsContent>
          
          <TabsContent value="recent" className="h-full">
            {renderRecentSounds()}
          </TabsContent>
          
          <TabsContent value="settings" className="h-full">
            {renderSettings()}
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Progress bar */}
      <div className="px-4 pt-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{formatAudioTime(playback.currentTime)}</span>
          <span>
            {state.preferences.showTimeRemaining 
              ? `-${getTimeRemaining(playback.currentTime, playback.duration)}`
              : formatAudioTime(playback.duration)
            }
          </span>
        </div>
        <Slider
          value={[progressPercent]}
          max={100}
          step={0.1}
          onValueChange={handleSeek}
          className="w-full"
        />
      </div>
      
      {/* Controls */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Loop button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleLoop}
            aria-label={playback.loop ? "Disable loop" : "Enable loop"}
            className={cn("h-10 w-10", playback.loop ? "text-primary" : "text-muted-foreground")}
          >
            <Repeat className="h-5 w-5" />
          </Button>
          
          {/* Favorite button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            aria-label={isCurrentSoundFavorite ? "Remove from favorites" : "Add to favorites"}
            className="h-10 w-10"
          >
            <Heart 
              className={cn(
                "h-5 w-5",
                isCurrentSoundFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
              )}
            />
          </Button>
        </div>
        
        {/* Main playback controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous"
            className="h-10 w-10"
            disabled // Will be enabled when playlist functionality is added
          >
            <SkipBack className="h-5 w-5" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
            aria-label={playback.isPlaying ? "Pause" : "Play"}
            className="h-14 w-14 rounded-full"
          >
            {playback.isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next"
            className="h-10 w-10"
            disabled // Will be enabled when playlist functionality is added
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Volume button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          aria-label={playback.muted ? "Unmute" : "Mute"}
          className="h-10 w-10"
          onMouseEnter={() => setVolumeHovered(true)}
          onMouseLeave={() => setVolumeHovered(false)}
        >
          {playback.muted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default FullPlayer; 