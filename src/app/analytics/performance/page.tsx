"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Redirect from deprecated /analytics/performance to /dashboard-view/analytics/performance
 */
export default function PerformanceRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new page
    router.replace('/dashboard-view/analytics/performance');
  }, [router]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
      <h1 className="text-xl font-medium">Redirecting to Performance Analytics...</h1>
      <p className="text-gray-500 mt-2">Please wait while we redirect you to the new location.</p>
    </div>
  );
} 