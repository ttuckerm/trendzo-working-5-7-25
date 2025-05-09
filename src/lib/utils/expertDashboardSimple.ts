/**
 * expertDashboardSimple.ts
 * Simplified utility functions for the expert dashboard
 */

import { Prediction, ExpertAdjustment } from '../types/prediction';
import { PredictionGroup, AccuracyImprovement, ExpertStats } from '../types/expertDashboard';

/**
 * Safely get a value from an object with a fallback
 */
export const safeGet = <T>(obj: any, path: string, fallback: T): T => {
  try {
    if (!obj) return fallback;
    const parts = path.split('.');
    let result = obj;
    for (const part of parts) {
      if (result === null || result === undefined) return fallback;
      result = result[part];
    }
    return (result === null || result === undefined) ? fallback : result as T;
  } catch (error) {
    console.error(`Error accessing ${path}:`, error);
    return fallback;
  }
};

/**
 * Check if a prediction is valid
 */
export const isValidPrediction = (prediction: any): prediction is Prediction => {
  return Boolean(
    prediction &&
    typeof safeGet(prediction, 'id', '') === 'string' &&
    typeof safeGet(prediction, 'category', '') === 'string' &&
    typeof safeGet(prediction, 'confidence', 0) === 'number'
  );
};

/**
 * Check if an array of predictions is valid 
 */
export const getValidPredictions = (predictions: any[]): Prediction[] => {
  if (!Array.isArray(predictions)) return [];
  return predictions.filter(isValidPrediction);
};

/**
 * Calculate similarity between two predictions (simple version)
 */
export const calculateSimilarityScore = (pred1: Prediction, pred2: Prediction): number => {
  try {
    // Basic check to avoid processing invalid data
    if (!pred1 || !pred2) return 0;
    
    // Calculate similarity based on category, trend, and confidence
    const categoryMatch = pred1.category === pred2.category ? 0.4 : 0;
    const trendMatch = pred1.trend === pred2.trend ? 0.3 : 0;
    
    const confidenceDiff = Math.abs(
      safeGet(pred1, 'confidence', 0) - safeGet(pred2, 'confidence', 0)
    );
    const confidenceScore = Math.max(0, 1 - confidenceDiff) * 0.3;
    
    return categoryMatch + trendMatch + confidenceScore;
  } catch (error) {
    console.error('Error calculating similarity score:', error);
    return 0;
  }
};

/**
 * Group predictions by similarity
 */
export const groupPredictionsBySimilarity = (
  predictions: Prediction[], 
  similarityThreshold: number = 0.7
): PredictionGroup[] => {
  // Input validation
  const validPredictions = getValidPredictions(predictions);
  if (validPredictions.length === 0) return [];
  
  // Ensure threshold is valid
  const threshold = Math.max(0, Math.min(1, similarityThreshold));
  
  console.log(`Grouping ${validPredictions.length} predictions with threshold ${threshold}`);
  
  try {
    // Track processed predictions to avoid duplicates
    const processed = new Set<string>();
    const groups: PredictionGroup[] = [];
    
    // Process each prediction
    validPredictions.forEach(pred1 => {
      // Skip if already processed
      if (processed.has(pred1.id)) return;
      
      // Find similar predictions
      const similarPredictions = validPredictions.filter(pred2 => {
        // Skip if same prediction or already processed
        if (pred1.id === pred2.id || processed.has(pred2.id)) return false;
        
        // Calculate similarity and check against threshold
        const similarity = calculateSimilarityScore(pred1, pred2);
        return similarity >= threshold;
      });
      
      // Create group with this prediction and its similar ones
      const groupPredictions = [pred1, ...similarPredictions];
      
      // Calculate average confidence
      const totalConfidence = groupPredictions.reduce(
        (sum, p) => sum + safeGet(p, 'confidence', 0), 
        0
      );
      const avgConfidence = totalConfidence / groupPredictions.length;
      
      // Calculate average similarity within the group
      let totalSimilarity = 0;
      let similarityCount = 0;
      
      groupPredictions.forEach((p1, i) => {
        groupPredictions.slice(i + 1).forEach(p2 => {
          totalSimilarity += calculateSimilarityScore(p1, p2);
          similarityCount++;
        });
      });
      
      const avgSimilarity = similarityCount > 0 
        ? totalSimilarity / similarityCount 
        : 1; // If only one prediction, similarity is 1
      
      // Create and add the group
      groups.push({
        id: `group-${pred1.id}`,
        predictions: groupPredictions,
        similarityScore: avgSimilarity,
        averageConfidence: avgConfidence
      });
      
      // Mark all predictions in this group as processed
      groupPredictions.forEach(p => processed.add(p.id));
    });
    
    console.log(`Created ${groups.length} prediction groups`);
    return groups;
  } catch (error) {
    console.error('Error grouping predictions:', error);
    return [];
  }
};

/**
 * Calculate accuracy for predictions
 */
export const calculateAccuracy = (
  predictions: Prediction[], 
  type: 'original' | 'adjusted' = 'original'
): number => {
  const validPredictions = getValidPredictions(predictions);
  if (validPredictions.length === 0) return 0;
  
  try {
    // Count predictions with matching outcomes
    const correctCount = validPredictions.filter(pred => {
      if (type === 'adjusted' && pred.expertAdjustment) {
        // For adjusted accuracy, compare expertAdjustment.adjustedOutcome with actualOutcome
        return pred.expertAdjustment.adjustedOutcome === pred.actualOutcome;
      }
      // For original accuracy, compare predictedOutcome with actualOutcome
      return pred.predictedOutcome === pred.actualOutcome;
    }).length;
    
    // Calculate percentage
    return (correctCount / validPredictions.length) * 100;
  } catch (error) {
    console.error('Error calculating accuracy:', error);
    return 0;
  }
};

/**
 * Calculate accuracy improvements by category
 */
export const calculateAccuracyImprovements = (predictions: Prediction[]): AccuracyImprovement[] => {
  const validPredictions = getValidPredictions(predictions);
  if (validPredictions.length === 0) return [];
  
  try {
    // Get unique categories
    const categories = Array.from(new Set(validPredictions.map(p => p.category)));
    
    // Calculate improvements for each category
    return categories.map(category => {
      // Get predictions for this category
      const categoryPredictions = validPredictions.filter(p => p.category === category);
      
      // Calculate original and adjusted accuracy
      const originalAccuracy = calculateAccuracy(categoryPredictions, 'original');
      const adjustedAccuracy = calculateAccuracy(categoryPredictions, 'adjusted');
      
      // Calculate improvement
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
 * Calculate expert statistics
 */
export const calculateExpertStats = (predictions: Prediction[], expertId: string): ExpertStats => {
  if (!expertId) return {
    totalAdjustments: 0,
    averageImpact: 0,
    accuracyImprovement: 0,
    recentActivity: []
  };
  
  const validPredictions = getValidPredictions(predictions);
  
  try {
    // Get expert adjustments made by this expert
    const expertAdjustments = validPredictions.filter(p => 
      p.expertAdjustment && p.expertAdjustment.expertId === expertId
    );
    
    // Calculate total adjustments
    const totalAdjustments = expertAdjustments.length;
    
    // Calculate average impact
    let totalImpact = 0;
    let impactCount = 0;
    
    expertAdjustments.forEach(p => {
      if (p.actualValue !== undefined && p.actualValue !== null) {
        const originalError = Math.abs(p.predictedValue - p.actualValue) / p.actualValue;
        const adjustedError = Math.abs(p.expertAdjustment!.value - p.actualValue) / p.actualValue;
        totalImpact += (originalError - adjustedError);
        impactCount++;
      }
    });
    
    const averageImpact = impactCount > 0 ? totalImpact / impactCount : 0;
    
    // Calculate recent activity (last 7 days)
    const now = new Date();
    const recentActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Count adjustments on this day
      const count = expertAdjustments.filter(p => {
        if (!p.expertAdjustment?.timestamp) return false;
        const adjustmentDate = new Date(p.expertAdjustment.timestamp);
        return adjustmentDate >= date && adjustmentDate < nextDate;
      }).length;
      
      return { date, count };
    });
    
    // Calculate overall accuracy improvement
    const improvements = calculateAccuracyImprovements(validPredictions);
    const accuracyImprovement = improvements.length > 0
      ? improvements.reduce((sum, imp) => sum + imp.improvement, 0) / improvements.length
      : 0;
    
    return {
      totalAdjustments,
      averageImpact,
      accuracyImprovement,
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