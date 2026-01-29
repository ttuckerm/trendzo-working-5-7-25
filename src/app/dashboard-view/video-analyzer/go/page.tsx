'use client';

import { useState, useEffect } from 'react';
import { Loader2, Video } from 'lucide-react';

/**
 * This is a direct access page for video analyzer
 * It bypasses any potential middleware issues by rendering its own content
 */
export default function VideoAnalyzerDirectPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading Video Analyzer...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Video Analyzer Tool</h1>
      <p className="text-gray-600 mb-8">Analyze trending videos to understand their structure and engagement patterns.</p>
      
      <div className="bg-white border rounded-lg p-8 shadow-sm">
        <div className="flex items-center justify-center mb-6">
          <Video className="h-16 w-16 text-blue-500" />
        </div>
        <p className="text-center text-lg mb-4">Video Analyzer is available!</p>
        <p className="text-center text-gray-600 mb-6">
          This direct access page confirms that routing is working correctly.
        </p>
        <div className="flex justify-center">
          <a 
            href="/dashboard-view/video-analyzer" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
          >
            Go to Full Analyzer
          </a>
        </div>
      </div>
    </div>
  );
} 