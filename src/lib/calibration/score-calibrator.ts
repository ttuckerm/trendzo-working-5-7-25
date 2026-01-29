/**
 * Score Calibrator
 * 
 * Applies calibration curves to raw component scores to correct
 * for systematic over/under-prediction bias.
 */

export interface CalibrationConfig {
  componentId: string;
  // Linear calibration: calibrated = (raw * scale) + offset
  scale: number;
  offset: number;
  // Optional: Piecewise calibration for more complex adjustments
  breakpoints?: { rawMin: number; rawMax: number; scale: number; offset: number }[];
  // Clip output to valid range
  minOutput: number;
  maxOutput: number;
}

// FIXED: Less aggressive calibration (was over-correcting)
// These values provide balanced calibration without extreme reduction
export const DEFAULT_CALIBRATIONS: Record<string, CalibrationConfig> = {
  xgboost: {
    componentId: 'xgboost',
    scale: 0.90,      // Was 0.6 - now much less aggressive
    offset: -5,       // Was -10
    minOutput: 5,     // Minimum 5 instead of 0
    maxOutput: 100
  },
  gpt4: {
    componentId: 'gpt4',
    scale: 0.85,      // Was 0.55
    offset: -3,       // Was -5
    minOutput: 5,
    maxOutput: 100
  },
  pattern: {
    componentId: 'pattern',
    scale: 0.88,      // Was 0.7
    offset: -4,       // Was -8
    minOutput: 5,
    maxOutput: 100
  },
  historical: {
    componentId: 'historical',
    scale: 0.92,      // Was 0.75
    offset: -2,       // Was -5
    minOutput: 5,
    maxOutput: 100
  },
  gemini: {
    componentId: 'gemini',
    scale: 0.82,      // Was 0.5
    offset: -5,       // Was -10
    minOutput: 5,
    maxOutput: 100
  }
};

/**
 * Apply calibration to a single component score
 */
export function calibrateScore(
  rawScore: number, 
  componentId: string,
  config?: CalibrationConfig
): number {
  const calibration = config || DEFAULT_CALIBRATIONS[componentId];
  
  if (!calibration) {
    console.warn(`No calibration config for component: ${componentId}`);
    return rawScore;
  }

  let calibrated: number;

  // Check for piecewise calibration
  if (calibration.breakpoints && calibration.breakpoints.length > 0) {
    const breakpoint = calibration.breakpoints.find(
      bp => rawScore >= bp.rawMin && rawScore <= bp.rawMax
    );
    
    if (breakpoint) {
      calibrated = (rawScore * breakpoint.scale) + breakpoint.offset;
    } else {
      // Default linear calibration
      calibrated = (rawScore * calibration.scale) + calibration.offset;
    }
  } else {
    // Simple linear calibration
    calibrated = (rawScore * calibration.scale) + calibration.offset;
  }

  // Clip to valid range
  return Math.max(calibration.minOutput, Math.min(calibration.maxOutput, calibrated));
}

/**
 * Batch calibrate all component scores
 */
export function calibrateAllScores(componentScores: Record<string, number>): Record<string, number> {
  const calibrated: Record<string, number> = {};
  
  for (const [componentId, rawScore] of Object.entries(componentScores)) {
    calibrated[componentId] = calibrateScore(rawScore, componentId);
  }
  
  return calibrated;
}

/**
 * Calculate the weighted final score from calibrated component scores
 */
export function calculateWeightedScore(
  calibratedScores: Record<string, number>,
  weights?: Record<string, number>
): number {
  const defaultWeights: Record<string, number> = {
    xgboost: 0.30,
    gpt4: 0.25,
    pattern: 0.20,
    historical: 0.15,
    gemini: 0.10
  };

  const w = weights || defaultWeights;
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [componentId, score] of Object.entries(calibratedScores)) {
    const weight = w[componentId] || 0;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight * totalWeight : 0;
}

/**
 * Learn calibration from actual results using linear regression
 * 
 * Given a set of (predicted, actual) pairs, calculate optimal calibration
 */
export function learnCalibration(
  componentId: string,
  predictions: { predicted: number; actual: number }[]
): CalibrationConfig {
  if (predictions.length < 5) {
    console.warn('Not enough data points for calibration learning');
    return DEFAULT_CALIBRATIONS[componentId] || {
      componentId,
      scale: 1,
      offset: 0,
      minOutput: 0,
      maxOutput: 100
    };
  }

  // Simple linear regression: actual = scale * predicted + offset
  const n = predictions.length;
  const sumX = predictions.reduce((sum, p) => sum + p.predicted, 0);
  const sumY = predictions.reduce((sum, p) => sum + p.actual, 0);
  const sumXY = predictions.reduce((sum, p) => sum + p.predicted * p.actual, 0);
  const sumXX = predictions.reduce((sum, p) => sum + p.predicted * p.predicted, 0);

  const denominator = n * sumXX - sumX * sumX;
  
  // Avoid division by zero
  if (Math.abs(denominator) < 0.0001) {
    return DEFAULT_CALIBRATIONS[componentId] || {
      componentId,
      scale: 1,
      offset: 0,
      minOutput: 0,
      maxOutput: 100
    };
  }

  const scale = (n * sumXY - sumX * sumY) / denominator;
  const offset = (sumY - scale * sumX) / n;

  return {
    componentId,
    scale: Math.max(0.1, Math.min(2, scale)), // Clip scale to reasonable range
    offset: Math.max(-50, Math.min(50, offset)), // Clip offset
    minOutput: 0,
    maxOutput: 100
  };
}

/**
 * Calculate mean absolute error for a calibration config
 */
export function calculateMeanError(
  data: { predicted: number; actual: number }[],
  config: CalibrationConfig
): number {
  if (data.length === 0) return Infinity;
  
  const errors = data.map(d => {
    const calibrated = (d.predicted * config.scale) + config.offset;
    const clipped = Math.max(config.minOutput, Math.min(config.maxOutput, calibrated));
    return Math.abs(clipped - d.actual);
  });
  
  return errors.reduce((a, b) => a + b, 0) / errors.length;
}

/**
 * Format calibration for display
 */
export function formatCalibration(config: CalibrationConfig): string {
  return `${config.componentId}: score × ${config.scale.toFixed(2)} + ${config.offset.toFixed(1)}`;
}

