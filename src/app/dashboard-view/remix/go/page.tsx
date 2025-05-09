'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * This is a direct access page that redirects to the first template
 * It bypasses any potential middleware issues
 */
export default function GoToRemixPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Using a hardcoded templateId for demo purposes
    const redirect = () => {
      router.push('/dashboard-view/remix/template-1');
    };
    
    // Add a short delay to ensure router is ready
    const timer = setTimeout(redirect, 500);
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Loading template...</p>
      </div>
    </div>
  );
} 