'use client';

import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

/**
 * Simple Dashboard Layout
 * 
 * This is a minimal layout for the simple dashboard that doesn't depend on 
 * complex components or authentication. It serves as a reliable wrapper
 * that won't break during migration.
 */
export default function SimpleDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary fallback={
      <div className="flex min-h-screen items-center justify-center bg-red-50 p-6">
        <div className="w-full max-w-md rounded-lg border border-red-100 bg-white p-8 shadow-md">
          <h2 className="mb-4 text-2xl font-bold text-red-600">Something went wrong</h2>
          <p className="mb-6 text-gray-600">
            There was an error loading the dashboard. This is a simplified version
            that should be more stable.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Refresh Page
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="rounded bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    }>
      {children}
    </ErrorBoundary>
  );
} 