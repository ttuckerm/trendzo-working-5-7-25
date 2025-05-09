"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function AdminProtectionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, authError } = useAuth();
  const router = useRouter();
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const [bypassAuth, setBypassAuth] = useState(false);
  const authCheckComplete = useRef(false);

  // Check if auth should be disabled
  const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';
  const isDev = process.env.NODE_ENV === 'development';
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const [debugInfo, setDebugInfo] = useState({
    loading: true,
    userExists: false,
    userEmail: '',
    adminEmail: adminEmail || 'not set',
    isDev,
    disableAuth,
    authError: null
  });

  // Add timeout to prevent infinite loading
  useEffect(() => {
    if (disableAuth) {
      return; // Don't show loading if auth is disabled
    }

    const timeout = setTimeout(() => {
      if (loading) {
        setLoadingTooLong(true);
        console.log('Auth loading is taking too long, showing debug info');
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [loading, disableAuth]);

  // Check if user is admin
  useEffect(() => {
    // If auth is disabled, skip the check
    if (disableAuth) {
      console.log('Authentication disabled by environment variable - allowing access');
      return;
    }

    // Only run this check once per mount
    if (authCheckComplete.current && !loading) {
      return;
    }

    // Update debug info only when values change
    setDebugInfo({
      loading,
      userExists: !!user,
      userEmail: user?.email || 'no email',
      adminEmail: adminEmail || 'not set',
      isDev,
      disableAuth,
      authError: authError ? String(authError.message) : null
    });

    // Only check auth if not bypassing and loading is complete
    if (!bypassAuth && !loading) {
      authCheckComplete.current = true;
      
      // In development, allow access without admin check if no admin email is set
      if (isDev && !adminEmail) {
        console.log('Development mode with no admin email set - allowing access');
        return;
      }

      // Check if user is admin
      const isAdmin = user && adminEmail && user.email === adminEmail;
      
      if (!isAdmin && !isDev) {
        console.log('Not admin, redirecting to home page');
        router.push('/');
      }
    }
  }, [user, loading, adminEmail, isDev, router, bypassAuth, authError, disableAuth]);

  // If auth is disabled, return children immediately
  if (disableAuth) {
    return <>{children}</>;
  }

  // Show debug info if loading takes too long or there's an auth error
  if (loadingTooLong || authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h1 className="text-xl font-bold mb-4">
            {authError ? 'Authentication Error' : 'Loading taking longer than expected'}
          </h1>
          <div className="text-sm mb-4">
            {authError ? (
              <p className="text-red-500 font-medium">{authError.message}</p>
            ) : (
              <p className="text-red-500 font-medium">Authentication is taking a long time to complete.</p>
            )}
            <p className="mt-2">Debug information:</p>
            <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/')}
              className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Go Home
            </button>
            {isDev && (
              <button
                onClick={() => {
                  setBypassAuth(true);
                  setLoadingTooLong(false);
                }}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Continue Anyway (Dev Mode)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show loading spinner while checking auth (unless bypassing)
  if (loading && !bypassAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If bypassing auth or in dev mode, show the children
  if (bypassAuth || isDev) {
    return <>{children}</>;
  }

  // If user is admin, show the children
  if (user && adminEmail && user.email === adminEmail) {
    return <>{children}</>;
  }

  // Otherwise return null (redirect will happen from the useEffect)
  return null;
} 