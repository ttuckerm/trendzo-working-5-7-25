/**
 * Auto-Calibrator
 * 
 * Automatically adjusts calibration parameters based on
 * accumulated prediction vs actual data.
 */

import { CalibrationConfig, learnCalibration, DEFAULT_CALIBRATIONS, calculateMeanError } from './score-calibrator';

export interface CalibrationUpdate {
  componentId: string;
  oldConfig: CalibrationConfig;
  newConfig: CalibrationConfig;
  dataPoints: number;
  improvement: number; // Expected error reduction
  recommendation: string;
}

export interface CalibrationAnalysis {
  updates: CalibrationUpdate[];
  overallStatus: 'optimal' | 'needs_tuning' | 'critical';
  currentAvgError: number;
  projectedAvgError: number;
  dataPointsUsed: number;
  lastAnalyzed: string;
}

/**
 * Analyze recent predictions and suggest calibration updates
 */
export async function analyzeCalibration(
  predictions: Array<{
    predicted_dps: number;
    actual_dps: number;
    component_scores?: Record<string, number>;
    calibrated_scores?: Record<string, number>;
    niche?: string;
  }>
): Promise<CalibrationAnalysis> {
  if (!predictions || predictions.length < 10) {
    return {
      updates: [],
      overallStatus: 'optimal',
      currentAvgError: 0,
      projectedAvgError: 0,
      dataPointsUsed: predictions?.length || 0,
      lastAnalyzed: new Date().toISOString()
    };
  }

  const updates: CalibrationUpdate[] = [];
  let totalCurrentError = 0;
  let totalProjectedError = 0;

  // Calculate current overall error
  const currentErrors = predictions.map(p => Math.abs(p.predicted_dps - p.actual_dps));
  const currentAvgError = currentErrors.reduce((a, b) => a + b, 0) / currentErrors.length;

  // Analyze each component
  const componentIds = ['xgboost', 'gpt4', 'pattern', 'historical', 'gemini'];
  
  for (const componentId of componentIds) {
    // Extract component predictions vs actuals
    const componentData = predictions
      .filter(p => p.component_scores && p.component_scores[componentId] !== undefined)
      .map(p => ({
        predicted: p.component_scores![componentId],
        actual: p.actual_dps
      }));

    if (componentData.length < 10) continue;

    // Current calibration
    const oldConfig = DEFAULT_CALIBRATIONS[componentId];

    // Learn new calibration from data
    const newConfig = learnCalibration(componentId, componentData);

    // Calculate expected improvement
    const oldError = calculateMeanError(componentData, oldConfig);
    const newError = calculateMeanError(componentData, newConfig);
    const improvement = oldError - newError;

    totalCurrentError += oldError;
    totalProjectedError += newError;

    // Generate recommendation
    let recommendation = '';
    if (improvement > 5) {
      recommendation = `Significant improvement possible. Reduce scale to ${newConfig.scale.toFixed(3)} and offset to ${newConfig.offset.toFixed(1)}`;
    } else if (improvement > 2) {
      recommendation = `Minor tuning recommended. Adjust scale from ${oldConfig.scale} to ${newConfig.scale.toFixed(3)}`;
    } else if (improvement > 0) {
      recommendation = `Marginal improvement. Current calibration is acceptable.`;
    } else {
      recommendation = `No improvement from recalibration. Keep current settings.`;
    }

    // Only suggest if significant improvement
    if (improvement > 2) {
      updates.push({
        componentId,
        oldConfig,
        newConfig,
        dataPoints: componentData.length,
        improvement,
        recommendation
      });
    }
  }

  // Calculate projected error if all updates applied
  const projectedAvgError = updates.length > 0 
    ? currentAvgError - (updates.reduce((sum, u) => sum + u.improvement, 0) / updates.length)
    : currentAvgError;

  // Determine overall status
  let overallStatus: 'optimal' | 'needs_tuning' | 'critical';
  if (currentAvgError <= 10) {
    overallStatus = 'optimal';
  } else if (currentAvgError <= 20) {
    overallStatus = 'needs_tuning';
  } else {
    overallStatus = 'critical';
  }

  return {
    updates,
    overallStatus,
    currentAvgError,
    projectedAvgError,
    dataPointsUsed: predictions.length,
    lastAnalyzed: new Date().toISOString()
  };
}

/**
 * Apply calibration updates (returns updated configs)
 */
export function applyCalibrationUpdates(
  currentConfigs: Record<string, CalibrationConfig>,
  updates: CalibrationUpdate[]
): Record<string, CalibrationConfig> {
  const updatedConfigs = { ...currentConfigs };

  for (const update of updates) {
    console.log(`Applying calibration update for ${update.componentId}:`, {
      scale: `${update.oldConfig.scale.toFixed(3)} → ${update.newConfig.scale.toFixed(3)}`,
      offset: `${update.oldConfig.offset.toFixed(1)} → ${update.newConfig.offset.toFixed(1)}`,
      expectedImprovement: `${update.improvement.toFixed(1)} DPS`
    });

    updatedConfigs[update.componentId] = {
      ...update.newConfig,
      componentId: update.componentId
    };
  }

  return updatedConfigs;
}

/**
 * Generate calibration history entry
 */
export function createCalibrationHistoryEntry(update: CalibrationUpdate) {
  return {
    component_id: update.componentId,
    old_scale: update.oldConfig.scale,
    new_scale: update.newConfig.scale,
    old_offset: update.oldConfig.offset,
    new_offset: update.newConfig.offset,
    data_points: update.dataPoints,
    expected_improvement: update.improvement,
    created_at: new Date().toISOString()
  };
}

/**
 * Calculate confidence in calibration suggestion
 */
export function calculateCalibrationConfidence(update: CalibrationUpdate): number {
  let confidence = 0.5; // Base confidence

  // More data points = higher confidence
  if (update.dataPoints >= 50) confidence += 0.2;
  else if (update.dataPoints >= 30) confidence += 0.15;
  else if (update.dataPoints >= 20) confidence += 0.1;

  // Larger improvement = higher confidence (up to a point)
  if (update.improvement >= 10) confidence += 0.15;
  else if (update.improvement >= 5) confidence += 0.1;
  else if (update.improvement >= 2) confidence += 0.05;

  // Scale changes that are moderate are more trustworthy
  const scaleChange = Math.abs(update.newConfig.scale - update.oldConfig.scale);
  if (scaleChange < 0.3) confidence += 0.1;
  else if (scaleChange > 0.5) confidence -= 0.1;

  return Math.max(0.3, Math.min(0.95, confidence));
}

/**
 * Get summary report for calibration analysis
 */
export function getCalibrationReport(analysis: CalibrationAnalysis): string {
  const lines: string[] = [
    '=== CALIBRATION ANALYSIS REPORT ===',
    '',
    `Status: ${analysis.overallStatus.toUpperCase()}`,
    `Current Avg Error: ${analysis.currentAvgError.toFixed(1)} DPS`,
    `Projected Avg Error: ${analysis.projectedAvgError.toFixed(1)} DPS`,
    `Data Points Used: ${analysis.dataPointsUsed}`,
    `Analyzed: ${analysis.lastAnalyzed}`,
    ''
  ];

  if (analysis.updates.length > 0) {
    lines.push('Recommended Updates:');
    for (const update of analysis.updates) {
      lines.push(`  ${update.componentId}:`);
      lines.push(`    Scale: ${update.oldConfig.scale.toFixed(3)} → ${update.newConfig.scale.toFixed(3)}`);
      lines.push(`    Offset: ${update.oldConfig.offset.toFixed(1)} → ${update.newConfig.offset.toFixed(1)}`);
      lines.push(`    Expected Improvement: ${update.improvement.toFixed(1)} DPS`);
      lines.push(`    Confidence: ${(calculateCalibrationConfidence(update) * 100).toFixed(0)}%`);
      lines.push('');
    }
  } else {
    lines.push('No calibration updates recommended at this time.');
  }

  return lines.join('\n');
}




























































































