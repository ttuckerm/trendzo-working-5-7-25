import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

type FeatureFlags = {
  SOUND_ANALYSIS: boolean;
  EXPERT_INPUTS: boolean;
  PREMIUM_ANALYTICS: boolean;
  TEMPLATE_REMIX: boolean;
  TREND_PREDICTION: boolean;
  CONTENT_CALENDAR: boolean;
  CONVERSATIONAL_ADMIN: boolean;
};

const defaultFeatures: FeatureFlags = {
  SOUND_ANALYSIS: false,
  EXPERT_INPUTS: false,
  PREMIUM_ANALYTICS: false,
  TEMPLATE_REMIX: false,
  TREND_PREDICTION: false,
  CONTENT_CALENDAR: false,
  CONVERSATIONAL_ADMIN: false,
};

const FeatureContext = createContext<{
  features: FeatureFlags;
  isFeatureEnabled: (feature: keyof FeatureFlags) => boolean;
  subscription: string | null;
}>({
  features: defaultFeatures,
  isFeatureEnabled: () => false,
  subscription: null,
});

export const FeatureProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureFlags>(defaultFeatures);
  const [subscription, setSubscription] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user's subscription tier and available features
  useEffect(() => {
    const fetchFeatures = async () => {
      setLoading(true);
      
      try {
        let tier = 'free';
        
        // Get user subscription tier if logged in and auth is initialized
        if (auth && auth.currentUser) {
          // Check if db is initialized before accessing Firestore
          if (db) {
            try {
              const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                tier = userData?.subscriptionTier || 'free';
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
              // Continue with free tier on error
            }
          }
        }
        
        setSubscription(tier);
        
        // Get feature flags from configuration if db is initialized
        if (db) {
          try {
            const featureDoc = await getDoc(doc(db, 'configuration', 'featureFlags'));
            const featureData = featureDoc.exists() 
              ? featureDoc.data() as Record<string, boolean> 
              : {};
            
            // Apply tier-based access
            setFeatures({
              SOUND_ANALYSIS: true, // Base feature available to all
              EXPERT_INPUTS: true, // Base feature with tier-specific depth
              PREMIUM_ANALYTICS: ['premium', 'platinum', 'admin'].includes(tier),
              TEMPLATE_REMIX: ['premium', 'platinum', 'admin'].includes(tier),
              TREND_PREDICTION: ['platinum', 'admin'].includes(tier),
              CONTENT_CALENDAR: ['platinum', 'admin'].includes(tier),
              CONVERSATIONAL_ADMIN: ['admin'].includes(tier),
              // Override with dynamic flags from Firestore
              ...Object.keys(featureData).reduce((acc, key) => {
                if (key in defaultFeatures) {
                  acc[key as keyof FeatureFlags] = featureData[key];
                }
                return acc;
              }, {} as Partial<FeatureFlags>),
            });
          } catch (error) {
            console.error('Error fetching feature flags:', error);
            // Use default feature settings + tier based access
            setFeatures({
              SOUND_ANALYSIS: true,
              EXPERT_INPUTS: true,
              PREMIUM_ANALYTICS: ['premium', 'platinum', 'admin'].includes(tier),
              TEMPLATE_REMIX: ['premium', 'platinum', 'admin'].includes(tier),
              TREND_PREDICTION: ['platinum', 'admin'].includes(tier),
              CONTENT_CALENDAR: ['platinum', 'admin'].includes(tier),
              CONVERSATIONAL_ADMIN: ['admin'].includes(tier),
            });
          }
        } else {
          // If db is null, use default tier-based features
          setFeatures({
            SOUND_ANALYSIS: true,
            EXPERT_INPUTS: true,
            PREMIUM_ANALYTICS: ['premium', 'platinum', 'admin'].includes(tier),
            TEMPLATE_REMIX: ['premium', 'platinum', 'admin'].includes(tier),
            TREND_PREDICTION: ['platinum', 'admin'].includes(tier),
            CONTENT_CALENDAR: ['platinum', 'admin'].includes(tier),
            CONVERSATIONAL_ADMIN: ['admin'].includes(tier),
          });
        }
      } catch (error) {
        console.error('Error in fetchFeatures:', error);
        // Use default flags on error
        setFeatures(defaultFeatures);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeatures();
    
    // Listen for auth state changes if auth is initialized
    const unsubscribe = auth ? 
      auth.onAuthStateChanged(() => {
        fetchFeatures();
      }) : 
      () => {}; // No-op if auth is null
    
    return () => unsubscribe();
  }, []);
  
  const isFeatureEnabled = (feature: keyof FeatureFlags) => features[feature];
  
  // Show a loading state or return provider with features
  if (loading) {
    return <>{children}</>;  // Pass through children during loading
  }
  
  return (
    <FeatureContext.Provider value={{ features, isFeatureEnabled, subscription }}>
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeatures = () => useContext(FeatureContext);

// Custom hook for quick feature checks
export const useFeatureEnabled = (feature: keyof FeatureFlags) => {
  const { isFeatureEnabled } = useFeatures();
  return isFeatureEnabled(feature);
}; 