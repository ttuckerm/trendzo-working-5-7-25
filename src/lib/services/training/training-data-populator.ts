/**
 * Training Data Population Service
 * 
 * FIXED: Now reads from 'training_features' table (what Kai Orchestrator writes to)
 * instead of the old 'training_data' table.
 * 
 * DATA FLOW:
 *   Kai Orchestrator → training_features table → This service → UI
 */

import { createClient } from '@supabase/supabase-js';
import { selectVideosForTraining, VideoSelectionCriteria, getVideoSelectionStats } from './video-selector';
import { validateVideoData, mapPerformanceTier, calculateEngagementRate } from './data-validator';
import { extractTrainingFeatures, ExtractedFeatures } from './feature-extractor';
import { TRAINING_THRESHOLDS, evaluateTrainingReadiness } from './training-quality-thresholds';

// ============================================================================
// TYPES
// ============================================================================

export interface PopulationResult {
  success: boolean;
  processed: number;
  inserted: number;
  skipped: number;
  failed: number;
  errors: Array<{ videoId: string; error: string }>;
  duration: number;
  distribution: Record<string, number>;
}

export interface PopulationOptions {
  selectionCriteria?: VideoSelectionCriteria;
  minQualityScore?: number;
  skipExisting?: boolean;
  dataSplit?: 'train' | 'validation' | 'test' | 'auto';
  splitRatios?: { train: number; validation: number; test: number };
  onProgress?: (stage: string, progress: number, total: number) => void;
  batchSize?: number;
}

export interface TrainingDataStats {
  total: number;
  // NEW: Training readiness breakdown
  trainingReady: number;        // Videos meeting ALL quality thresholds
  belowThreshold: number;       // Videos that failed one or more thresholds
  trainingReadyPercentage: number;
  // Exclusion breakdown (why videos are excluded)
  exclusionBreakdown: {
    lowFeatureCount: number;    // feature_count < 150
    lowQualityScore: number;    // quality_score < 0.50
    missingTextFeatures: number; // has_text_features = false
    lowComponentCount: number;   // components_succeeded < 15
  };
  byTier: Record<string, number>;
  bySplit: Record<string, number>;
  avgQuality: number;
  avgCoverage: number;
  avgFeatureCount: number;
  withTranscript: number;
  withTextFeatures: number;
  withFFmpegFeatures: number;
  withLLMFeatures: number;
  withPatternFeatures: number;
  lastUpdated: string | null;
  extractionVersion: string | null;
  // Source information for debugging
  sourceTable: 'training_features';
  // Quality thresholds (for reference)
  thresholds: {
    minFeatureCount: number;
    minQualityScore: number;
    requireTextFeatures: boolean;
    minComponentsSucceeded: number;
  };
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!
  );
}

// ============================================================================
// MAIN POPULATION FUNCTION
// ============================================================================

/**
 * Populate the training_features table from scraped_videos via Kai Orchestrator
 * 
 * NOTE: This now writes to 'training_features' to match what Kai Orchestrator uses.
 * The old 'training_data' table is deprecated.
 */
export async function populateTrainingData(
  options: PopulationOptions = {}
): Promise<PopulationResult> {
  const startTime = Date.now();
  const supabase = getSupabase();

  const result: PopulationResult = {
    success: false,
    processed: 0,
    inserted: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    duration: 0,
    distribution: {}
  };

  try {
    // Step 1: Select videos
    options.onProgress?.('Selecting videos', 0, 100);

    const videos = await selectVideosForTraining({
      excludeAlreadyProcessed: options.skipExisting !== false,
      requireCompleteStatus: true,  // NEW: Only include videos with processing_status = 'complete'
      ...options.selectionCriteria
    });

    if (videos.length === 0) {
      console.log('No videos to process');
      result.success = true;
      result.duration = Date.now() - startTime;
      return result;
    }

    const total = videos.length;
    console.log(`Selected ${total} videos for processing`);

    // Step 2: Process each video
    const batchSize = options.batchSize || 10;
    
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      result.processed++;

      options.onProgress?.('Processing videos', i + 1, total);

      try {
        // Validate
        const validation = validateVideoData(video);

        if (!validation.isValid) {
          result.skipped++;
          console.log(`Skipping ${video.video_id}: validation failed`);
          continue;
        }

        if (options.minQualityScore && validation.qualityScore < options.minQualityScore) {
          result.skipped++;
          console.log(`Skipping ${video.video_id}: quality score ${validation.qualityScore} < ${options.minQualityScore}`);
          continue;
        }

        // Extract features
        const featuresResult = await extractTrainingFeatures(video);

        if (featuresResult.errors.length > 0 || featuresResult.featureCount === 0) {
          result.failed++;
          result.errors.push({
            videoId: video.video_id,
            error: featuresResult.errors.join(', ') || 'No features extracted'
          });
          continue;
        }

        // Prepare training_features record (matching Kai Orchestrator schema)
        const trainingRecord = {
          video_id: video.video_id,
          features: featuresResult.features,
          feature_count: featuresResult.featureCount,
          has_text_features: featuresResult.hasTranscriptFeatures,
          has_ffmpeg_features: featuresResult.hasVisualFeatures,
          has_llm_features: false,
          has_pattern_features: false,
          has_lego_features: false,
          has_attribute_features: false,
          has_style_features: false,
          has_hook_features: false,
          actual_dps_score: video.dps_score,
          actual_dps_percentile: video.dps_percentile,
          performance_tier: mapPerformanceTier(video.dps_classification),
          actual_views: video.views_count,
          actual_likes: video.likes_count,
          actual_comments: video.comments_count,
          actual_shares: video.shares_count,
          actual_saves: video.saves_count,
          quality_score: validation.qualityScore / 100,
          included_in_training: true,
          extraction_version: '4.0-training-populator'
        };

        // Insert into training_features (NOT training_data!)
        const { error: insertError } = await supabase
          .from('training_features')
          .upsert(trainingRecord, { onConflict: 'video_id,extraction_version' });

        if (insertError) {
          result.failed++;
          result.errors.push({
            videoId: video.video_id,
            error: insertError.message
          });
        } else {
          result.inserted++;

          // Track distribution
          const tier = trainingRecord.performance_tier;
          result.distribution[tier] = (result.distribution[tier] || 0) + 1;
        }

      } catch (error: any) {
        result.failed++;
        result.errors.push({
          videoId: video.video_id,
          error: error.message
        });
      }

      // Small delay to avoid overwhelming the database
      if (i % batchSize === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    result.success = result.failed === 0;
    result.duration = Date.now() - startTime;

  } catch (error: any) {
    result.errors.push({
      videoId: 'PIPELINE',
      error: error.message
    });
    result.duration = Date.now() - startTime;
  }

  return result;
}

// ============================================================================
// STATISTICS - NOW READS FROM training_features (Kai's output)
// ============================================================================

/**
 * Get current training data statistics from training_features table
 * 
 * UPDATED: Now includes training_ready breakdown showing:
 * - Total processed videos
 * - Training-ready count (meeting ALL quality thresholds)
 * - Below-threshold count with exclusion reasons
 * 
 * THRESHOLDS:
 * - feature_count >= 150
 * - quality_score >= 0.50 (50%)
 * - has_text_features = true
 * - components_succeeded >= 15
 */
export async function getTrainingDataStats(): Promise<TrainingDataStats> {
  const supabase = getSupabase();
  
  // Read from training_features - where Kai Orchestrator writes data
  const { data, error } = await supabase
    .from('training_features')
    .select(`
      id, 
      video_id,
      feature_count, 
      quality_score, 
      performance_tier,
      has_text_features,
      has_ffmpeg_features,
      has_llm_features,
      has_pattern_features,
      has_lego_features,
      has_attribute_features,
      has_style_features,
      has_hook_features,
      included_in_training,
      training_ready,
      components_succeeded,
      exclusion_reasons,
      extraction_version,
      created_at
    `);

  const emptyStats: TrainingDataStats = {
      total: 0,
    trainingReady: 0,
    belowThreshold: 0,
    trainingReadyPercentage: 0,
    exclusionBreakdown: {
      lowFeatureCount: 0,
      lowQualityScore: 0,
      missingTextFeatures: 0,
      lowComponentCount: 0
    },
      byTier: {},
      bySplit: {},
      avgQuality: 0,
      avgCoverage: 0,
      avgFeatureCount: 0,
      withTranscript: 0,
      withTextFeatures: 0,
      withFFmpegFeatures: 0,
      withLLMFeatures: 0,
      withPatternFeatures: 0,
      lastUpdated: null,
      extractionVersion: null,
    sourceTable: 'training_features',
    thresholds: TRAINING_THRESHOLDS
    };

  if (error) {
    console.error('Error fetching training stats from training_features:', error);
    return emptyStats;
  }

  // Handle null data
  if (!data || data.length === 0) {
    console.log('No training data found in training_features table');
    return emptyStats;
  }

  console.log(`Found ${data.length} records in training_features (Kai's output)`);

  const byTier: Record<string, number> = {};
  const bySplit: Record<string, number> = { 'training_ready': 0, 'below_threshold': 0 };
  let qualitySum = 0;
  let featureCountSum = 0;
  let withTextFeatures = 0;
  let withFFmpegFeatures = 0;
  let withLLMFeatures = 0;
  let withPatternFeatures = 0;
  let lastUpdated: string | null = null;
  let latestVersion: string | null = null;
  
  // Training readiness counters
  let trainingReady = 0;
  let lowFeatureCount = 0;
  let lowQualityScore = 0;
  let missingTextFeatures = 0;
  let lowComponentCount = 0;

  data.forEach(row => {
    // By tier
    const tier = row.performance_tier || 'unknown';
    byTier[tier] = (byTier[tier] || 0) + 1;
    
    // Evaluate training readiness (use database flag if available, otherwise calculate)
    const fc = row.feature_count ?? 0;
    const qs = row.quality_score ?? 0;
    const htf = row.has_text_features ?? false;
    const cs = row.components_succeeded ?? 0;
    
    const isReady = row.training_ready !== undefined && row.training_ready !== null
      ? row.training_ready
      : evaluateTrainingReadiness(fc, qs, htf, cs).isReady;
    
    if (isReady) {
      trainingReady++;
      bySplit['training_ready']++;
    } else {
      bySplit['below_threshold']++;
      
      // Count specific exclusion reasons
      if (fc < TRAINING_THRESHOLDS.minFeatureCount) lowFeatureCount++;
      if (qs < TRAINING_THRESHOLDS.minQualityScore) lowQualityScore++;
      if (!htf) missingTextFeatures++;
      if (cs < TRAINING_THRESHOLDS.minComponentsSucceeded) lowComponentCount++;
    }
    
    // Sums - handle null values
    qualitySum += qs;
    featureCountSum += fc;
    
    // Feature type counts
    if (row.has_text_features) withTextFeatures++;
    if (row.has_ffmpeg_features) withFFmpegFeatures++;
    if (row.has_llm_features) withLLMFeatures++;
    if (row.has_pattern_features) withPatternFeatures++;
    
    if (!lastUpdated || (row.created_at && row.created_at > lastUpdated)) {
      lastUpdated = row.created_at;
    }
    
    if (row.extraction_version) {
      latestVersion = row.extraction_version;
    }
  });

  const total = data.length;
  const belowThreshold = total - trainingReady;

  // Log training readiness summary
  console.log(`[Training Data] ${total} processed, ${trainingReady} training-ready, ${belowThreshold} below threshold`);
  if (belowThreshold > 0) {
    console.log(`  Exclusion breakdown:`);
    console.log(`    - Low feature count (<${TRAINING_THRESHOLDS.minFeatureCount}): ${lowFeatureCount}`);
    console.log(`    - Low quality score (<${Math.round(TRAINING_THRESHOLDS.minQualityScore * 100)}%): ${lowQualityScore}`);
    console.log(`    - Missing text features: ${missingTextFeatures}`);
    console.log(`    - Low component count (<${TRAINING_THRESHOLDS.minComponentsSucceeded}): ${lowComponentCount}`);
  }

  return {
    total,
    trainingReady,
    belowThreshold,
    trainingReadyPercentage: total > 0 ? Math.round((trainingReady / total) * 100) : 0,
    exclusionBreakdown: {
      lowFeatureCount,
      lowQualityScore,
      missingTextFeatures,
      lowComponentCount
    },
    byTier,
    bySplit,
    avgQuality: total > 0 ? qualitySum / total : 0,
    avgCoverage: total > 0 ? (featureCountSum / total / 180) * 100 : 0, // Normalize to 180 target features
    avgFeatureCount: total > 0 ? featureCountSum / total : 0,
    withTranscript: withTextFeatures, // Text features require transcript
    withTextFeatures,
    withFFmpegFeatures,
    withLLMFeatures,
    withPatternFeatures,
    lastUpdated,
    extractionVersion: latestVersion,
    sourceTable: 'training_features',
    thresholds: TRAINING_THRESHOLDS
  };
}

/**
 * Get combined stats for the training pipeline
 */
export async function getTrainingPipelineStats(): Promise<{
  source: Awaited<ReturnType<typeof getVideoSelectionStats>>;
  training: TrainingDataStats;
  readyToProcess: number;
}> {
  const [sourceStats, trainingStats] = await Promise.all([
    getVideoSelectionStats(),
    getTrainingDataStats()
  ]);

  return {
    source: sourceStats,
    training: trainingStats,
    readyToProcess: sourceStats.readyForProcessing
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear all training features (use with caution!)
 * 
 * NOTE: This now clears training_features, not training_data
 */
export async function clearTrainingData(): Promise<{ success: boolean; deleted: number }> {
  const supabase = getSupabase();

  const { count } = await supabase
    .from('training_features')
    .select('*', { count: 'exact', head: true });

  const { error } = await supabase
    .from('training_features')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (error) {
    console.error('Error clearing training_features:', error);
    return { success: false, deleted: 0 };
  }

  return { success: true, deleted: count || 0 };
}

/**
 * Export training data to JSON format from training_features
 */
export async function exportTrainingData(includeOnlyTrainable: boolean = true): Promise<any[]> {
  const supabase = getSupabase();

  let query = supabase
    .from('training_features')
    .select('*');

  if (includeOnlyTrainable) {
    query = query.eq('included_in_training', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error exporting training_features:', error);
    return [];
  }

  return data || [];
}
