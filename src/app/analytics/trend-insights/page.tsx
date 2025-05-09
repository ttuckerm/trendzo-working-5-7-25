'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * This page redirects users from /analytics/trend-insights to the analytics section in dashboard-view
 * to ensure all functionality is properly integrated
 */
export default function TrendInsightsRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the main dashboard analytics
    router.replace('/dashboard-view/analytics/trend-insights');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">Redirecting to analytics dashboard...</p>
    </div>
  );
} 