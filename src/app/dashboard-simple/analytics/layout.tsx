'use client';

import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

/**
 * Simple Analytics Layout
 * 
 * This is a minimal layout for the analytics section that ensures proper 
 * error handling and consistent structure.
 */
export default function SimpleAnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary fallback={
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-xl font-bold text-red-800 mb-2">Analytics Error</h2>
        <p className="text-red-700 mb-4">There was a problem loading the analytics section.</p>
        <div className="flex gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
          <button
            onClick={() => window.location.href = '/dashboard-simple'}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    }>
      {children}
    </ErrorBoundary>
  );
} 