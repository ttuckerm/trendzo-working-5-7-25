"use client";

import React, { useState, useEffect } from "react"
import { initializeComponentResolution } from "@/lib/utils/import-resolver"
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
    setMounted(true)
    
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