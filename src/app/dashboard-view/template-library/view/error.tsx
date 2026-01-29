'use client';

import { useEffect } from 'react';
import TemplateLibraryEmergencyFallback from './emergency-fallback';

// This is the error boundary for the template library page
export default function TemplateLibraryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console
    console.error('Template library error:', error);
  }, [error]);

  return <TemplateLibraryEmergencyFallback error={error} />;
} 