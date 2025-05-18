"use client"

// This file serves as a redirect to the proper dashboard-integrated sound trends page

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SoundTrendsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the dashboard-integrated version
    router.push('/dashboard-view/sound-trends');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
        <p className="text-gray-600">Taking you to the Sound Trends dashboard</p>
      </div>
    </div>
  );
} 