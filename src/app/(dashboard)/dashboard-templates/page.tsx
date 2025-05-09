'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingFallback from '@/components/ui/LoadingFallback';

export default function DashboardTemplatesPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the template library
    router.push('/dashboard-view/template-library');
  }, [router]);
  
  return (
    <LoadingFallback 
      loadingMessage="Redirecting to template library..." 
      fallbackMessage="Redirecting is taking longer than expected. Please wait."
    />
  );
} 