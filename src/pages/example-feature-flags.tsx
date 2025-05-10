// src/pages/example-feature-flags.tsx
import React from 'react';
import { FeatureFlagged } from '@/components/FeatureFlagged';
import { featureFlags } from '@/lib/utils/featureFlags';

const ExampleFeatureFlags: React.FC = () => {
  const maxPrompts = featureFlags.getMaxDailyPrompts();
  const isMaintenanceMode = featureFlags.isMaintenanceMode();
  
  if (isMaintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="p-8 bg-yellow-100 text-yellow-800 rounded-lg">
          <h1 className="text-2xl font-bold mb-4">Maintenance Mode</h1>
          <p>The site is currently under maintenance. Please check back later.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Feature Flags Example</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Daily Prompts Limit</h2>
        <p>You have {maxPrompts} prompts available today.</p>
      </div>
      
      <FeatureFlagged flag="show_new_feature">
        <div className="p-4 bg-blue-100 text-blue-800 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">New Feature!</h2>
          <p>This is our brand new feature that's controlled by a feature flag!</p>
        </div>
      </FeatureFlagged>
      
      <FeatureFlagged 
        flag="show_new_feature"
        fallback={
          <div className="p-4 bg-gray-100 text-gray-800 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
            <p>New feature is coming soon!</p>
          </div>
        }
      >
        <div className="p-4 bg-green-100 text-green-800 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">Feature Available!</h2>
          <p>The new feature is now available to you.</p>
        </div>
      </FeatureFlagged>
    </div>
  );
};

export default ExampleFeatureFlags;