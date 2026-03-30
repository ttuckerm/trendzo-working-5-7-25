/**
 * Benchmark Runner
 *
 * Evaluates the current XGBoost model against a fixed set of benchmark videos.
 * Reads pre-extracted features from training_features table (Option A)
 * and runs them through the XGBoost inference engine.
 *
 * Computes: Spearman rho, MAE, within-5%, within-10%, tier accuracy.
 */

import { predictXGBoostV10, type XGBoostPredictionResult } from '@/lib/prediction/xgboost-inference';
import { VPS_TIERS } from '@/lib/prediction/system-registry';
import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BenchmarkVideo {
  id: string;
  video_id: string;
  actual_dps: number;
  niche: string;
  transcript_text: string | null;
  caption: string | null;
  hashtags: string[] | null;
  creator_followers: number | null;
  duration_seconds: number | null;
}

export interface VideoPrediction {
  video_id: string;
  actual_dps: number;
  predicted_vps: number;
  error: number;
  tier_match: boolean;
  actual_tier: string;
  predicted_tier: string;
  features_provided: number;
  features_total: number;
}

export interface EvaluationRunResult {
  model_version: string;
  run_at: string;
  spearman_rho: number;
  mae: number;
  within_5_pct: number;
  within_10_pct: number;
  tier_accuracy_pct: number;
  predictions: VideoPrediction[];
  feature_importance_top10: Array<{ feature: string; importance: number }>;
  notes: string;
}

// ─── Tier Classification ────────────────────────────────────────────────────

function getVpsTier(score: number): string {
  for (const tier of VPS_TIERS) {
    if (score >= tier.minScore) return tier.label;
  }
  return VPS_TIERS[VPS_TIERS.length - 1].label;
}

// ─── Statistical Functions ──────────────────────────────────────────────────

function assignRanks(arr: number[]): number[] {
  const n = arr.length;
  const indexed = arr.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);

  const ranks = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n - 1 && indexed[j + 1].v === indexed[i].v) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].i] = avgRank;
    }
    i = j + 1;
  }
  return ranks;
}

function spearmanRho(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;

  const rx = assignRanks(x);
  const ry = assignRanks(y);

  const meanRx = rx.reduce((s, v) => s + v, 0) / n;
  const meanRy = ry.reduce((s, v) => s + v, 0) / n;

  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = rx[i] - meanRx;
    const dy = ry[i] - meanRy;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  return denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : 0;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// ─── XGBoost Feature Names ──────────────────────────────────────────────────
// All features fetched from training_features table for benchmark evaluation.
// The inference engine (v9) picks the 51 it needs from this superset.

const XGBOOST_BENCHMARK_FEATURES = [
  'ffmpeg_scene_changes', 'ffmpeg_cuts_per_second', 'ffmpeg_avg_motion',
  'ffmpeg_color_variance', 'ffmpeg_brightness_avg', 'ffmpeg_contrast_score',
  'ffmpeg_resolution_width', 'ffmpeg_resolution_height', 'ffmpeg_duration_seconds',
  'ffmpeg_bitrate', 'ffmpeg_fps', 'ffmpeg_has_audio',
  'audio_pitch_mean_hz', 'audio_pitch_variance', 'audio_pitch_range',
  'audio_pitch_std_dev', 'audio_pitch_contour_slope',
  'audio_loudness_mean_lufs', 'audio_loudness_range', 'audio_loudness_variance',
  'audio_silence_ratio', 'audio_silence_count',
  'audio_music_ratio', 'audio_speech_ratio', 'audio_type_encoded', 'audio_energy_variance',
  'speaking_rate_wpm', 'speaking_rate_wpm_variance', 'speaking_rate_wpm_acceleration',
  'speaking_rate_wpm_peak_count', 'speaking_rate_fast_segments', 'speaking_rate_slow_segments',
  'visual_scene_count', 'visual_avg_scene_duration', 'visual_score',
  'thumb_brightness', 'thumb_contrast', 'thumb_colorfulness',
  'thumb_overall_score', 'thumb_confidence',
  'hook_score', 'hook_confidence', 'hook_text_score', 'hook_audio_score',
  'hook_visual_score', 'hook_pace_score', 'hook_tone_score', 'hook_type_encoded',
  'text_word_count', 'text_sentence_count', 'text_question_mark_count',
  'text_exclamation_count', 'text_transcript_length', 'text_avg_sentence_length',
  'text_unique_word_ratio', 'text_avg_word_length', 'text_syllable_count',
  'text_flesch_reading_ease', 'text_has_cta',
  'text_positive_word_count', 'text_negative_word_count', 'text_emoji_count',
  'meta_duration_seconds', 'meta_hashtag_count', 'meta_has_viral_hashtag',
  'meta_creator_followers', 'meta_creator_followers_log', 'meta_words_per_second',
  // v9 validated features
  'text_overlay_density', 'visual_proof_ratio', 'vocal_confidence_composite',
];

// ─── Main Runner ────────────────────────────────────────────────────────────

/**
 * Run a full evaluation of the current XGBoost model against all benchmark videos.
 */
export async function runBenchmarkEvaluation(
  supabase: SupabaseClient,
  notes: string,
): Promise<EvaluationRunResult> {
  console.log('[BenchmarkRunner] Starting evaluation');

  // 1. Load benchmark videos
  const { data: benchmarks, error: benchErr } = await supabase
    .from('evaluation_benchmarks')
    .select('*');

  if (benchErr) throw new Error(`Failed to load benchmarks: ${benchErr.message}`);
  if (!benchmarks || benchmarks.length === 0) throw new Error('No benchmark videos found. Run the population query first.');

  const videoIds = benchmarks.map((b: BenchmarkVideo) => b.video_id);

  // 2. Load pre-extracted training features (Option A)
  const { data: features, error: featErr } = await supabase
    .from('training_features')
    .select('*')
    .in('video_id', videoIds);

  if (featErr) throw new Error(`Failed to load training features: ${featErr.message}`);

  const featureMap = new Map<string, Record<string, any>>();
  for (const row of (features || [])) {
    featureMap.set(row.video_id, row);
  }

  // 3. Run predictions
  const predictions: VideoPrediction[] = [];

  for (const benchmark of benchmarks as BenchmarkVideo[]) {
    const featureRow = featureMap.get(benchmark.video_id);

    // Build feature object from training_features columns
    const featureValues: Record<string, number | boolean | null> = {};

    for (const fname of XGBOOST_BENCHMARK_FEATURES) {
      if (featureRow && featureRow[fname] !== undefined && featureRow[fname] !== null) {
        const val = featureRow[fname];
        // Convert boolean columns
        if (typeof val === 'boolean') {
          featureValues[fname] = val;
        } else {
          featureValues[fname] = Number(val);
        }
      } else {
        featureValues[fname] = null; // Will be filled with training mean
      }
    }

    let result: XGBoostPredictionResult;
    try {
      result = predictXGBoostV10(featureValues);
    } catch (err: any) {
      console.error(`[BenchmarkRunner] XGBoost failed for ${benchmark.video_id}: ${err.message}`);
      continue;
    }

    const actualDps = Number(benchmark.actual_dps);
    const predictedVps = result.vps;
    const error = predictedVps - actualDps;
    const actualTier = getVpsTier(actualDps);
    const predictedTier = getVpsTier(predictedVps);

    predictions.push({
      video_id: benchmark.video_id,
      actual_dps: actualDps,
      predicted_vps: predictedVps,
      error: round4(error),
      tier_match: actualTier === predictedTier,
      actual_tier: actualTier,
      predicted_tier: predictedTier,
      features_provided: result.features_provided,
      features_total: result.features_total,
    });
  }

  if (predictions.length === 0) throw new Error('No predictions were produced. Check training_features data.');

  // 4. Compute metrics
  const actualArr = predictions.map(p => p.actual_dps);
  const predictedArr = predictions.map(p => p.predicted_vps);

  const rho = spearmanRho(predictedArr, actualArr);

  let totalAbsError = 0;
  let within5 = 0;
  let within10 = 0;
  let tierMatches = 0;

  for (const p of predictions) {
    const absError = Math.abs(p.error);
    totalAbsError += absError;
    if (absError <= 5) within5++;
    if (absError <= 10) within10++;
    if (p.tier_match) tierMatches++;
  }

  const n = predictions.length;
  const mae = totalAbsError / n;
  const within5Pct = (within5 / n) * 100;
  const within10Pct = (within10 / n) * 100;
  const tierAccuracyPct = (tierMatches / n) * 100;

  // 5. Get feature importance (from scaler file which has feature names)
  // The XGBoost model doesn't store importance in JSON tree format easily,
  // so we derive a proxy: count how often each feature is used as a split.
  const featureImportance = computeFeatureImportanceFromTrees();

  const runAt = new Date().toISOString();

  const result: EvaluationRunResult = {
    model_version: 'xgboost-v10',
    run_at: runAt,
    spearman_rho: round4(rho),
    mae: round4(mae),
    within_5_pct: round4(within5Pct),
    within_10_pct: round4(within10Pct),
    tier_accuracy_pct: round4(tierAccuracyPct),
    predictions,
    feature_importance_top10: featureImportance.slice(0, 10),
    notes,
  };

  // 6. Save to evaluation_runs
  const { error: insertErr } = await supabase
    .from('evaluation_runs')
    .insert({
      model_version: result.model_version,
      run_at: result.run_at,
      spearman_rho: result.spearman_rho,
      mae: result.mae,
      within_5_pct: result.within_5_pct,
      within_10_pct: result.within_10_pct,
      tier_accuracy_pct: result.tier_accuracy_pct,
      notes: result.notes,
      feature_importance_top10: result.feature_importance_top10,
      predictions: result.predictions,
    });

  if (insertErr) {
    console.error(`[BenchmarkRunner] Failed to save run: ${insertErr.message}`);
    throw new Error(`Failed to save evaluation run: ${insertErr.message}`);
  }

  console.log(
    `[BenchmarkRunner] Complete: n=${n}, rho=${result.spearman_rho}, ` +
    `MAE=${result.mae}, within10=${result.within_10_pct}%, tierAcc=${result.tier_accuracy_pct}%`,
  );

  return result;
}

/**
 * Compute feature importance by counting split usage across all trees.
 * This is a proxy for gain-based importance but works from the JSON format.
 */
function computeFeatureImportanceFromTrees(): Array<{ feature: string; importance: number }> {
  try {
    const { readFileSync } = require('fs');
    const { join } = require('path');

    const modelsDir = join(process.cwd(), 'models');
    const model = JSON.parse(readFileSync(join(modelsDir, 'xgboost-v10-model.json'), 'utf-8'));
    const featureNames: string[] = JSON.parse(readFileSync(join(modelsDir, 'xgboost-v10-features.json'), 'utf-8'));

    const trees = model.learner.gradient_booster.model.trees;
    const splitCounts = new Map<number, number>();

    for (const tree of trees) {
      for (let i = 0; i < tree.split_indices.length; i++) {
        // Only count non-leaf nodes (leaf nodes have left_children = -1)
        if (tree.left_children[i] !== -1) {
          const idx = tree.split_indices[i];
          splitCounts.set(idx, (splitCounts.get(idx) || 0) + 1);
        }
      }
    }

    const totalSplits = Array.from(splitCounts.values()).reduce((s, v) => s + v, 0);
    if (totalSplits === 0) return [];

    const importance: Array<{ feature: string; importance: number }> = [];
    for (const [idx, count] of splitCounts) {
      if (idx < featureNames.length) {
        importance.push({
          feature: featureNames[idx],
          importance: round4(count / totalSplits),
        });
      }
    }

    importance.sort((a, b) => b.importance - a.importance);
    return importance;
  } catch (err: any) {
    console.error(`[BenchmarkRunner] Could not compute feature importance: ${err.message}`);
    return [];
  }
}
