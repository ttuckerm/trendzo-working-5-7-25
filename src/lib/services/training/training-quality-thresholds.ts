/**
 * Training Quality Thresholds
 * 
 * Defines quality thresholds for training data and provides utilities
 * for evaluating training readiness of extracted features.
 * 
 * THRESHOLDS:
 * - minFeatureCount: 150 (requires 150+ features extracted)
 * - minQualityScore: 0.50 (50% quality threshold)
 * - requireTextFeatures: true (must have text features)
 * - minComponentsSucceeded: 15 (at least 15 extraction components)
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Training quality thresholds
 * Videos must meet ALL thresholds to be considered "training ready"
 */
export const TRAINING_THRESHOLDS = {
  minFeatureCount: 150,        // Minimum number of features required
  minQualityScore: 0.50,       // Minimum quality score (0-1 scale)
  requireTextFeatures: true,   // Must have text/transcript features
  minComponentsSucceeded: 15,  // Minimum extraction components that succeeded
} as const;

/**
 * Legacy feature threshold for backward compatibility
 * Videos with fewer features than this are considered "legacy" samples
 */
export const LEGACY_FEATURE_THRESHOLD = 100;

// ============================================================================
// TYPES
// ============================================================================

export interface TrainingReadinessResult {
  isReady: boolean;
  featureCount: number;
  qualityScore: number;
  hasTextFeatures: boolean;
  componentsSucceeded: number;
  failedChecks: string[];
  recommendations: string[];
}

export interface TrainingReadinessStats {
  total: number;
  trainingReady: number;
  belowThreshold: number;
  trainingReadyPercentage: number;
  exclusionBreakdown: {
    lowFeatureCount: number;
    lowQualityScore: number;
    missingTextFeatures: number;
    lowComponentCount: number;
  };
  avgFeatureCount: number;
  avgQualityScore: number;
}

export interface VideoExclusionDetail {
  video_id: string;
  featureCount: number;
  qualityScore: number;
  hasTextFeatures: boolean;
  componentsSucceeded: number;
  exclusionReasons: string[];
}

export interface LegacyCleanupStats {
  total: number;
  legacy: number;
  modern: number;
  legacyPercentage: number;
  cleanedUp: number;
  errors: string[];
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!
  );
}

// ============================================================================
// EVALUATION FUNCTIONS
// ============================================================================

/**
 * Evaluate if a video's extracted features meet training quality thresholds
 */
export function evaluateTrainingReadiness(
  featureCount: number,
  qualityScore: number,
  hasTextFeatures: boolean,
  componentsSucceeded: number
): TrainingReadinessResult {
  const failedChecks: string[] = [];
  const recommendations: string[] = [];

  // Check feature count
  if (featureCount < TRAINING_THRESHOLDS.minFeatureCount) {
    failedChecks.push(`Feature count (${featureCount}) below minimum (${TRAINING_THRESHOLDS.minFeatureCount})`);
    recommendations.push('Re-extract features with all extraction options enabled');
  }

  // Check quality score
  if (qualityScore < TRAINING_THRESHOLDS.minQualityScore) {
    failedChecks.push(`Quality score (${(qualityScore * 100).toFixed(1)}%) below minimum (${(TRAINING_THRESHOLDS.minQualityScore * 100).toFixed(0)}%)`);
    recommendations.push('Improve feature extraction coverage');
  }

  // Check text features
  if (TRAINING_THRESHOLDS.requireTextFeatures && !hasTextFeatures) {
    failedChecks.push('Missing text features (transcript required)');
    recommendations.push('Ensure video has transcript data');
  }

  // Check component count
  if (componentsSucceeded < TRAINING_THRESHOLDS.minComponentsSucceeded) {
    failedChecks.push(`Components succeeded (${componentsSucceeded}) below minimum (${TRAINING_THRESHOLDS.minComponentsSucceeded})`);
    recommendations.push('Review extraction pipeline for failed components');
  }

  const isReady = failedChecks.length === 0;

  return {
    isReady,
    featureCount,
    qualityScore,
    hasTextFeatures,
    componentsSucceeded,
    failedChecks,
    recommendations,
  };
}

/**
 * Log training readiness evaluation results
 */
export function logTrainingReadiness(result: TrainingReadinessResult, videoId?: string): void {
  const prefix = videoId ? `[${videoId}]` : '[Training Readiness]';
  
  if (result.isReady) {
    console.log(`${prefix} ✅ Training ready`);
    console.log(`  Features: ${result.featureCount}, Quality: ${(result.qualityScore * 100).toFixed(1)}%`);
  } else {
    console.log(`${prefix} ❌ Not training ready`);
    console.log(`  Features: ${result.featureCount}, Quality: ${(result.qualityScore * 100).toFixed(1)}%`);
    result.failedChecks.forEach(check => console.log(`  - ${check}`));
    if (result.recommendations.length > 0) {
      console.log('  Recommendations:');
      result.recommendations.forEach(rec => console.log(`    → ${rec}`));
    }
  }
}

// ============================================================================
// DATABASE FUNCTIONS
// ============================================================================

/**
 * Get training readiness statistics from the database
 */
export async function getTrainingReadinessStats(): Promise<TrainingReadinessStats> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('training_features')
    .select('feature_count, quality_score, has_text_features, components_succeeded');

  if (error) {
    console.error('[Training Readiness] Error fetching stats:', error);
    return {
      total: 0,
      trainingReady: 0,
      belowThreshold: 0,
      trainingReadyPercentage: 0,
      exclusionBreakdown: {
        lowFeatureCount: 0,
        lowQualityScore: 0,
        missingTextFeatures: 0,
        lowComponentCount: 0,
      },
      avgFeatureCount: 0,
      avgQualityScore: 0,
    };
  }

  const rows = data || [];
  let trainingReady = 0;
  let belowThreshold = 0;
  let lowFeatureCount = 0;
  let lowQualityScore = 0;
  let missingTextFeatures = 0;
  let lowComponentCount = 0;
  let featureCountSum = 0;
  let qualityScoreSum = 0;

  for (const row of rows) {
    const fc = row.feature_count ?? 0;
    const qs = row.quality_score ?? 0;
    const htf = row.has_text_features ?? false;
    const cs = row.components_succeeded ?? 0;

    featureCountSum += fc;
    qualityScoreSum += qs;

    const result = evaluateTrainingReadiness(fc, qs, htf, cs);
    if (result.isReady) {
      trainingReady++;
    } else {
      belowThreshold++;
      if (fc < TRAINING_THRESHOLDS.minFeatureCount) lowFeatureCount++;
      if (qs < TRAINING_THRESHOLDS.minQualityScore) lowQualityScore++;
      if (!htf) missingTextFeatures++;
      if (cs < TRAINING_THRESHOLDS.minComponentsSucceeded) lowComponentCount++;
    }
  }

  const total = rows.length;

  return {
    total,
    trainingReady,
    belowThreshold,
    trainingReadyPercentage: total > 0 ? Math.round((trainingReady / total) * 100) : 0,
    exclusionBreakdown: {
      lowFeatureCount,
      lowQualityScore,
      missingTextFeatures,
      lowComponentCount,
    },
    avgFeatureCount: total > 0 ? featureCountSum / total : 0,
    avgQualityScore: total > 0 ? qualityScoreSum / total : 0,
  };
}

/**
 * Get detailed information about excluded videos
 */
export async function getExcludedVideosDetail(limit: number = 50): Promise<VideoExclusionDetail[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('training_features')
    .select('video_id, feature_count, quality_score, has_text_features, components_succeeded')
    .limit(limit);

  if (error) {
    console.error('[Training Readiness] Error fetching excluded videos:', error);
    return [];
  }

  const excluded: VideoExclusionDetail[] = [];

  for (const row of data || []) {
    const fc = row.feature_count ?? 0;
    const qs = row.quality_score ?? 0;
    const htf = row.has_text_features ?? false;
    const cs = row.components_succeeded ?? 0;

    const result = evaluateTrainingReadiness(fc, qs, htf, cs);
    if (!result.isReady) {
      excluded.push({
        video_id: row.video_id,
        featureCount: fc,
        qualityScore: qs,
        hasTextFeatures: htf,
        componentsSucceeded: cs,
        exclusionReasons: result.failedChecks,
      });
    }
  }

  return excluded;
}

/**
 * Update training readiness flag for a specific video
 */
export async function updateTrainingReadiness(
  videoId: string,
  featureCount: number,
  qualityScore: number,
  hasTextFeatures: boolean,
  componentsSucceeded: number
): Promise<{ success: boolean; isReady: boolean; error?: string }> {
  const supabase = getSupabase();
  
  const result = evaluateTrainingReadiness(featureCount, qualityScore, hasTextFeatures, componentsSucceeded);

  const { error } = await supabase
    .from('training_features')
    .update({ 
      is_training_ready: result.isReady,
      updated_at: new Date().toISOString(),
    })
    .eq('video_id', videoId);

  if (error) {
    return { success: false, isReady: result.isReady, error: error.message };
  }

  return { success: true, isReady: result.isReady };
}

/**
 * Re-evaluate training readiness for all videos in the database
 */
export async function reevaluateAllTrainingReadiness(): Promise<{
  processed: number;
  updated: number;
  errors: string[];
}> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('training_features')
    .select('video_id, feature_count, quality_score, has_text_features, components_succeeded');

  if (error) {
    return { processed: 0, updated: 0, errors: [error.message] };
  }

  const rows = data || [];
  let updated = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const fc = row.feature_count ?? 0;
    const qs = row.quality_score ?? 0;
    const htf = row.has_text_features ?? false;
    const cs = row.components_succeeded ?? 0;

    const result = await updateTrainingReadiness(row.video_id, fc, qs, htf, cs);
    if (result.success) {
      updated++;
    } else if (result.error) {
      errors.push(`${row.video_id}: ${result.error}`);
    }
  }

  console.log(`[Training Readiness] Re-evaluated ${rows.length} videos, updated ${updated}`);
  if (errors.length > 0) {
    console.log(`[Training Readiness] ${errors.length} errors encountered`);
  }

  return { processed: rows.length, updated, errors };
}

// ============================================================================
// LEGACY CLEANUP FUNCTIONS
// ============================================================================

/**
 * Get statistics about legacy samples (videos with fewer features than threshold)
 */
export async function getLegacyCleanupStats(): Promise<LegacyCleanupStats> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('training_features')
    .select('video_id, feature_count');

  if (error) {
    return {
      total: 0,
      legacy: 0,
      modern: 0,
      legacyPercentage: 0,
      cleanedUp: 0,
      errors: [error.message],
    };
  }

  const rows = data || [];
  let legacy = 0;
  let modern = 0;

  for (const row of rows) {
    const fc = row.feature_count ?? 0;
    if (fc < LEGACY_FEATURE_THRESHOLD) {
      legacy++;
    } else {
      modern++;
    }
  }

  return {
    total: rows.length,
    legacy,
    modern,
    legacyPercentage: rows.length > 0 ? Math.round((legacy / rows.length) * 100) : 0,
    cleanedUp: 0,
    errors: [],
  };
}

/**
 * Mark legacy samples as excluded from training
 * Does NOT delete them, just flags them
 */
export async function excludeLegacySamples(): Promise<{
  excluded: number;
  errors: string[];
}> {
  const supabase = getSupabase();

  const { data: legacyVideos, error: selectError } = await supabase
    .from('training_features')
    .select('video_id, feature_count')
    .lt('feature_count', LEGACY_FEATURE_THRESHOLD);

  if (selectError) {
    return { excluded: 0, errors: [selectError.message] };
  }

  if (!legacyVideos || legacyVideos.length === 0) {
    console.log('[Legacy Cleanup] No legacy samples found');
    return { excluded: 0, errors: [] };
  }

  const videoIds = legacyVideos.map(v => v.video_id);

  const { error: updateError } = await supabase
    .from('training_features')
    .update({ 
      is_training_ready: false,
      exclusion_reason: 'legacy_sample',
      updated_at: new Date().toISOString(),
    })
    .in('video_id', videoIds);

  if (updateError) {
    return { excluded: 0, errors: [updateError.message] };
  }

  console.log(`[Legacy Cleanup] Excluded ${videoIds.length} legacy samples`);
  return { excluded: videoIds.length, errors: [] };
}
