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
  
  // More explicitly check for testing mode using both env variables
  const isTestingMode = 
    process.env.NEXT_PUBLIC_TESTING_MODE === 'true' || 
    process.env.TESTING_MODE === 'true' || 
    typeof window !== 'undefined' && window.localStorage.getItem('TESTING_MODE') === 'true';
  
  useEffect(() => {
    // Set testing mode in localStorage for persistence
    if (isTestingMode && typeof window !== 'undefined') {
      window.localStorage.setItem('TESTING_MODE', 'true');
      console.log('Testing mode enabled, bypassing admin check');
      setIsAuthorized(true);
      return;
    }
    
    // Wait for auth state to load
    if (loading) return;
    
    // Check if user is admin
    if (user && isAdmin) {
      setIsAuthorized(true);
    } else if (!isTestingMode) {
      // Redirect to access denied page only if not in testing mode
      router.push('/access-denied');
    }
  }, [user, isAdmin, loading, router, isTestingMode]);

  // Add a direct bypass for static HTML testing
  useEffect(() => {
    if (isTestingMode && typeof window !== 'undefined') {
      // If in testing mode and on an admin page, redirect to the static dashboard
      const isAdminDashboardPage = 
        window.location.pathname.includes('/admin/etl-dashboard') ||
        window.location.pathname.includes('/admin/etl-status') ||
        window.location.pathname === '/admin';
        
      if (isAdminDashboardPage) {
        console.log('🧪 TESTING MODE: Redirecting to static dashboard HTML');
        window.location.href = '/admin-dashboard.html';
      }
    }
  }, [isTestingMode]);

  // Show loading spinner while checking authorization
  if (!isTestingMode && (loading || !isAuthorized)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Render children once authorized
  return <>{children}</>;
} 