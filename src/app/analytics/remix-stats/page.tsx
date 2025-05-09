'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Redirect Page for Remix Analytics
 * 
 * This page redirects users from /analytics/remix-stats to the integrated page in the dashboard
 */
export default function RemixAnalyticsRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the dashboard version
    const redirect = () => {
      router.push('/dashboard-view/analytics/remix-stats');
    };
    
    // Add a slight delay to ensure smooth transition
    const timer = setTimeout(redirect, 500);
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
        <p className="mt-4 text-lg font-medium text-gray-800">Redirecting to dashboard...</p>
        <p className="mt-2 text-sm text-gray-500">Please wait while we redirect you to the Remix Analytics dashboard.</p>
      </div>
    </div>
  );
} 