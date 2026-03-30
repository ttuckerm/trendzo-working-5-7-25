/**
 * Training Pipeline Module
 * 
 * Unified exports for the training data pipeline.
 * 
 * ARCHITECTURE:
 * 
 *   SCRAPED VIDEOS
 *         │
 *         ├─────────────────────────────────────────┐
 *         │                                         │
 *         ▼                                         ▼
 * ┌───────────────────┐                  ┌───────────────────┐
 * │  FEATURE EXTRACTION │                │  SCRIPT COMPONENT  │
 * │  (for ML Training)  │                │  EXTRACTION        │
 * │                     │                │  (for Script Gen)  │
 * ├───────────────────┤                  ├───────────────────┤
 * │ • Text features    │                 │ • Hook text        │
 * │ • FFmpeg features  │                 │ • Context text     │
 * │ • LLM scores       │                 │ • Value text       │
 * │ • Pattern flags    │                 │ • CTA text         │
 * └─────────┬─────────┘                  │ • Structure types  │
 *           │                            └─────────┬─────────┘
 *           ▼                                      │
 *     training_data                                ▼
 *        table                             script_components
 *           │                                   table
 *           ▼                                      │
 *      XGBoost                                     ▼
 *      Training                            Script Generator
 * 
 * USAGE:
 * 
 * // Extract training features
 * import { extractTrainingFeatures, EnhancedExtractionOptions } from '@/lib/services/training';
 * const features = await extractTrainingFeatures(video, { includeFFmpeg: true });
 * 
 * // Extract FFmpeg features separately
 * import { extractFFmpegTrainingFeatures } from '@/lib/services/training';
 * const ffmpegFeatures = await extractFFmpegTrainingFeatures(videoPath);
 * 
 * // Segment transcript
 * import { segmentTranscriptByTimestamps, segmentTranscriptByEstimation } from '@/lib/services/training';
 * const segments = segmentTranscriptByTimestamps(whisperWords, duration);
 * 
 * // Score with LLM
 * import { scoreWithLLM, ScriptInput } from '@/lib/services/training';
 * const scores = await scoreWithLLM(scriptInput);
 */

// ============================================================================
// FEATURE EXTRACTION
// ============================================================================

export {
  extractTrainingFeatures,
  extractTrainingFeaturesBatch,
  getFeatureMetadata,
  type ExtractedFeatures,
  type FeatureExtractionInput,
  type EnhancedExtractionOptions,
  type PatternExtractionData,
} from './feature-extractor';

// ============================================================================
// FFMPEG FEATURES
// ============================================================================

export {
  extractFFmpegTrainingFeatures,
  extractFFmpegFeaturesBatch,
  getFFmpegFeatureMetadata,
  getDefaultFFmpegFeatures,
  type FFmpegTrainingFeatures,
  type FFmpegExtractionResult,
} from './ffmpeg-training-features';

// ============================================================================
// TRANSCRIPT SEGMENTATION
// ============================================================================

export {
  segmentTranscriptByTimestamps,
  segmentTranscriptByEstimation,
  HOOK_END,
  CONTEXT_END,
  CTA_DURATION,
  MAX_HOOK_WORDS,
  MAX_CTA_WORDS,
  CTA_ACTION_VERBS,
  type WhisperWord,
  type TranscriptSegments,
  type SegmentationResult,
} from './transcript-segmentation';

// ============================================================================
// LLM FRAMEWORK SCORING
// ============================================================================

export {
  scoreWithLLM,
  batchScoreWithLLM,
  getDefaultScores,
  getDefaultClassifications,
  type LLMFrameworkScores,
  type StructureClassification,
  type LLMScoringResult,
  type ScriptInput,
} from './llm-framework-scoring';

// ============================================================================
// UNIFIED TRAINING FEATURES (152 features)
// ============================================================================

export {
  extractUnifiedTrainingFeatures,
  getAllFeatureNames,
  TOTAL_FEATURE_COUNT,
  type UnifiedTrainingFeatures,
  type UnifiedExtractionInput,
  type UnifiedExtractionOptions,
  type PatternData,
} from './unified-training-features';

// ============================================================================
// TRAINING DATA POPULATION (reads from training_features)
// ============================================================================

export {
  populateTrainingData,
  getTrainingDataStats,
  getTrainingPipelineStats,
  clearTrainingData,
  exportTrainingData,
  type PopulationResult,
  type PopulationOptions,
  type TrainingDataStats,
} from './training-data-populator';

// ============================================================================
// VIDEO SELECTION (reads from training_features for already processed)
// ============================================================================

export {
  selectVideosForTraining,
  getVideoSelectionStats,
  getVideoById,
  type SelectedVideo,
  type VideoSelectionCriteria,
  type VideoSelectionStats,
} from './video-selector';

// ============================================================================
// TRAINING QUALITY THRESHOLDS
// ============================================================================

export {
  TRAINING_THRESHOLDS,
  LEGACY_FEATURE_THRESHOLD,
  evaluateTrainingReadiness,
  logTrainingReadiness,
  getTrainingReadinessStats,
  getExcludedVideosDetail,
  updateTrainingReadiness,
  reevaluateAllTrainingReadiness,
  getLegacyCleanupStats,
  excludeLegacySamples,
  type TrainingReadinessResult,
  type TrainingReadinessStats,
  type VideoExclusionDetail,
  type LegacyCleanupStats,
} from './training-quality-thresholds';
