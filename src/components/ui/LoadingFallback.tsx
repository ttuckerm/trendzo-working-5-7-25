"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, AlertTriangle, Home, ArrowLeft } from 'lucide-react';

interface LoadingFallbackProps {
  loadingMessage?: string;
  fallbackMessage?: string;
  timeoutMs?: number;
  showHomeLink?: boolean;
  showBackLink?: boolean;
  backHref?: string;
}

export default function LoadingFallback({
  loadingMessage = 'Loading...',
  fallbackMessage = 'This is taking longer than expected.',
  timeoutMs = 8000,
  showHomeLink = true,
  showBackLink = false,
  backHref = '/',
}: LoadingFallbackProps) {
  const [showFallback, setShowFallback] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    // Set a timeout to show fallback message
    const fallbackTimer = setTimeout(() => {
      setShowFallback(true);
    }, timeoutMs / 2);

    // Set a timeout to indicate a complete timeout
    const timeoutTimer = setTimeout(() => {
      setHasTimedOut(true);
    }, timeoutMs);

    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(timeoutTimer);
    };
  }, [timeoutMs]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
      <div className="mb-6">
        {hasTimedOut ? (
          <AlertTriangle className="h-10 w-10 text-amber-500 animate-pulse" />
        ) : (
          <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
        )}
      </div>
      
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        {loadingMessage}
      </h2>
      
      {showFallback && (
        <div className="mt-4">
          <p className="text-gray-600 max-w-md mb-6">
            {fallbackMessage}
            {hasTimedOut && (
              <>
                <br />
                <span className="text-amber-600 font-medium mt-2 block">
                  There might be an issue with loading this content.
                </span>
              </>
            )}
          </p>
          
          <div className="flex flex-wrap gap-3 justify-center">
            {showHomeLink && (
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 rounded bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors"
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            )}
            
            {showBackLink && (
              <Link
                href={backHref}
                className="inline-flex items-center px-4 py-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 