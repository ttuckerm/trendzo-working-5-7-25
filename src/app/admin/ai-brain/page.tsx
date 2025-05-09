"use client";

import { useEffect } from 'react';
import AiBrainInterface from '@/components/admin/AiBrainInterface';

export default function AiBrainPage() {
  // Set page title
  useEffect(() => {
    document.title = 'AI Brain Interface | Admin';
  }, []);

  return (
    <div className="h-[calc(100vh-10rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Brain Interface</h1>
        <p className="text-gray-600 mt-1">
          Interact with the system intelligence to update frameworks and strategies
        </p>
      </div>
      
      <div className="h-full">
        <AiBrainInterface />
      </div>
    </div>
  );
} 