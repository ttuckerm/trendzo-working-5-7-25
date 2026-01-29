"use client";

import { useEffect } from 'react';
import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { applyDOMPatches } from '@/lib/utils/dom-patches';
import { initializeComponentResolution } from '@/lib/utils/import-resolver';
import ErrorBoundary from '@/components/ui/error-boundary';
import DeprecationBanner from '@/app/components/DeprecationBanner'
import { installFetchInstrumentation } from '@/lib/debug/fetch-instrumentation'
import { usePathname } from 'next/navigation'
import { TopBanner } from '@/components/ui/TopBanner'
import { GlobalBrainProvider } from '@/contexts/GlobalBrainContext'
import { FloatingBrainChat } from '@/components/admin/FloatingBrainChat'
import { FloatingBrainTrigger } from '@/components/admin/FloatingBrainTrigger'

const QaOverlay = dynamic(() => import('@/components/qa/QaOverlay'), { ssr: false })

/**
 * Global Application Wrapper
 * 
 * This component applies DOM patches and error handling at the highest level
 * to prevent React reconciliation errors from crashing the application.
 */
export default function RootLayout({
  children
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const isMembershipRoute = (pathname || '').startsWith('/membership')
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

    // Install client fetch instrumentation and debug drawer logging
    try { installFetchInstrumentation() } catch {}
    
    return () => {
      cleanup();
      cleanupResolver();
      window.removeEventListener('error', errorHandler);
    };
  }, []);
  
  return (
    <ErrorBoundary>
      <GlobalBrainProvider>
        <div id="app-root">
          <DeprecationBanner />
          <TopBanner />
          {children}
          <FloatingBrainChat />
          <FloatingBrainTrigger />
          <QaOverlay />
        </div>
      </GlobalBrainProvider>
    </ErrorBoundary>
  );
} 