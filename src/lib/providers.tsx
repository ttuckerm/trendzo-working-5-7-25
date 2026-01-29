"use client";

import React, { useState, useEffect } from "react"
import { initializeComponentResolution } from "@/lib/utils/import-resolver"
import { applyDOMPatches } from "@/lib/utils/dom-patches"
import ErrorBoundary from '@/components/ui/error-boundary';
import { AnimationProvider } from '@/lib/contexts/AnimationContext';
import { NavigationProvider } from '@/lib/contexts/NavigationContext';
import { UsabilityTestProvider } from '@/lib/contexts/UsabilityTestContext';

/**
 * Global application providers component
 * This wraps the entire application with necessary context providers
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  // Initialize patches and fixes on initial mount
  useEffect(() => {
    console.log(`[Providers] Initializing...`);
    setMounted(true)
    
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
      <AnimationProvider>
        <NavigationProvider>
          <UsabilityTestProvider>
            {children}
          </UsabilityTestProvider>
        </NavigationProvider>
      </AnimationProvider>
    </ErrorBoundary>
  );
} 