// Create file: src/components/FeatureAccess.tsx

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface FeatureAccessProps {
  requiredTier: 'free' | 'premium' | 'platinum';
  featureKey?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const getTierValue = (tier: string): number => {
  switch (tier.toLowerCase()) {
    case 'platinum':
      return 3;
    case 'premium':
      return 2;
    case 'free':
    default:
      return 1;
  }
};

export const FeatureAccess: React.FC<FeatureAccessProps> = ({
  requiredTier,
  featureKey,
  fallback,
  children
}) => {
  const { subscriptionTier, permissions, isAdmin } = useAuth();
  
  // Admins can access all features
  if (isAdmin) {
    return <>{children}</>;
  }
  
  // Check specific feature permission if provided
  if (featureKey) {
    const hasPermission = permissions.some(
      p => p.permission_key === featureKey && p.permission_value === true
    );
    
    if (hasPermission) {
      return <>{children}</>;
    }
  }
  
  // Check tier-based access
  const userTierValue = getTierValue(subscriptionTier);
  const requiredTierValue = getTierValue(requiredTier);
  
  if (userTierValue >= requiredTierValue) {
    return <>{children}</>;
  }
  
  // Return fallback if provided, otherwise null
  return fallback ? <>{fallback}</> : null;
};