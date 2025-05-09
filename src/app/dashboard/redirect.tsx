'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * This component provides an option to redirect to the main dashboard view
 * It ensures users are using the consolidated dashboard implementation
 */
export default function DashboardRedirectOption() {
  const router = useRouter();
  
  const goToMainDashboard = () => {
    router.push('/dashboard-view');
  };
  
  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-md mb-6">
      <h2 className="text-xl font-bold text-blue-800 mb-2">Dashboard Has Moved</h2>
      <p className="text-blue-700 mb-4">
        We've consolidated our dashboard functionality into a single, improved dashboard view
        with better performance and features.
      </p>
      <button
        onClick={goToMainDashboard}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Go to Main Dashboard
      </button>
    </div>
  );
} 