'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AccessDeniedPage() {
  const [isTestingMode, setIsTestingMode] = useState(false);
  
  useEffect(() => {
    // Check testing mode from both env and localStorage
    const testingMode = 
      process.env.NEXT_PUBLIC_TESTING_MODE === 'true' || 
      process.env.TESTING_MODE === 'true' ||
      window.localStorage.getItem('TESTING_MODE') === 'true';
      
    setIsTestingMode(testingMode);
  }, []);
  
  const enableTestingMode = () => {
    window.localStorage.setItem('TESTING_MODE', 'true');
    setIsTestingMode(true);
    
    // Redirect to admin dashboard after enabling testing mode
    setTimeout(() => {
      window.location.href = '/admin-dashboard.html';
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <svg 
          className="w-16 h-16 mx-auto mb-4 text-red-500" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-10v4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        
        <h1 className="mb-4 text-2xl font-bold text-center text-gray-800">Access Denied</h1>
        
        <p className="mb-6 text-center text-gray-600">
          You don't have permission to access this page. Please log in with an admin account.
        </p>
        
        <div className="flex flex-col space-y-3">
          <Link 
            href="/login" 
            className="inline-flex justify-center px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Login
          </Link>
          
          <Link 
            href="/" 
            className="inline-flex justify-center px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Return to Homepage
          </Link>
          
          <button 
            onClick={enableTestingMode}
            className={`inline-flex justify-center px-4 py-2 mt-6 rounded ${
              isTestingMode 
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
            disabled={isTestingMode}
          >
            {isTestingMode ? 'Testing Mode Enabled ✅' : 'Enable Testing Mode'}
          </button>
          
          <div className="text-center text-sm text-gray-500 mt-4">
            <p>Testing Mode: {isTestingMode ? 'Enabled' : 'Disabled'}</p>
            <p>To permanently enable testing mode, add NEXT_PUBLIC_TESTING_MODE=true to your .env.local file</p>
            {isTestingMode && (
              <p className="mt-2 text-green-600">Redirecting to dashboard...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 