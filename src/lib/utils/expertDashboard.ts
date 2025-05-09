/**
 * @deprecated This file is deprecated - use expertUtils.ts directly instead
 * This file is maintained only for backward compatibility
 */

import { 
  calculateSimilarityScore,
  calculateAccuracy,
  groupPredictionsBySimilarity,
  calculateAccuracyImprovements,
  calculateExpertStats,
  getRecentExpertActivity,
  isValidPrediction,
  updateConfidenceScores
} from './expertUtils';

// Log a warning when this file is imported
if (typeof window !== 'undefined') {
  console.warn(
    '%c IMPORTANT: expertDashboard.ts is deprecated %c',
    'background: #ff6b6b; color: white; padding: 2px 4px; border-radius: 2px;',
    ''
  );
  console.warn(
    'Import directly from expertUtils.ts instead. ' +
    'This file will be removed in a future version. ' +
    'All functionality has moved to expertUtils.ts with the same function names.'
  );
}

// Re-export everything from expertUtils
export {
  calculateSimilarityScore,
  calculateAccuracy,
  groupPredictionsBySimilarity,
  calculateAccuracyImprovements,
  calculateExpertStats,
  getRecentExpertActivity,
  isValidPrediction,
  updateConfidenceScores
}; 