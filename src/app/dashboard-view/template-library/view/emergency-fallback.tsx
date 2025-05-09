'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LayoutGrid, Home } from 'lucide-react';

// Ultra-simple emergency fallback for template library page
// No complex state or context dependencies that could cause render loops
export default function TemplateLibraryEmergencyFallback() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Template Library</h1>
          <p className="text-gray-500">Browse TikTok templates</p>
        </div>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
        <div className="flex items-start">
          <div className="mr-4 mt-1">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-amber-800 mb-2">Template Library Temporarily Limited</h2>
            <p className="text-amber-700 mb-4">
              We're currently fixing some technical issues with the template library. 
              Some features may be temporarily unavailable.
            </p>
            <div className="flex space-x-4">
              <Link href="/dashboard-view" passHref>
                <Button variant="outline" className="flex items-center">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Static template previews to show something useful */}
      <h2 className="text-xl font-semibold mb-4">Popular Templates</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Template 1 */}
        <div className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-gray-100 aspect-video flex items-center justify-center">
            <span className="text-gray-400">Template Preview</span>
          </div>
          <div className="p-4">
            <h3 className="font-medium">Trending Dance Template</h3>
            <p className="text-sm text-gray-500 mb-2">30s • 125K views</p>
            <div className="flex justify-between items-center">
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">Dance</span>
            </div>
          </div>
        </div>
        
        {/* Template 2 */}
        <div className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-gray-100 aspect-video flex items-center justify-center">
            <span className="text-gray-400">Template Preview</span>
          </div>
          <div className="p-4">
            <h3 className="font-medium">Product Review Template</h3>
            <p className="text-sm text-gray-500 mb-2">45s • 98K views</p>
            <div className="flex justify-between items-center">
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Review</span>
            </div>
          </div>
        </div>
        
        {/* Template 3 */}
        <div className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
          <div className="bg-gray-100 aspect-video flex items-center justify-center">
            <span className="text-gray-400">Template Preview</span>
          </div>
          <div className="p-4">
            <h3 className="font-medium">Comedy Skit Template</h3>
            <p className="text-sm text-gray-500 mb-2">20s • 210K views</p>
            <div className="flex justify-between items-center">
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">Comedy</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Full template library functionality will be restored soon.</p>
      </div>
    </div>
  );
} 