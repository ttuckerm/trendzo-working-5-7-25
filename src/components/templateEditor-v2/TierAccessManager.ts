/**
 * TierAccessManager - Handles feature access control based on user subscription tier
 * Implements Feature #5 (Progressive Skill Unlocks)
 */

export type UserTier = 'free' | 'premium' | 'platinum';

// Features by category
const TEXT_FEATURES = [
  { id: 'basicTextEdit', name: 'Basic Text Editing', tier: 'free' },
  { id: 'advancedFonts', name: 'Advanced Font Selection', tier: 'premium' },
  { id: 'customFonts', name: 'Custom Fonts', tier: 'premium' },
  { id: 'textEffects', name: 'Text Effects', tier: 'premium' },
];

const ANIMATION_FEATURES = [
  { id: 'basicAnimations', name: 'Basic Animations', tier: 'free' },
  { id: 'advancedAnimations', name: 'Advanced Animations', tier: 'premium' },
  { id: 'beatSyncedAnimations', name: 'Beat-Synced Animations', tier: 'premium' },
  { id: 'aiKineticText', name: 'AI Kinetic Text', tier: 'platinum' },
  { id: 'customKeyframes', name: 'Custom Keyframes', tier: 'platinum' },
];

const STYLE_FEATURES = [
  { id: 'basicStyles', name: 'Basic Styles', tier: 'free' },
  { id: 'advancedColors', name: 'Advanced Color Tools', tier: 'premium' },
  { id: 'gradients', name: 'Gradients', tier: 'premium' },
  { id: 'filters', name: 'Filters', tier: 'premium' },
  { id: 'aiStyleSuggestions', name: 'AI Style Suggestions', tier: 'platinum' },
];

const EXPORT_FEATURES = [
  { id: 'basicExport', name: 'Basic Export', tier: 'free' },
  { id: 'highQualityExport', name: 'High Quality Export', tier: 'premium' },
  { id: 'multiFormatExport', name: 'Multi-Format Export', tier: 'premium' },
  { id: 'scheduledPublishing', name: 'Scheduled Publishing', tier: 'platinum' },
];

// All features in a flat array
const ALL_FEATURES = [
  ...TEXT_FEATURES,
  ...ANIMATION_FEATURES,
  ...STYLE_FEATURES,
  ...EXPORT_FEATURES,
];

// Tier levels for comparison
const TIER_LEVELS = {
  free: 0,
  premium: 1,
  platinum: 2,
};

export class TierAccessManager {
  /**
   * Check if a feature is available for a given user tier
   */
  static isFeatureAvailable(feature: string, userTier: UserTier): boolean {
    const featureInfo = ALL_FEATURES.find(f => f.id === feature);
    if (!featureInfo) {
      console.warn(`Feature "${feature}" not found in feature registry`);
      return false;
    }
    
    const featureTierLevel = TIER_LEVELS[featureInfo.tier as UserTier];
    const userTierLevel = TIER_LEVELS[userTier];
    
    return userTierLevel >= featureTierLevel;
  }
  
  /**
   * Get all features available for a given user tier
   */
  static getAvailableFeatures(userTier: UserTier): typeof ALL_FEATURES {
    const userTierLevel = TIER_LEVELS[userTier];
    
    return ALL_FEATURES.filter(feature => {
      const featureTierLevel = TIER_LEVELS[feature.tier as UserTier];
      return userTierLevel >= featureTierLevel;
    });
  }
  
  /**
   * Get features from a specific category available for a given user tier
   */
  static getAvailableFeaturesInCategory(category: 'text' | 'animation' | 'style' | 'export', userTier: UserTier) {
    const categoryFeatures = {
      text: TEXT_FEATURES,
      animation: ANIMATION_FEATURES,
      style: STYLE_FEATURES,
      export: EXPORT_FEATURES,
    };
    
    const userTierLevel = TIER_LEVELS[userTier];
    
    return categoryFeatures[category].filter(feature => {
      const featureTierLevel = TIER_LEVELS[feature.tier as UserTier];
      return userTierLevel >= featureTierLevel;
    });
  }
  
  /**
   * Get features that would be unlocked by upgrading to a higher tier
   */
  static getUpgradeFeatures(userTier: UserTier, targetTier: UserTier): typeof ALL_FEATURES {
    if (TIER_LEVELS[userTier] >= TIER_LEVELS[targetTier]) {
      return []; // Already at or above target tier
    }
    
    const userTierLevel = TIER_LEVELS[userTier];
    const targetTierLevel = TIER_LEVELS[targetTier];
    
    return ALL_FEATURES.filter(feature => {
      const featureTierLevel = TIER_LEVELS[feature.tier as UserTier];
      return featureTierLevel > userTierLevel && featureTierLevel <= targetTierLevel;
    });
  }
  
  /**
   * Get feature information by ID
   */
  static getFeatureInfo(featureId: string) {
    return ALL_FEATURES.find(f => f.id === featureId);
  }
  
  /**
   * Get recommended next features based on user skill level
   */
  static getRecommendedFeatures(userTier: UserTier, userSkillLevel: 'beginner' | 'intermediate' | 'advanced'): typeof ALL_FEATURES {
    const availableFeatures = this.getAvailableFeatures(userTier);
    
    if (userSkillLevel === 'beginner') {
      // Recommend basic features for beginners
      return availableFeatures.filter(f => f.id.includes('basic'));
    } else if (userSkillLevel === 'intermediate') {
      // Recommend more advanced features for intermediate users
      return availableFeatures.filter(f => 
        !f.id.includes('basic') && 
        !f.id.includes('ai') && 
        f.tier !== 'platinum'
      );
    } else {
      // Advanced users get the most complex features
      return availableFeatures.filter(f => 
        f.id.includes('advanced') || 
        f.id.includes('ai') || 
        f.tier === 'platinum'
      );
    }
  }
} 