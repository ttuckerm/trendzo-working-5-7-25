'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

interface AdminProtectionWrapperProps {
  children: ReactNode;
}

export default function AdminProtectionWrapper({ children }: AdminProtectionWrapperProps) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (user && isAdmin) {
      setIsAuthorized(true);
    } else if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
    } else {
      router.push('/access-denied');
    }
  }, [user, isAdmin, loading, router]);

  if (loading || !isAuthorized) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return <>{children}</>;
}
