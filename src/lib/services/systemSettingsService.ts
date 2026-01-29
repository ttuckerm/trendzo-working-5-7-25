// import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase/firebase'; // Firebase db is null

// Analyzer settings types
export interface FeatureSpecificWeights {
  caption: number;
  audio: number;
  visualStyle: number;
  length: number;
  hashtags: number;
}

export interface AnalyzerSettings {
  confidenceThreshold: number;
  engagementWeight: number;
  growthRateWeight: number;
  userFeedbackWeight: number;
  minimumDataPoints: number;
  featureSpecificWeights: FeatureSpecificWeights;
  refreshInterval: number;
  enableExpertOverride: boolean;
}

export const DEFAULT_ANALYZER_SETTINGS: AnalyzerSettings = {
  confidenceThreshold: 0.7,
  engagementWeight: 0.5,
  growthRateWeight: 0.3,
  userFeedbackWeight: 0.2,
  minimumDataPoints: 100,
  featureSpecificWeights: {
    caption: 0.2,
    audio: 0.3,
    visualStyle: 0.3,
    length: 0.1,
    hashtags: 0.1
  },
  refreshInterval: 24,
  enableExpertOverride: true
};

const SERVICE_DISABLED_MSG_PREFIX = "systemSettingsService: Firebase backend is removed.";

/**
 * Retrieves the analyzer settings from Firestore.
 * If settings don't exist, initializes them with default values.
 * If Firebase is not available, returns default settings.
 */
export async function getAnalyzerSettings(): Promise<AnalyzerSettings> {
  try {
    // Check if Firebase is available
    if (true) { // Simulate !db condition permanently for migration
      console.warn(`${SERVICE_DISABLED_MSG_PREFIX} getAnalyzerSettings: Firebase not initialized or explicitly disabled for migration. Using default settings.`);
      return DEFAULT_ANALYZER_SETTINGS;
    }
    
    // // Original Firebase logic (will not be reached due to the above)
    // const settingsDoc = await getDoc(doc(db, 'system', 'analyzerSettings'));
    
    // if (!settingsDoc.exists()) {
    //   // Initialize default settings if they don't exist
    //   try {
    //     await setDoc(doc(db, 'system', 'analyzerSettings'), DEFAULT_ANALYZER_SETTINGS);
    //   } catch (initError) {
    //     console.error('Error initializing settings during get (should not happen if db is null):', initError);
    //     // Continue with default settings even if initialization fails
    //   }
    //   return DEFAULT_ANALYZER_SETTINGS;
    // }
    
    // return settingsDoc.data() as AnalyzerSettings;
  } catch (error) {
    console.error(`${SERVICE_DISABLED_MSG_PREFIX} Error fetching analyzer settings (should not happen if db is null):`, error);
    return DEFAULT_ANALYZER_SETTINGS;
  }
}

/**
 * Updates the analyzer settings in Firestore.
 * @param settings The updated settings to save
 * @returns Boolean indicating success or failure
 */
export async function updateAnalyzerSettings(settings: AnalyzerSettings): Promise<boolean> {
  try {
    // Check if Firebase is available
    if (true) { // Simulate !db condition permanently for migration
      console.warn(`${SERVICE_DISABLED_MSG_PREFIX} updateAnalyzerSettings: Firebase not initialized or explicitly disabled for migration. Cannot save settings. Provided settings:`, settings);
      return false;
    }
    
    // // Original Firebase logic (will not be reached due to the above)
    // await updateDoc(doc(db, 'system', 'analyzerSettings'), settings);
    // return true;
  } catch (error) {
    console.error(`${SERVICE_DISABLED_MSG_PREFIX} Error updating analyzer settings (should not happen if db is null):`, error);
    return false;
  }
}

/**
 * Validates that settings contain all required fields and values are within acceptable ranges
 * @param settings The settings object to validate
 * @returns An object with validation result and any error messages
 */
export function validateAnalyzerSettings(settings: AnalyzerSettings): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for required fields
  if (settings.confidenceThreshold === undefined || settings.confidenceThreshold === null) {
    errors.push('Confidence threshold is required');
  } else if (settings.confidenceThreshold < 0.1 || settings.confidenceThreshold > 0.9) {
    errors.push('Confidence threshold must be between 0.1 and 0.9');
  }
  
  // Check weight constraints
  const checkWeight = (name: string, value: number) => {
    if (value === undefined || value === null) {
      errors.push(`${name} is required`);
    } else if (value < 0 || value > 1) {
      errors.push(`${name} must be between 0 and 1`);
    }
  };
  
  checkWeight('Engagement weight', settings.engagementWeight);
  checkWeight('Growth rate weight', settings.growthRateWeight);
  checkWeight('User feedback weight', settings.userFeedbackWeight);
  
  // Check that weights sum to 1 (with a small margin for floating point errors)
  const totalWeight = settings.engagementWeight + settings.growthRateWeight + settings.userFeedbackWeight;
  if (Math.abs(totalWeight - 1) > 0.01) {
    errors.push(`Weight factors should sum to 1, current sum: ${totalWeight.toFixed(2)}`);
  }
  
  // Check feature specific weights
  if (!settings.featureSpecificWeights) {
    errors.push('Feature specific weights are required');
  } else {
    const features = ['caption', 'audio', 'visualStyle', 'length', 'hashtags'];
    for (const feature of features) {
      if (settings.featureSpecificWeights[feature as keyof FeatureSpecificWeights] === undefined) {
        errors.push(`Feature weight for ${feature} is required`);
      } else {
        checkWeight(`${feature} weight`, settings.featureSpecificWeights[feature as keyof FeatureSpecificWeights]);
      }
    }
    
    // Check that feature weights sum to 1
    const totalFeatureWeight = Object.values(settings.featureSpecificWeights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(totalFeatureWeight - 1) > 0.01) {
      errors.push(`Feature specific weights should sum to 1, current sum: ${totalFeatureWeight.toFixed(2)}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
} 