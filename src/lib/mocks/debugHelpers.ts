"use client";

/**
 * Helper functions for debugging authentication and session state
 * These can be called from any component to check the current state
 */

// Log the current session state
export function logSessionState() {
  if (typeof window === 'undefined') return;
  
  console.group('🔐 Session Debug Info');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Is Development:', process.env.NODE_ENV === 'development');
  
  // Check for mock session
  const hasMockFlag = localStorage.getItem('trendzo_dev_bypass') === 'true';
  console.log('Dev Bypass Active:', hasMockFlag);
  
  console.groupEnd();
}

// Log component render with identifying information
export function logComponentRender(componentName: string, props?: any) {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log(`🧩 Rendering: ${componentName}`, props ? props : '');
}

// Monitor auth-related errors
export function setupAuthErrorMonitoring() {
  if (typeof window === 'undefined') return;
  
  // Only in development
  if (process.env.NODE_ENV !== 'development') return;
  
  const originalConsoleError = console.error;
  
  console.error = (...args) => {
    // Check if error is related to authentication
    const errorString = args.join(' ');
    if (
      errorString.includes('auth') || 
      errorString.includes('session') ||
      errorString.includes('login') ||
      errorString.includes('unauthorized')
    ) {
      console.group('🔒 Auth Error Detected');
      originalConsoleError(...args);
      console.log('Using dev mode authentication bypass might fix this.');
      console.groupEnd();
    } else {
      originalConsoleError(...args);
    }
  };
  
  return () => {
    console.error = originalConsoleError;
  };
}

// Initialize all debug helpers
export function initDebugHelpers() {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'development') return;
  
  // Setup error monitoring
  const cleanupErrorMonitor = setupAuthErrorMonitoring();
  
  // Log session state on init
  logSessionState();
  
  // Add dev mode indicator
  const devIndicator = document.createElement('div');
  devIndicator.className = 'fixed bottom-2 right-2 z-50 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold';
  devIndicator.textContent = 'DEV AUTH';
  document.body.appendChild(devIndicator);
  
  // Return cleanup function
  return () => {
    if (typeof cleanupErrorMonitor === 'function') {
      cleanupErrorMonitor();
    }
    
    if (devIndicator && devIndicator.parentNode) {
      devIndicator.parentNode.removeChild(devIndicator);
    }
  };
} 