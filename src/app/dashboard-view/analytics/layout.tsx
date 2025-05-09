"use client"

import React from 'react'
import ErrorBoundary from '@/components/ErrorBoundary'

/**
 * Layout component for analytics section
 * This ensures proper structure and consistent layout across all analytics pages
 */
export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary fallback={
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-xl font-bold text-red-800 mb-2">Analytics Error</h2>
        <p className="text-red-700">There was a problem loading the analytics section.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    }>
      <div className="space-y-6">
        {children}
      </div>
    </ErrorBoundary>
  )
} 