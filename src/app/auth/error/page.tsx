'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Unknown error';

  // Redirect to login after 5 seconds
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.push('/login');
    }, 5000);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'CredentialsSignin':
        return 'Invalid login credentials. Please check your email and password.';
      case 'SessionRequired':
        return 'You need to be signed in to access this page.';
      case 'AccessDenied':
        return 'You do not have permission to access this resource.';
      case 'CallbackRouteError':
        return 'There was a problem with the authentication callback.';
      case 'OAuthCallback':
        return 'There was a problem with the OAuth provider callback.';
      default:
        return 'An authentication error occurred. Please try again.';
    }
  };

  const errorMessage = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
          <div className="p-3 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-500 text-center mb-6">{errorMessage}</p>
          
          <div className="space-y-4 w-full">
            <Link href="/login">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition duration-200">
                Return to Login
              </button>
            </Link>
            
            <Link href="/">
              <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded transition duration-200">
                Go to Homepage
              </button>
            </Link>
          </div>
          
          <p className="text-sm text-gray-400 mt-8">
            You will be redirected to the login page in 5 seconds.
          </p>
        </div>
      </div>
    </div>
  );
} 