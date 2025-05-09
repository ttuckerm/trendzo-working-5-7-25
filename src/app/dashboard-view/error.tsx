'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 mb-6 flex items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
      <p className="mb-6 max-w-md text-gray-600">
        We encountered an error while loading this page. Please try again or return to the dashboard.
      </p>
      <div className="flex gap-4">
        <Button 
          variant="outline"
          onClick={() => window.location.href = '/dashboard-view'}
          className="flex items-center gap-2"
        >
          Go to dashboard
        </Button>
        <Button 
          onClick={() => reset()}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Try again
        </Button>
      </div>
      
      {/* Show technical details if available */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 w-full max-w-2xl text-left">
          <details className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <summary className="cursor-pointer font-medium text-sm text-gray-700">
              Technical Details
            </summary>
            <div className="mt-2">
              <p className="text-xs font-mono bg-gray-100 p-3 rounded overflow-auto max-h-48 whitespace-pre-wrap">
                {error.message}
                {'\n\n'}
                {error.stack}
              </p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
} 