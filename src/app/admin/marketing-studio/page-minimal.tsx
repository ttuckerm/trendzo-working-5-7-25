'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function MarketingStudioMinimalPage() {
  const [test, setTest] = useState('working');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="h-6 w-6 text-purple-500" />
          <h1 className="text-2xl font-bold">Marketing Studio - Minimal Test</h1>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <p>Status: {test}</p>
          <button 
            onClick={() => setTest('clicked!')} 
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Test Button
          </button>
        </div>
        
        <div className="mt-6 text-sm text-gray-600">
          <p>If you can see this and the button works, the basic page structure is functional.</p>
          <p>The issue is likely with complex component imports or external service dependencies.</p>
        </div>
      </div>
    </div>
  );
}