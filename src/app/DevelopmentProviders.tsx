"use client";

import { ReactNode, useEffect, useState } from "react";
import { MockSessionProvider } from "@/lib/mocks/sessionMock";
import { initializeComponentResolution } from "@/lib/utils/import-resolver";

interface DevelopmentProvidersProps {
  children: ReactNode;
}

/**
 * DevelopmentProviders is a wrapper component that provides mock providers 
 * in development mode to ensure components using hooks like useSession()
 * function correctly without errors.
 */
export default function DevelopmentProviders({ children }: DevelopmentProvidersProps) {
  const [mounted, setMounted] = useState(false);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    // This code only runs on the client
    setMounted(true);
    
    // Check if we're in development mode
    setIsDev(process.env.NODE_ENV === 'development');
    
    // Initialize component resolution system
    const cleanupResolution = initializeComponentResolution();
    
    // Add visual indicator for dev mode
    const addDevModeIndicator = () => {
      if (process.env.NODE_ENV === 'development') {
        const existingIndicator = document.querySelector('.dev-mode-indicator');
        if (!existingIndicator) {
          const indicator = document.createElement('div');
          indicator.className = 'dev-mode-indicator fixed bottom-2 left-2 z-50 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full';
          indicator.textContent = 'DEV MODE';
          document.body.appendChild(indicator);
          return () => {
            if (indicator.parentNode) {
              indicator.parentNode.removeChild(indicator);
            }
          };
        }
      }
      return () => {};
    };
    
    const cleanupIndicator = addDevModeIndicator();
    
    return () => {
      if (typeof cleanupResolution === 'function') {
        cleanupResolution();
      }
      if (typeof cleanupIndicator === 'function') {
        cleanupIndicator();
      }
    };
  }, []);

  // During SSR or before mounting, just render children to avoid hydration issues
  if (!mounted) return <>{children}</>;

  // In development mode, wrap children with mock providers
  if (isDev) {
    return (
      <MockSessionProvider>
        {children}
      </MockSessionProvider>
    );
  }

  // In production, don't use mock providers
  return <>{children}</>;
} 