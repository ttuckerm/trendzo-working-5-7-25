/**
 * Model Evaluator — XGBoost v7 Prediction Interface
 *
 * Loads the trained v7 model and runs predictions on new feature vectors.
 * Spawns Python subprocess (same pattern as xgboost-virality-service.ts).
 *
 * Input:  A TrainingFeatureVector (matching training_features table columns)
 * Output: Predicted DPS + confidence interval
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

// ============================================================================
// Types
// ============================================================================

/** Feature vector matching training_features table columns */
export interface TrainingFeatureVector {
  // FFmpeg (12)
  ffmpeg_scene_changes?: number | null;
  ffmpeg_cuts_per_second?: number | null;
  ffmpeg_avg_motion?: number | null;
  ffmpeg_color_variance?: number | null;
  ffmpeg_brightness_avg?: number | null;
  ffmpeg_contrast_score?: number | null;
  ffmpeg_resolution_width?: number | null;
  ffmpeg_resolution_height?: number | null;
  ffmpeg_duration_seconds?: number | null;
  ffmpeg_bitrate?: number | null;
  ffmpeg_fps?: number | null;
  ffmpeg_has_audio?: boolean | null;
  // Audio Prosodic (10)
  audio_pitch_mean_hz?: number | null;
  audio_pitch_variance?: number | null;
  audio_pitch_range?: number | null;
  audio_pitch_std_dev?: number | null;
  audio_pitch_contour_slope?: number | null;
  audio_loudness_mean_lufs?: number | null;
  audio_loudness_range?: number | null;
  audio_loudness_variance?: number | null;
  audio_silence_ratio?: number | null;
  audio_silence_count?: number | null;
  // Audio Classifier (4)
  audio_music_ratio?: number | null;
  audio_speech_ratio?: number | null;
  audio_type_encoded?: number | null;
  audio_energy_variance?: number | null;
  // Speaking Rate (6)
  speaking_rate_wpm?: number | null;
  speaking_rate_wpm_variance?: number | null;
  speaking_rate_wpm_acceleration?: number | null;
  speaking_rate_wpm_peak_count?: number | null;
  speaking_rate_fast_segments?: number | null;
  speaking_rate_slow_segments?: number | null;
  // Visual Scene (3)
  visual_scene_count?: number | null;
  visual_avg_scene_duration?: number | null;
  visual_score?: number | null;
  // Thumbnail (5)
  thumb_brightness?: number | null;
  thumb_contrast?: number | null;
  thumb_colorfulness?: number | null;
  thumb_overall_score?: number | null;
  thumb_confidence?: number | null;
  // Hook Scorer (8)
  hook_score?: number | null;
  hook_confidence?: number | null;
  hook_text_score?: number | null;
  hook_audio_score?: number | null;
  hook_visual_score?: number | null;
  hook_pace_score?: number | null;
  hook_tone_score?: number | null;
  hook_type_encoded?: number | null;
  // Text (14)
  text_word_count?: number | null;
  text_sentence_count?: number | null;
  text_question_mark_count?: number | null;
  text_exclamation_count?: number | null;
  text_transcript_length?: number | null;
  text_avg_sentence_length?: number | null;
  text_unique_word_ratio?: number | null;
  text_avg_word_length?: number | null;
  text_syllable_count?: number | null;
  text_flesch_reading_ease?: number | null;
  text_has_cta?: boolean | null;
  text_positive_word_count?: number | null;
  text_negative_word_count?: number | null;
  text_emoji_count?: number | null;
  // Metadata (6)
  meta_duration_seconds?: number | null;
  meta_hashtag_count?: number | null;
  meta_has_viral_hashtag?: boolean | null;
  meta_creator_followers?: number | null;
  meta_creator_followers_log?: number | null;
  meta_words_per_second?: number | null;
}

export interface ModelPrediction {
  predicted_dps: number;
  confidence: number;
  prediction_interval: { lower: number; upper: number };
  model_version: string;
  features_used: number;
  top_contributing_features: Array<{
    name: string;
    value: number;
    importance: number;
  }>;
}

// ============================================================================
// Model metadata cache
// ============================================================================

let cachedFeatureNames: string[] | null = null;
let cachedMetadata: Record<string, any> | null = null;

function getModelDir(): string {
  return path.join(process.cwd(), 'models');
}

function loadFeatureNames(): string[] {
  if (cachedFeatureNames) return cachedFeatureNames;
  const namesPath = path.join(getModelDir(), 'xgboost-v9-features.json');
  if (!fs.existsSync(namesPath)) {
    throw new Error(`v9 feature names not found: ${namesPath}`);
  }
  cachedFeatureNames = JSON.parse(fs.readFileSync(namesPath, 'utf-8'));
  return cachedFeatureNames!;
}

function loadMetadata(): Record<string, any> {
  if (cachedMetadata) return cachedMetadata;
  const metaPath = path.join(getModelDir(), 'xgboost-v9-metadata.json');
  if (!fs.existsSync(metaPath)) {
    throw new Error(`v9 metadata not found: ${metaPath}`);
  }
  cachedMetadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  return cachedMetadata!;
}

// ============================================================================
// Feature vector conversion
// ============================================================================

/**
 * Convert a TrainingFeatureVector into the ordered numeric array
 * that the model expects (matching the feature names from training).
 */
function vectorToArray(features: TrainingFeatureVector): number[] {
  const featureNames = loadFeatureNames();
  const record = features as Record<string, any>;

  return featureNames.map((name) => {
    const val = record[name];
    if (val === null || val === undefined || (typeof val === 'number' && isNaN(val))) {
      return 0; // Missing → 0 (matches training imputation)
    }
    if (typeof val === 'boolean') {
      return val ? 1 : 0;
    }
    return Number(val) || 0;
  });
}

// ============================================================================
// Prediction
// ============================================================================

/**
 * Run DPS prediction on a feature vector using the trained v7 model.
 * Spawns predict-xgboost.py as a subprocess with MODEL_VERSION=xgb_v7.
 */
export async function predictDPS(
  features: TrainingFeatureVector,
): Promise<ModelPrediction> {
  const featureNames = loadFeatureNames();
  const featureArray = vectorToArray(features);

  // Count non-zero features for confidence
  const nonZero = featureArray.filter((v) => v !== 0).length;
  const featureCoverage = nonZero / featureArray.length;

  // Write feature vector to temp file
  const tempFile = path.join(
    os.tmpdir(),
    `trendzo_v7_predict_${Date.now()}.json`,
  );
  fs.writeFileSync(
    tempFile,
    JSON.stringify({ features: featureArray }),
    'utf-8',
  );

  try {
    const { stdout } = await execAsync(
      `python scripts/predict-xgboost.py "${tempFile}"`,
      {
        timeout: 15000,
        cwd: process.cwd(),
        env: { ...process.env, MODEL_VERSION: 'xgb_v7' },
      },
    );

    const result = JSON.parse(stdout.trim());

    if (result.error && !result.prediction) {
      throw new Error(result.error);
    }

    // Build top contributing features from model's response
    const topFeatures = (result.top_features || [])
      .slice(0, 10)
      .map((f: any) => ({
        name: f.name,
        value: f.value,
        importance: f.importance,
      }));

    return {
      predicted_dps: Math.max(0, Math.min(100, result.prediction)),
      confidence: featureCoverage * 0.4 + 0.5, // 0.5–0.9 based on coverage
      prediction_interval: result.prediction_interval || {
        lower: Math.max(0, result.prediction - 15),
        upper: Math.min(100, result.prediction + 15),
      },
      model_version: 'v9',
      features_used: nonZero,
      top_contributing_features: topFeatures,
    };
  } finally {
    // Clean up temp file
    try {
      fs.unlinkSync(tempFile);
    } catch {
      // ignore cleanup errors
    }
  }
}

/**
 * Check if the v7 model is available and loadable.
 */
export function isV9ModelAvailable(): boolean {
  const modelDir = getModelDir();
  return (
    fs.existsSync(path.join(modelDir, 'xgboost-v9-model.json')) &&
    fs.existsSync(path.join(modelDir, 'xgboost-v9-scaler.json')) &&
    fs.existsSync(path.join(modelDir, 'xgboost-v9-features.json'))
  );
}

/**
 * Get model metadata (training stats, performance, etc.)
 */
export function getV9ModelInfo(): {
  version: string;
  featureCount: number;
  trainedAt: string;
  testSpearman: number;
  testMAE: number;
  tierAccuracy: number;
  datasetSize: number;
} {
  const meta = loadMetadata();
  return {
    version: meta.model_version,
    featureCount: meta.feature_count,
    trainedAt: meta.trained_at,
    testSpearman: meta.performance?.test?.spearman_rho ?? 0,
    testMAE: meta.performance?.test?.mae ?? 0,
    tierAccuracy: meta.performance?.test?.tier_accuracy_pct ?? 0,
    datasetSize: meta.dataset?.total_rows ?? 0,
  };
}
