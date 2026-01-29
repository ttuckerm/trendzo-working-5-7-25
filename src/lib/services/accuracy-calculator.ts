/**
 * Accuracy Calculator Service
 *
 * Calculates prediction accuracy metrics for Admin Prediction Lab
 *
 * Metrics:
 * - MAE (Mean Absolute Error): Average absolute difference between predicted and actual DPS
 * - R² Score: Goodness of fit (1.0 = perfect, 0 = baseline)
 * - Within Range %: Percentage of predictions where actual DPS falls within predicted confidence interval
 * - Algorithm IQ: Combined metric (0-100 scale)
 *
 * Formula:
 * Algorithm IQ = 100 - (MAE × 2) + (R² × 50) + (within_range_pct × 0.5)
 */

export interface PredictionWithActual {
  prediction_id: string;
  video_id: string;
  predicted_dps: number;
  predicted_dps_low: number;
  predicted_dps_high: number;
  actual_dps: number;
  confidence: number;
  snapshot_type: string;
  niche?: string;
  account_size_band?: string;
  model_version: string;
  predicted_at: string;
  fetched_at: string;
}

export interface AccuracyMetrics {
  total_predictions: number;
  mae: number;
  r2_score: number;
  within_range_count: number;
  within_range_percentage: number;
  algorithm_iq: number;
  average_confidence: number;
  average_error: number;
}

export interface AccuracyBreakdown {
  overall: AccuracyMetrics;
  by_snapshot: Record<string, AccuracyMetrics>;
  by_niche: Record<string, AccuracyMetrics>;
  by_account_size: Record<string, AccuracyMetrics>;
  by_model: Record<string, AccuracyMetrics>;
}

/**
 * Calculate Mean Absolute Error (MAE)
 *
 * MAE = (1/n) × Σ|predicted - actual|
 */
export function calculateMAE(predictions: PredictionWithActual[]): number {
  if (predictions.length === 0) return 0;

  const sumAbsoluteErrors = predictions.reduce((sum, pred) => {
    return sum + Math.abs(pred.predicted_dps - pred.actual_dps);
  }, 0);

  return sumAbsoluteErrors / predictions.length;
}

/**
 * Calculate R² Score (Coefficient of Determination)
 *
 * R² = 1 - (SS_res / SS_tot)
 *
 * Where:
 * - SS_res = Σ(actual - predicted)²  (residual sum of squares)
 * - SS_tot = Σ(actual - mean)²       (total sum of squares)
 *
 * R² = 1.0: Perfect fit
 * R² = 0.0: Model performs as well as predicting the mean
 * R² < 0.0: Model performs worse than predicting the mean
 */
export function calculateR2Score(predictions: PredictionWithActual[]): number {
  if (predictions.length === 0) return 0;

  // Calculate mean of actual values
  const meanActual = predictions.reduce((sum, pred) => sum + pred.actual_dps, 0) / predictions.length;

  // Calculate SS_res (residual sum of squares)
  const ssRes = predictions.reduce((sum, pred) => {
    const residual = pred.actual_dps - pred.predicted_dps;
    return sum + (residual * residual);
  }, 0);

  // Calculate SS_tot (total sum of squares)
  const ssTot = predictions.reduce((sum, pred) => {
    const deviation = pred.actual_dps - meanActual;
    return sum + (deviation * deviation);
  }, 0);

  // Avoid division by zero
  if (ssTot === 0) return 0;

  const r2 = 1 - (ssRes / ssTot);

  return r2;
}

/**
 * Calculate within-range percentage
 *
 * Percentage of predictions where actual DPS falls within the predicted confidence interval
 */
export function calculateWithinRangePercentage(predictions: PredictionWithActual[]): {
  count: number;
  percentage: number;
} {
  if (predictions.length === 0) return { count: 0, percentage: 0 };

  const withinRangeCount = predictions.filter(pred => {
    return pred.actual_dps >= pred.predicted_dps_low &&
           pred.actual_dps <= pred.predicted_dps_high;
  }).length;

  const percentage = (withinRangeCount / predictions.length) * 100;

  return { count: withinRangeCount, percentage };
}

/**
 * Calculate average confidence
 */
export function calculateAverageConfidence(predictions: PredictionWithActual[]): number {
  if (predictions.length === 0) return 0;

  const sumConfidence = predictions.reduce((sum, pred) => sum + pred.confidence, 0);
  return sumConfidence / predictions.length;
}

/**
 * Calculate average error (signed)
 */
export function calculateAverageError(predictions: PredictionWithActual[]): number {
  if (predictions.length === 0) return 0;

  const sumError = predictions.reduce((sum, pred) => {
    return sum + (pred.predicted_dps - pred.actual_dps);
  }, 0);

  return sumError / predictions.length;
}

/**
 * Calculate Algorithm IQ Score
 *
 * Formula:
 * Algorithm IQ = 100 - (MAE × 2) + (R² × 50) + (within_range_pct × 0.5)
 *
 * Components:
 * - Base score: 100
 * - MAE penalty: -2 points per DPS error
 * - R² bonus: +50 points max (for perfect fit)
 * - Within-range bonus: +0.5 points per percentage point
 *
 * Range: 0-100 (clamped)
 */
export function calculateAlgorithmIQ(
  mae: number,
  r2Score: number,
  withinRangePercentage: number
): number {
  const baseScore = 100;
  const maePenalty = mae * 2;
  const r2Bonus = r2Score * 50;
  const withinRangeBonus = withinRangePercentage * 0.5;

  const algorithmIQ = baseScore - maePenalty + r2Bonus + withinRangeBonus;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, algorithmIQ));
}

/**
 * Calculate all accuracy metrics for a set of predictions
 */
export function calculateAccuracyMetrics(predictions: PredictionWithActual[]): AccuracyMetrics {
  if (predictions.length === 0) {
    return {
      total_predictions: 0,
      mae: 0,
      r2_score: 0,
      within_range_count: 0,
      within_range_percentage: 0,
      algorithm_iq: 0,
      average_confidence: 0,
      average_error: 0
    };
  }

  const mae = calculateMAE(predictions);
  const r2Score = calculateR2Score(predictions);
  const withinRange = calculateWithinRangePercentage(predictions);
  const averageConfidence = calculateAverageConfidence(predictions);
  const averageError = calculateAverageError(predictions);
  const algorithmIQ = calculateAlgorithmIQ(mae, r2Score, withinRange.percentage);

  return {
    total_predictions: predictions.length,
    mae,
    r2_score: r2Score,
    within_range_count: withinRange.count,
    within_range_percentage: withinRange.percentage,
    algorithm_iq: algorithmIQ,
    average_confidence: averageConfidence,
    average_error: averageError
  };
}

/**
 * Group predictions by a field and calculate metrics for each group
 */
function groupBy<T extends Record<string, any>>(
  items: T[],
  key: keyof T
): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const groupKey = String(item[key] || 'unknown');
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Calculate accuracy breakdown by snapshot type, niche, account size, and model
 */
export function calculateAccuracyBreakdown(predictions: PredictionWithActual[]): AccuracyBreakdown {
  const overall = calculateAccuracyMetrics(predictions);

  // Group by snapshot type
  const bySnapshotGroups = groupBy(predictions, 'snapshot_type');
  const by_snapshot: Record<string, AccuracyMetrics> = {};
  Object.entries(bySnapshotGroups).forEach(([key, group]) => {
    by_snapshot[key] = calculateAccuracyMetrics(group);
  });

  // Group by niche
  const byNicheGroups = groupBy(predictions, 'niche');
  const by_niche: Record<string, AccuracyMetrics> = {};
  Object.entries(byNicheGroups).forEach(([key, group]) => {
    by_niche[key] = calculateAccuracyMetrics(group);
  });

  // Group by account size
  const byAccountSizeGroups = groupBy(predictions, 'account_size_band');
  const by_account_size: Record<string, AccuracyMetrics> = {};
  Object.entries(byAccountSizeGroups).forEach(([key, group]) => {
    by_account_size[key] = calculateAccuracyMetrics(group);
  });

  // Group by model version
  const byModelGroups = groupBy(predictions, 'model_version');
  const by_model: Record<string, AccuracyMetrics> = {};
  Object.entries(byModelGroups).forEach(([key, group]) => {
    by_model[key] = calculateAccuracyMetrics(group);
  });

  return {
    overall,
    by_snapshot,
    by_niche,
    by_account_size,
    by_model
  };
}

/**
 * Export all functions
 */
export const AccuracyCalculator = {
  calculateMAE,
  calculateR2Score,
  calculateWithinRangePercentage,
  calculateAverageConfidence,
  calculateAverageError,
  calculateAlgorithmIQ,
  calculateAccuracyMetrics,
  calculateAccuracyBreakdown
};
