"use client";

import { useEffect } from 'react';
import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
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
  const isAgencyRoute = (pathname || '').startsWith('/agency')
  useEffect(() => {
    const cleanupResolver = initializeComponentResolution();

    try { installFetchInstrumentation() } catch {}
    
    return () => {
      cleanupResolver();
    };
  }, []);
  
  return (
    <ErrorBoundary>
      <GlobalBrainProvider>
        <div id="app-root">
          <DeprecationBanner />
          <TopBanner />
          {children}
          {!isAgencyRoute && <FloatingBrainChat />}
          {!isAgencyRoute && <FloatingBrainTrigger />}
          <QaOverlay />
        </div>
      </GlobalBrainProvider>
    </ErrorBoundary>
  );
} 