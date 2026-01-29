'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Templates redirector page 
 * Redirects to the dashboard templates page
 */
export default function TemplatesRedirectorPage() {
  const router = useRouter();
  
  useEffect(() => {
    const redirect = () => {
      // Try multiple possible template URL paths in order
      // This helps us work with different potential layouts
      const templateUrls = [
        '/(dashboard)/templates',
        '/templates',
        '/template-library',
        '/dashboard-view/template-library'
      ];
      
      // Use the first one that exists or default to templates
      router.push(templateUrls[0]);
    };
    
    // Add a short delay to ensure router is ready
    const timer = setTimeout(redirect, 500);
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Loading templates...</p>
      </div>
    </div>
  );
} 