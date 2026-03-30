"use client";

import React, { useState, useEffect } from "react";
import type { ReactNode } from 'react'
import { initializeComponentResolution } from "@/lib/utils/import-resolver";
import ErrorBoundary from '@/components/ui/error-boundary';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { SubscriptionProvider } from '@/lib/contexts/SubscriptionContext';
import { AnimationProvider } from '@/lib/contexts/AnimationContext';
import { AudioProvider, useAudio } from '@/lib/contexts/AudioContext';
import { AudioVisualProvider } from '@/lib/contexts/audiovisual/AudioVisualContext';
import { FeatureProvider } from '@/lib/contexts/FeatureContext';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { Sound } from '@/lib/types/audio';
import { TikTokSound } from '@/lib/types/tiktok';

/**
 * Global application providers component
 * This wraps the entire application with necessary context providers
 */
export default function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  // Initialize patches and fixes on initial mount
  useEffect(() => {
    setMounted(true);
    
    const componentCleanup = initializeComponentResolution();
    
    return () => {
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
        <AuthProvider>
          <FeatureProvider>
            <SubscriptionProvider>
              <AnimationProvider>
                <AudioProvider>
                  <AudioVisualProvider>
                    {children}
                  </AudioVisualProvider>
                </AudioProvider>
              </AnimationProvider>
            </SubscriptionProvider>
          </FeatureProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
} 