'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Template Library Redirector Page
 * 
 * This page redirects users from /dashboard-view/template-library to the main template library page
 * This ensures compatibility with the menu links in the dashboard view
 */
export default function TemplateLibraryRedirectorPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Use router.push for navigation, with a small timeout to ensure components are fully loaded
    const redirectTimer = setTimeout(() => {
      router.push('/dashboard-view/template-library/view');
    }, 100);
    
    // Clean up timer
    return () => clearTimeout(redirectTimer);
  }, [router]);
  
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
        <p className="mt-4 text-lg font-medium text-gray-800">Loading Template Library</p>
        <p className="mt-2 text-sm text-gray-500">Please wait while we prepare your templates...</p>
      </div>
    </div>
  );
} 