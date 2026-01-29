'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Home, ArrowRight, LayoutDashboard } from 'lucide-react';

/**
 * Simple Dashboard - A clean starting point for our migration
 * 
 * This is a simplified dashboard page that doesn't depend on complex components
 * or authentication. It serves as a reliable entry point that won't break
 * during migration.
 */
export default function SimpleDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading to ensure hooks work properly
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border border-red-100 bg-red-50 p-8 shadow-md">
          <h1 className="mb-4 text-2xl font-bold text-red-700">Error</h1>
          <p className="mb-6 text-red-600">{error}</p>
          <Link 
            href="/"
            className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Home className="mr-2 h-4 w-4" /> Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <LayoutDashboard className="mr-2 h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-medium">Simple Dashboard</h1>
            </div>
            <Link
              href="/"
              className="flex items-center rounded bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
            >
              <Home className="mr-2 h-4 w-4" /> Home
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="mb-2 text-2xl font-bold">Migration Approach</h2>
          <p className="text-gray-600">
            This page serves as a clean starting point for migrating your application 
            using a more conservative approach.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Working Pages Card */}
          <div className="rounded-lg border border-green-100 bg-green-50 p-6">
            <h3 className="mb-2 text-lg font-semibold text-green-800">Working Pages</h3>
            <p className="mb-4 text-green-700">
              These pages are functional and can be used as templates for migration.
            </p>
            <div className="space-y-2 text-sm">
              <Link 
                href="/editor-simple" 
                className="flex items-center rounded-md bg-white px-3 py-2 shadow-sm hover:bg-gray-50"
              >
                Simple Editor <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
              <Link 
                href="/editor-basic" 
                className="flex items-center rounded-md bg-white px-3 py-2 shadow-sm hover:bg-gray-50"
              >
                Basic Editor <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Stable Routes Card */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-6">
            <h3 className="mb-2 text-lg font-semibold text-blue-800">Stable Routes</h3>
            <p className="mb-4 text-blue-700">
              Use these routes as examples for creating new, stable pages.
            </p>
            <div className="space-y-2 text-sm">
              <Link 
                href="/dashboard-view" 
                className="flex items-center rounded-md bg-white px-3 py-2 shadow-sm hover:bg-gray-50"
              >
                Current Dashboard <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
              <Link 
                href="/dashboard-simple/analytics" 
                className="flex items-center rounded-md bg-white px-3 py-2 shadow-sm hover:bg-gray-50"
              >
                Simple Analytics <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Migration Plan Card */}
          <div className="rounded-lg border border-purple-100 bg-purple-50 p-6">
            <h3 className="mb-2 text-lg font-semibold text-purple-800">Migration Plan</h3>
            <p className="mb-4 text-purple-700">
              Incremental approach to migrating your application.
            </p>
            <ol className="ml-5 list-decimal space-y-2 text-sm text-purple-800">
              <li>Create simple standalone pages</li>
              <li>Gradually copy functionality from existing pages</li>
              <li>Use feature flags to control rollout</li>
              <li>Test thoroughly before switching routes</li>
            </ol>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-xl font-semibold">Development Status</h3>
          <div className="space-y-3">
            <p className="flex items-center text-green-600">
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs">✓</span>
              React hooks working correctly
            </p>
            <p className="flex items-center text-green-600">
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs">✓</span>
              Page routing functioning
            </p>
            <p className="flex items-center text-green-600">
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs">✓</span>
              Components rendering properly
            </p>
            <p className="flex items-center text-amber-600">
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs">!</span>
              Migration in progress
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 