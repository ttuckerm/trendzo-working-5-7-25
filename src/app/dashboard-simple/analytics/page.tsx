'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Home, ArrowLeft, BarChart2 } from 'lucide-react';

/**
 * Simple Analytics Page
 * 
 * This is a simplified analytics page that doesn't depend on complex components
 * or authentication. It contains minimal static data to demonstrate the structure.
 */
export default function SimpleAnalyticsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
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
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Mock data for static display
  const statsData = [
    { label: 'Total Views', value: '48,290', change: '+12%', color: 'blue' },
    { label: 'Engagement Rate', value: '27.5%', change: '+5%', color: 'green' },
    { label: 'Average Watch Time', value: '42s', change: '+8%', color: 'purple' },
    { label: 'Followers', value: '8,940', change: '+15%', color: 'pink' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart2 className="mr-2 h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-medium">Simple Analytics</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href="/dashboard-simple"
                className="flex items-center rounded bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
              </Link>
              <Link
                href="/"
                className="flex items-center rounded bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
              >
                <Home className="mr-2 h-4 w-4" /> Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="mb-2 text-2xl font-bold">Analytics Overview</h2>
          <p className="text-gray-600">
            This is a simplified analytics page with static data.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat, index) => (
            <div key={index} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-full bg-${stat.color}-100 flex items-center justify-center`}>
                  <BarChart2 className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-600 font-medium">{stat.change}</span>
                <span className="text-gray-500 ml-1">vs. last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Placeholders */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Views Over Time</h3>
            <div className="flex h-64 items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded">
              <div className="text-center">
                <BarChart2 className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                <p className="text-gray-500">Chart will be implemented here</p>
                <p className="text-xs text-gray-400 mt-1">No dependencies required</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Engagement Metrics</h3>
            <div className="flex h-64 items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded">
              <div className="text-center">
                <BarChart2 className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                <p className="text-gray-500">Chart will be implemented here</p>
                <p className="text-xs text-gray-400 mt-1">No dependencies required</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50 p-6">
          <h3 className="mb-2 text-lg font-semibold text-blue-800">Migration Note</h3>
          <p className="text-blue-700">
            This simplified page demonstrates how we can create stable pages that don't rely on complex
            dependencies or authentication. We'll gradually add functionality while ensuring the page
            remains stable.
          </p>
          <div className="mt-4 text-sm">
            <p className="flex items-center text-blue-700">
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-200 text-xs">✓</span>
              No complex dependencies
            </p>
            <p className="flex items-center text-blue-700">
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-200 text-xs">✓</span>
              Simplified component structure
            </p>
            <p className="flex items-center text-blue-700">
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-200 text-xs">✓</span>
              Static data for reliability
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 