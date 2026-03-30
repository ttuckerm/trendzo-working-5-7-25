'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AppIndexPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/dashboard-view');
  }, [router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
} 