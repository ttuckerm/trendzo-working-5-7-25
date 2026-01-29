// src/components/FeatureFlagged.tsx
import React from 'react';
import { featureFlags, FeatureFlag } from '@/lib/utils/featureFlags';

interface FeatureFlaggedProps {
  flag: FeatureFlag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureFlagged: React.FC<FeatureFlaggedProps> = ({ 
  flag, 
  children, 
  fallback = null 
}) => {
  const isEnabled = featureFlags.getBoolean(flag);
  
  return isEnabled ? <>{children}</> : <>{fallback}</>;
};

// HOC version
export function withFeatureFlag(
  WrappedComponent: React.ComponentType<any>,
  flag: FeatureFlag,
  FallbackComponent?: React.ComponentType<any>
) {
  return (props: any) => {
    const isEnabled = featureFlags.getBoolean(flag);
    
    if (isEnabled) {
      return <WrappedComponent {...props} />;
    }
    
    return FallbackComponent ? <FallbackComponent {...props} /> : null;
  };
}