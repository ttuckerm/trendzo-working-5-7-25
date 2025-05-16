// src/pages/_app.tsx
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initErrorHandling } from '@/lib/utils/errorHandler';
import { featureFlags } from '@/lib/utils/featureFlags';
import { logger } from '@/lib/utils/logger';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';

function AppContent({ Component, pageProps }: AppProps) {
  const { user } = useAuth();
  
  useEffect(() => {
    // Initialize error handling
    initErrorHandling();

    // Initialize feature flags
    featureFlags.initialize().catch(console.error);

    // Global error handler
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Log to our system
      logger.error('GlobalConsole', args.join(' '));
      // Call original
      originalConsoleError.apply(console, args);
    };

    // Unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error('UnhandledPromise', event.reason);
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Global error event
    const handleError = (event: ErrorEvent) => {
      logger.error('GlobalError', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };
    window.addEventListener('error', handleError);

    // Log user information if available
    if (user?.id) {
      logger.info('UserAuthenticated', { userId: user.id });
    }

    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [user]);

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <AppContent {...props} />
    </AuthProvider>
  );
}