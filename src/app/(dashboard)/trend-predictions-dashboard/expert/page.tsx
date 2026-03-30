'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExpertDashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Navigate to the simple expert dashboard (that works!)
    router.push('/trend-predictions-dashboard/expert-simple');
  }, [router]);
  
  // Show a loading spinner while redirecting
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to the expert dashboard...</p>
      </div>
    </div>
  );
} 