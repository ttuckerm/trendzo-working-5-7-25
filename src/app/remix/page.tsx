'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * This page redirects from /remix to the remix page in the dashboard route group
 */
export default function RemixRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the remix page inside the dashboard route group
    router.replace('/dashboard-view/remix');
  }, [router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Redirecting to Remix Studio...</p>
      </div>
    </div>
  );
} 