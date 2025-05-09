'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * This page redirects users from /dashboard to /dashboard-view
 * to consolidate all dashboard functionality in one place
 */
export default function DashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the main dashboard view
    router.replace('/dashboard-view');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">Redirecting to dashboard...</p>
    </div>
  );
} 