"use client";

import { useEffect } from 'react';
import { applyDOMPatches } from '@/lib/utils/dom-patches';
import { initializeComponentResolution } from '@/lib/utils/import-resolver';
import ErrorBoundary from '@/components/ui/error-boundary';

/**
 * Global Application Wrapper
 * 
 * This component applies DOM patches and error handling at the highest level
 * to prevent React reconciliation errors from crashing the application.
 */
export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Apply DOM patches to fix Node insertion errors
    const cleanup = applyDOMPatches();
    
    // Initialize component resolution system
    const cleanupResolver = initializeComponentResolution();
    
    // Apply global error handler for React DOM errors
    const errorHandler = (event: ErrorEvent) => {
      if (event.error && event.error.message && 
          (event.error.message.includes('insertBefore') || 
           event.error.message.includes('appendChild') ||
           event.error.message.includes('removeChild'))) {
        console.warn('[GlobalErrorHandler] Caught DOM mutation error:', event.error.message);
        event.preventDefault();
        return true;
      }
      return false;
    };
    
    window.addEventListener('error', errorHandler);
    
    return () => {
      cleanup();
      cleanupResolver();
      window.removeEventListener('error', errorHandler);
    };
  }, []);
  
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
} 