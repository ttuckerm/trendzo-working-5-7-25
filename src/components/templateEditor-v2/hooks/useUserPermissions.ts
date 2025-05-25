import { useState, useEffect } from 'react';

export type UserTier = 'free' | 'premium' | 'platinum';

interface UserPermissions {
  userTier: UserTier;
  hasPermission: (feature: string) => boolean;
  maxElements: number;
  maxTemplates: number;
  allowedFeatures: string[];
}

// Premium features that require specific tier
const TIER_FEATURES = {
  free: ['basic_templates', 'basic_elements', 'limited_export'],
  premium: [
    'basic_templates', 'basic_elements', 'limited_export', 
    'premium_elements', 'unlimited_export', 'custom_elements', 
    'advanced_analytics'
  ],
  platinum: [
    'basic_templates', 'basic_elements', 'limited_export', 
    'premium_elements', 'unlimited_export', 'custom_elements', 
    'advanced_analytics', 'api_access', 'white_label', 
    'priority_support', 'ai_templates'
  ]
};

// Feature limits by tier
const TIER_LIMITS = {
  free: { maxElements: 20, maxTemplates: 3 },
  premium: { maxElements: 100, maxTemplates: 20 },
  platinum: { maxElements: Infinity, maxTemplates: Infinity }
};

export const useUserPermissions = (): UserPermissions => {
  // In a real app, this would be fetched from an API or context
  const [userTier, setUserTier] = useState<UserTier>('free');
  
  // Mock fetching user tier (would be from API in real app)
  useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => {
      // In production, get this from auth context or API
      const storedTier = localStorage.getItem('userTier') as UserTier;
      setUserTier(storedTier || 'free');
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Check if user has permission for a specific feature
  const hasPermission = (feature: string): boolean => {
    return TIER_FEATURES[userTier].includes(feature);
  };
  
  return {
    userTier,
    hasPermission,
    maxElements: TIER_LIMITS[userTier].maxElements,
    maxTemplates: TIER_LIMITS[userTier].maxTemplates,
    allowedFeatures: TIER_FEATURES[userTier]
  };
}; 