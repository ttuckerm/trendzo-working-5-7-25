"use client";

import React, { useState, useEffect } from "react";
import { initializeComponentResolution } from "@/lib/utils/import-resolver";
import { applyDOMPatches } from "@/lib/utils/dom-patches";
import ErrorBoundary from '@/components/ui/error-boundary';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { SubscriptionProvider } from '@/lib/contexts/SubscriptionContext';
import { AnimationProvider } from '@/lib/contexts/AnimationContext';
import { AudioProvider, useAudio } from '@/lib/contexts/AudioContext';
import { AudioVisualProvider } from '@/lib/contexts/audiovisual/AudioVisualContext';
import { FeatureProvider } from '@/lib/contexts/FeatureContext';
import GlobalAudioPlayer from '@/components/audio/GlobalAudioPlayer';
import { Sound } from '@/lib/types/audio';
import { TikTokSound } from '@/lib/types/tiktok';

// Helper function to convert TikTokSound to Sound
const convertToSound = (tikTokSound: TikTokSound | null): Sound | null => {
  if (!tikTokSound) return null;
  
  return {
    id: tikTokSound.id,
    title: tikTokSound.title,
    artist: tikTokSound.authorName,
    url: tikTokSound.playUrl || '',
    duration: tikTokSound.duration,
    coverImage: tikTokSound.coverMedium || tikTokSound.coverThumb || tikTokSound.coverLarge
  };
};

// Create a wrapper component that connects AudioContext to GlobalAudioPlayer
const ConnectedAudioPlayer = () => {
  const { 
    currentSound: tikTokSound, 
    isPlaying, 
    play, 
    pause, 
    next, 
    previous, 
    toggle, 
    setVolume, 
    volume,
    showSoundPanel 
  } = useAudio();
  
  // Convert TikTokSound to Sound for GlobalAudioPlayer
  const currentSound = convertToSound(tikTokSound);
  
  // Create wrappers for the functions to match expected types
  const handlePlay = () => {
    if (tikTokSound) {
      play(tikTokSound);
    }
  };
  
  const handleToggle = (sound?: Sound) => {
    // Since we're just toggling the current sound, we can use toggle()
    // without parameters in most cases
    toggle();
  };
  
  return (
    <GlobalAudioPlayer
      currentSound={currentSound}
      isPlaying={isPlaying}
      onPlay={handlePlay}
      onPause={pause}
      onNext={next}
      onPrevious={previous}
      onToggleSound={handleToggle}
      onVolumeChange={setVolume}
      volume={volume}
      showSoundPanel={showSoundPanel}
    />
  );
};

/**
 * Global application providers component
 * This wraps the entire application with necessary context providers
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  // Initialize patches and fixes on initial mount
  useEffect(() => {
    console.log(`[Providers] Initializing...`);
    setMounted(true);
    
    // Apply DOM patches to fix Node insertion errors
    const domCleanup = applyDOMPatches();
    
    // Initialize component resolution
    const componentCleanup = initializeComponentResolution();
    
    // Clean up on unmount
    return () => {
      domCleanup();
      componentCleanup();
    };
  }, []);
  
  // During SSR, just render children without providers that might cause hydration issues
  if (!mounted) {
    return <>{children}</>;
  }
  
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <FeatureProvider>
          <SubscriptionProvider>
            <AnimationProvider>
              <AudioProvider>
                <AudioVisualProvider>
                  {children}
                  <ConnectedAudioPlayer />
                </AudioVisualProvider>
              </AudioProvider>
            </AnimationProvider>
          </SubscriptionProvider>
        </FeatureProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
} 