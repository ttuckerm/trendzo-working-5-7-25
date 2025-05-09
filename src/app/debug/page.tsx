"use client";

import { useFeatures } from '@/lib/contexts/FeatureContext';
import { auth, db } from '@/lib/firebase/firebase';
import FeatureDebug from '@/components/FeatureDebug';

export default function DebugPage() {
  const { features, subscription } = useFeatures();
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Feature Flags Debug</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Firebase Initialization Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Authentication</h3>
            <div className={`text-lg ${auth ? 'text-green-600' : 'text-red-600'}`}>
              {auth ? 'Initialized ✓' : 'Not initialized ✗'}
            </div>
            <div className="mt-2 text-sm text-gray-500">
              User: {auth?.currentUser?.email || 'Not signed in'}
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Firestore Database</h3>
            <div className={`text-lg ${db ? 'text-green-600' : 'text-red-600'}`}>
              {db ? 'Initialized ✓' : 'Not initialized ✗'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">User Subscription</h2>
        <div className="text-lg font-medium">
          Current tier: <span className="text-blue-600">{subscription || 'free'}</span>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Feature Flags</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(features).map(([feature, enabled]) => (
            <div key={feature} className="border rounded-lg p-4">
              <h3 className="font-medium">{feature}</h3>
              <div className={`mt-2 text-lg ${enabled ? 'text-green-600' : 'text-red-600'}`}>
                {enabled ? 'Enabled ✓' : 'Disabled ✗'}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* This component will appear on all pages when imported */}
      <FeatureDebug />
    </div>
  );
} 