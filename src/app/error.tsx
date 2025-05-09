'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="max-w-md">
        <h1 className="mb-2 text-4xl font-bold text-gray-900">Something went wrong!</h1>
        <p className="mb-8 text-gray-500">
          We've encountered an error while loading this page.
        </p>
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <Button onClick={reset} className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Link href="/dashboard-view">
            <Button variant="outline" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 rounded bg-red-50 p-4 text-left">
            <p className="font-medium text-red-800">Error details:</p>
            <pre className="mt-2 max-h-40 overflow-auto rounded bg-red-100 p-2 text-xs text-red-800">
              {error.message}
              {'\n'}
              {error.stack}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 