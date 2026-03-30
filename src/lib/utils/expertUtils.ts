import { Prediction, ExpertAdjustment, ConfidenceUpdate, PredictionMetadata } from '../types/prediction';
import { PredictionGroup, AccuracyImprovement, ExpertActivity, ExpertStats } from '../types/expertDashboard';

/**
 * Safely access a prediction property with a fallback value
 */
const safeGet = <T>(obj: any, path: string, fallback: T): T => {
  try {
    const parts = path.split('.');
    let result = obj;
    for (const part of parts) {
      if (result === null || result === undefined) return fallback;
      result = result[part];
    }
    return result === null || result === undefined ? fallback : result as T;
  } catch (e) {
    console.error(`Error accessing ${path}:`, e);
    return fallback;
  }
};

/**
 * Check if a prediction object has all required fields
 */
export const isValidPrediction = (prediction: any): prediction is Prediction => {
  return (
    prediction &&
    typeof prediction.id === 'string' &&
    typeof prediction.category === 'string' &&
    typeof prediction.confidence === 'number' &&
    typeof prediction.trend === 'string' &&
    typeof prediction.predictedValue === 'number' &&
    typeof prediction.metadata === 'object'
  );
};

/**
 * Calculate similarity score between two predictions
 */
export const calculateSimilarityScore = (prediction1: Prediction, prediction2: Prediction): number => {
  if (!isValidPrediction(prediction1) || !isValidPrediction(prediction2)) {
    console.warn('Invalid prediction objects passed to calculateSimilarityScore');
    return 0;
  }

  try {
    const categoryMatch = prediction1.category === prediction2.category ? 0.4 : 0;
    const confidenceDiff = Math.abs(safeGet(prediction1, 'confidence', 0) - safeGet(prediction2, 'confidence', 0));
    const confidenceScore = (1 - confidenceDiff) * 0.3;
    const trendMatch = prediction1.trend === prediction2.trend ? 0.3 : 0;
    
    return categoryMatch + confidenceScore + trendMatch;
  } catch (error) {
    console.error('Error calculating similarity score:', error);
    return 0;
  }
};

/**
 * Group predictions by similarity
 */
export const groupPredictionsBySimilarity = (predictions: Prediction[], similarityThreshold: number = 0.7): PredictionGroup[] => {
  if (!Array.isArray(predictions) || predictions.length === 0) {
    console.warn('Empty or invalid predictions array passed to groupPredictionsBySimilarity');
    return [];
  }

  // Ensure similarity threshold is within valid range
  const validThreshold = Math.max(0, Math.min(1, similarityThreshold));
  if (validThreshold !== similarityThreshold) {
    console.warn(`Invalid similarity threshold (${similarityThreshold}) adjusted to ${validThreshold}`);
  }

  try {
    console.log(`Grouping ${predictions.length} predictions with threshold ${validThreshold}`);
    
    const groups: PredictionGroup[] = [];
    const processed = new Set<string>();

    // First, filter only valid predictions to work with
    const validPredictions = predictions.filter(isValidPrediction);
    if (validPredictions.length !== predictions.length) {
      console.warn(`${predictions.length - validPredictions.length} invalid predictions filtered out`);
    }

    if (validPredictions.length === 0) {
      console.warn('No valid predictions to group');
      return [];
    }

    validPredictions.forEach(pred1 => {
      if (processed.has(pred1.id)) return;

      const similarPredictions = validPredictions.filter(pred2 => {
        if (pred1.id === pred2.id || processed.has(pred2.id)) return false;
        
        // Calculate similarity and check against threshold
        const similarity = calculateSimilarityScore(pred1, pred2);
        const isSimilar = similarity >= validThreshold;
        
        // Debug information for similarity matches
        if (isSimilar) {
          console.log(`Found similar prediction: ${pred1.id} and ${pred2.id} with score ${similarity.toFixed(2)}`);
        }
        
        return isSimilar;
      });

      // Create a group if we have similar predictions or the prediction isn't processed yet
      if (similarPredictions.length > 0 || !processed.has(pred1.id)) {
        const groupPredictions = [pred1, ...similarPredictions];
        
        // Calculate average confidence safely
        const avgConfidence = groupPredictions.reduce((sum, p) => sum + safeGet(p, 'confidence', 0), 0) 
                              / Math.max(1, groupPredictions.length);
        
        // Calculate group similarity scores
        const groupSimilarityScores = groupPredictions.map((p1, i) => 
          groupPredictions.slice(i + 1).map(p2 => calculateSimilarityScore(p1, p2))
        ).flat();
        
        const avgSimilarity = groupSimilarityScores.length > 0
          ? groupSimilarityScores.reduce((sum, score) => sum + score, 0) / Math.max(1, groupSimilarityScores.length)
          : 1;

        // Create and add the group
        const newGroup = {
          id: pred1.id,
          predictions: groupPredictions,
          similarityScore: avgSimilarity,
          averageConfidence: avgConfidence
        };
        
        groups.push(newGroup);
        console.log(`Created group ${newGroup.id} with ${newGroup.predictions.length} predictions and avg similarity ${avgSimilarity.toFixed(2)}`);

        // Mark all predictions in this group as processed
        groupPredictions.forEach(p => processed.add(p.id));
      }
    });

    console.log(`Grouped into ${groups.length} prediction groups`);
    return groups;
  } catch (error) {
    console.error('Error grouping predictions by similarity:', error);
    return [];
  }
};

/**
 * Calculate accuracy for a group of predictions
 */
export const calculateAccuracy = (predictions: Prediction[], type: 'original' | 'adjusted' = 'original'): number => {
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return 0;
  }
  
  try {
    const validPredictions = predictions.filter(isValidPrediction);
    if (validPredictions.length === 0) return 0;

    const correctPredictions = validPredictions.filter((prediction) => {
      if (type === 'adjusted' && prediction.expertAdjustment) {
        return safeGet(prediction.expertAdjustment, 'adjustedOutcome', false) === safeGet(prediction, 'actualOutcome', false);
      }
      return safeGet(prediction, 'predictedOutcome', false) === safeGet(prediction, 'actualOutcome', false);
    });

    return (correctPredictions.length / validPredictions.length) * 100;
  } catch (error) {
    console.error('Error calculating accuracy:', error);
    return 0;
  }
};

/**
 * Calculate accuracy improvements across categories
 */
export const calculateAccuracyImprovements = (predictions: Prediction[]): AccuracyImprovement[] => {
  if (!Array.isArray(predictions) || predictions.length === 0) {
    console.warn('Empty or invalid predictions array passed to calculateAccuracyImprovements');
    return [];
  }

  try {
    const validPredictions = predictions.filter(isValidPrediction);
    if (validPredictions.length === 0) return [];

    const categories = [...new Set(validPredictions.map(p => p.category))];
    
    return categories.map(category => {
      const categoryPredictions = validPredictions.filter(p => p.category === category);
      const originalAccuracy = calculateAccuracy(categoryPredictions, 'original');
      const adjustedAccuracy = calculateAccuracy(categoryPredictions, 'adjusted');

      return {
        category,
        originalAccuracy,
        adjustedAccuracy,
        improvement: adjustedAccuracy - originalAccuracy
      };
    });
  } catch (error) {
    console.error('Error calculating accuracy improvements:', error);
    return [];
  }
};

/**
 * Calculate expert stats
 */
export const calculateExpertStats = (predictions: Prediction[], expertId: string): ExpertStats => {
  if (!Array.isArray(predictions) || !expertId) {
    console.warn('Invalid parameters passed to calculateExpertStats');
    return {
      totalAdjustments: 0,
      averageImpact: 0,
      accuracyImprovement: 0,
      recentActivity: []
    };
  }

  try {
    const validPredictions = predictions.filter(isValidPrediction);
    const expertAdjustments = validPredictions.filter(p => 
      p.expertAdjustment && safeGet(p.expertAdjustment, 'expertId', '') === expertId
    );

    const totalAdjustments = expertAdjustments.length;
    
    const impacts = expertAdjustments.map(p => {
      const actualValue = safeGet(p, 'actualValue', 0);
      if (actualValue === 0) return 0;
      
      const predictedValue = safeGet(p, 'predictedValue', 0);
      const adjustmentValue = safeGet(p.expertAdjustment, 'value', 0);
      
      const originalError = Math.abs((actualValue - predictedValue) / actualValue);
      const adjustedError = Math.abs((actualValue - adjustmentValue) / actualValue);
      return originalError - adjustedError;
    }).filter(impact => !isNaN(impact));

    const averageImpact = impacts.length > 0 
      ? impacts.reduce((acc, impact) => acc + impact, 0) / impacts.length 
      : 0;

    // Calculate recent activity
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const recentActivity = last7Days.map(date => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayAdjustments = expertAdjustments.filter(p => {
        if (!p.expertAdjustment || !p.expertAdjustment.timestamp) return false;
        
        const adjustmentDate = new Date(p.expertAdjustment.timestamp);
        return adjustmentDate >= date && adjustmentDate < nextDay;
      });

      return {
        date,
        count: dayAdjustments.length
      };
    });

    return {
      totalAdjustments,
      averageImpact,
      accuracyImprovement: averageImpact * 100,
      recentActivity
    };
  } catch (error) {
    console.error('Error calculating expert stats:', error);
    return {
      totalAdjustments: 0,
      averageImpact: 0,
      accuracyImprovement: 0,
      recentActivity: []
    };
  }
};

/**
 * Update confidence scores
 */
export function updateConfidenceScores(
  predictions: Prediction[],
  expertAccuracy: number
): ConfidenceUpdate[] {
  if (!Array.isArray(predictions) || predictions.length === 0) {
    console.warn('Empty or invalid predictions array passed to updateConfidenceScores');
    return [];
  }

  try {
    const validPredictions = predictions.filter(isValidPrediction);
    return validPredictions.map(prediction => {
      const metadata = prediction.metadata as PredictionMetadata;
      const patternConsistency = calculatePatternConsistency(prediction);
      const feedbackFrequency = calculateFeedbackFrequency(prediction);
      
      const adjustmentFactors = {
        expertAccuracy: Math.max(0, Math.min(1, expertAccuracy)),
        patternConsistency,
        feedbackFrequency
      };

      const adjustedConfidence = calculateAdjustedConfidence(
        safeGet(prediction, 'confidence', 0.5),
        adjustmentFactors
      );

      return {
        predictionId: prediction.id,
        originalConfidence: safeGet(prediction, 'confidence', 0.5),
        adjustedConfidence,
        adjustmentFactors
      };
    });
  } catch (error) {
    console.error('Error updating confidence scores:', error);
    return [];
  }
}

/**
 * Calculate pattern consistency
 */
function calculatePatternConsistency(prediction: Prediction): number {
  try {
    const metadata = prediction.metadata as PredictionMetadata;
    if (!metadata || !metadata.patternWeight) return 0.5;
    return Math.min(Math.max(metadata.patternWeight, 0), 1);
  } catch (error) {
    console.error('Error calculating pattern consistency:', error);
    return 0.5;
  }
}

/**
 * Calculate feedback frequency
 */
function calculateFeedbackFrequency(prediction: Prediction): number {
  try {
    const metadata = prediction.metadata as PredictionMetadata;
    if (!metadata || !metadata.lastRefined) return 0.5;
    
    const lastRefinedDate = new Date(metadata.lastRefined);
    if (isNaN(lastRefinedDate.getTime())) return 0.5;
    
    const daysSinceLastRefinement = Math.floor(
      (Date.now() - lastRefinedDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return Math.min(Math.max(1 - daysSinceLastRefinement / 30, 0), 1);
  } catch (error) {
    console.error('Error calculating feedback frequency:', error);
    return 0.5;
  }
}

/**
 * Calculate adjusted confidence
 */
function calculateAdjustedConfidence(
  originalConfidence: number,
  factors: {
    expertAccuracy: number;
    patternConsistency: number;
    feedbackFrequency: number;
  }
): number {
  try {
    const { expertAccuracy, patternConsistency, feedbackFrequency } = factors;
    
    // Weight factors based on importance
    const weights = {
      expertAccuracy: 0.5,
      patternConsistency: 0.3,
      feedbackFrequency: 0.2
    };

    const adjustmentFactor = 
      expertAccuracy * weights.expertAccuracy +
      patternConsistency * weights.patternConsistency +
      feedbackFrequency * weights.feedbackFrequency;

    // Adjust confidence based on weighted factors
    const adjustedConfidence = originalConfidence * adjustmentFactor;
    
    // Ensure confidence stays within 0-1 range
    return Math.min(Math.max(adjustedConfidence, 0), 1);
  } catch (error) {
    console.error('Error calculating adjusted confidence:', error);
    return originalConfidence;
  }
}

/**
 * Get recent expert activity
 */
export const getRecentExpertActivity = (predictions: Prediction[], days: number = 30): {
  totalAdjustments: number;
  accuracyImprovement: number;
  recentAdjustments: ExpertAdjustment[];
} => {
  if (!Array.isArray(predictions) || predictions.length === 0) {
    console.warn('Empty or invalid predictions array passed to getRecentExpertActivity');
    return {
      totalAdjustments: 0,
      accuracyImprovement: 0,
      recentAdjustments: []
    };
  }

  try {
    const now = new Date();
    const cutoffDate = new Date(now.setDate(now.getDate() - days));

    const recentPredictions = predictions.filter(p => {
      if (!p.expertAdjustment || !p.expertAdjustment.timestamp) return false;
      
      const adjustmentDate = new Date(p.expertAdjustment.timestamp);
      return !isNaN(adjustmentDate.getTime()) && adjustmentDate >= cutoffDate;
    });

    const recentAdjustments = recentPredictions
      .map(p => p.expertAdjustment!)
      .filter(adj => adj !== undefined)
      .sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });

    // Get overall improvement across all categories
    const improvements = calculateAccuracyImprovements(recentPredictions);
    const overallImprovement = improvements.length > 0 
      ? improvements.reduce((sum, imp) => sum + imp.improvement, 0) / improvements.length 
      : 0;

    return {
      totalAdjustments: recentAdjustments.length,
      accuracyImprovement: overallImprovement,
      recentAdjustments
    };
  } catch (error) {
    console.error('Error getting recent expert activity:', error);
    return {
      totalAdjustments: 0,
      accuracyImprovement: 0,
      recentAdjustments: []
    };
  }
}; 