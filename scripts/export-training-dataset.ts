#!/usr/bin/env npx tsx
/**
 * Export Training Dataset
 *
 * Pulls training_ready rows from prediction_runs_enriched VIEW,
 * reconstructs the 42 XGBoost features from stored component results,
 * and writes TWO CSVs:
 *   - Training CSV:  rows with feature_coverage_ratio >= 25%
 *   - Excluded CSV:  rows with coverage < 25% (debug report)
 *
 * Run:
 *   npx tsx scripts/export-training-dataset.ts
 *   npx tsx scripts/export-training-dataset.ts --niche gaming
 *   npx tsx scripts/export-training-dataset.ts --niche side-hustles --split 0.2
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import {
  classifyLabelCategory,
  computeLabelBreakdown,
} from '../src/lib/training/training-eligibility';

// ── Load env ──────────────────────────────────────────────────────────────────
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ── The 42 XGBoost feature names ──────────────────────────────────────────────
// Grouped: FFmpeg (14) + Text (7) + Component preds (18) + LLM (2) + Quality (1) = 42

const XGBOOST_V5_FEATURES = [
  // FFmpeg (14)
  'duration_seconds',
  'resolution_width',
  'resolution_height',
  'fps',
  'motion_score',
  'has_faces',
  'face_time_ratio',
  'has_music',
  'avg_volume',
  'brightness_avg',
  'contrast_ratio',
  'saturation_avg',
  'visual_complexity',
  'hook_scene_changes',
  // Text (7)
  'text_word_count',
  'text_char_count',
  'text_sentence_count',
  'text_avg_word_length',
  'text_question_count',
  'text_exclamation_count',
  'text_hashtag_count',
  // Component predictions (18)
  'hook_scorer_pred',
  'hook_scorer_conf',
  '7_legos_pred',
  '7_legos_conf',
  '9_attributes_pred',
  '9_attributes_conf',
  '24_styles_pred',
  '24_styles_conf',
  'niche_keywords_pred',
  'niche_keywords_conf',
  'virality_matrix_pred',
  'virality_matrix_conf',
  'pattern_extraction_pred',
  'pattern_extraction_conf',
  'trend_timing_pred',
  'trend_timing_conf',
  'posting_time_pred',
  'posting_time_conf',
  // LLM (2)
  'gpt4_score',
  'claude_score',
  // Data quality (1) — fraction of the above 41 features that are non-null
  'feature_coverage_ratio',
] as const;

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_FEATURE_COVERAGE = 0.25; // Exclude rows below 25% coverage

// ── Types ─────────────────────────────────────────────────────────────────────

interface ComponentRow {
  run_id: string;
  component_id: string;
  success: boolean;
  prediction: number | null;
  confidence: number | null;
  features: Record<string, any> | null;
}

// ── Feature reconstruction ────────────────────────────────────────────────────

/**
 * Reconstruct the 42 XGBoost features from stored component results.
 *
 * Strategy:
 * 1. FFmpeg features → from ffmpeg component `features` JSONB
 * 2. Text features → from feature-extraction or raw_result transcript data
 * 3. Component preds → from individual component prediction/confidence in run_component_results
 * 4. LLM scores → from gpt4/claude component predictions
 * 5. feature_coverage_ratio → computed from non-null count of 1-4
 */
function reconstructFeatures(
  components: ComponentRow[],
  rawResult: any,
): Record<string, number | string | null> {
  const feat: Record<string, number | string | null> = {};

  // Index components by ID
  const byId = new Map<string, ComponentRow>();
  for (const c of components) byId.set(c.component_id, c);

  // ── 1. FFmpeg features ─────────────────────────────────────────────────────
  // Primary source: dedicated 'ffmpeg' component (exists on 13/28 runs)
  const ffmpeg = byId.get('ffmpeg');
  if (ffmpeg?.features) {
    const f = ffmpeg.features;
    feat.duration_seconds = f.duration ?? f.duration_seconds ?? null;
    feat.resolution_width = f.width ?? f.resolution_width ?? null;
    feat.resolution_height = f.height ?? f.resolution_height ?? null;
    feat.fps = f.fps ?? null;
    feat.motion_score = f.motionScore ?? f.motion_score ?? null;
    feat.has_faces = f.hasFaces ?? f.has_faces ?? null;
    feat.face_time_ratio = f.faceTimeRatio ?? f.face_time_ratio ?? null;
    feat.has_music = f.hasMusic ?? f.has_music ?? (f.hasAudio ? 1 : null);
    feat.avg_volume = f.avgVolume ?? f.avg_volume ?? null;
    feat.brightness_avg = f.avgBrightness ?? f.brightness_avg ?? null;
    feat.contrast_ratio = f.contrastRatio ?? f.contrast_ratio ?? null;
    feat.saturation_avg = f.saturationAvg ?? f.saturation_avg ?? null;
    feat.visual_complexity = f.visualComplexity ?? f.visual_complexity ?? null;
    feat.hook_scene_changes = f.hookSceneChanges ?? f.hook_scene_changes ?? f.sceneChanges ?? null;
  }

  // ── 2. Text features ───────────────────────────────────────────────────────
  // Primary source: direct properties on feature-extraction.features
  const featureExtraction = byId.get('feature-extraction');
  if (featureExtraction?.features) {
    const f = featureExtraction.features;
    feat.text_word_count = f.text_word_count ?? f.word_count ?? null;
    feat.text_char_count = f.text_char_count ?? f.char_count ?? null;
    feat.text_sentence_count = f.text_sentence_count ?? f.sentence_count ?? null;
    feat.text_avg_word_length = f.text_avg_word_length ?? f.avg_word_length ?? null;
    feat.text_question_count = f.text_question_count ?? f.question_count ?? null;
    feat.text_exclamation_count = f.text_exclamation_count ?? f.exclamation_count ?? null;
    feat.text_hashtag_count = f.text_hashtag_count ?? f.hashtag_count ?? null;
  }

  // ── 2b. CRITICAL FALLBACK: feature-extraction nested features map ─────────
  // The feature-extraction component stores ALL extracted features (FFmpeg, text,
  // LLM, pattern) in a nested `features.features` JSONB object with 123 keys.
  // This exists on ALL completed runs and is the canonical source when the
  // dedicated `ffmpeg` component row doesn't exist.
  // Field naming: ffmpeg_duration, ffmpeg_fps, word_count, char_count, etc.
  const nestedFeatures = featureExtraction?.features?.features;
  if (nestedFeatures && typeof nestedFeatures === 'object') {
    const nf = nestedFeatures as Record<string, any>;
    // FFmpeg features (fill gaps from dedicated ffmpeg component)
    feat.duration_seconds ??= nf.ffmpeg_duration ?? nf.duration_seconds ?? null;
    feat.resolution_width ??= nf.ffmpeg_resolution_width ?? nf.resolution_width ?? null;
    feat.resolution_height ??= nf.ffmpeg_resolution_height ?? nf.resolution_height ?? null;
    feat.fps ??= nf.ffmpeg_fps ?? nf.fps ?? null;
    feat.motion_score ??= nf.ffmpeg_avg_motion ?? nf.motion_score ?? null;
    feat.has_faces ??= nf.has_faces ?? null;
    feat.face_time_ratio ??= nf.face_time_ratio ?? null;
    feat.has_music ??= nf.ffmpeg_has_audio ?? nf.has_music ?? null;
    feat.avg_volume ??= nf.avg_volume ?? null;
    feat.brightness_avg ??= nf.ffmpeg_brightness_avg ?? nf.brightness_avg ?? null;
    feat.contrast_ratio ??= nf.ffmpeg_contrast_score ?? nf.contrast_ratio ?? null;
    feat.saturation_avg ??= nf.ffmpeg_color_variance ?? nf.saturation_avg ?? null;
    feat.visual_complexity ??= nf.visual_complexity ?? nf.complexity_score ?? null;
    feat.hook_scene_changes ??= nf.ffmpeg_scene_changes ?? nf.hook_scene_changes ?? null;
    // Text features (fill gaps from direct properties)
    feat.text_word_count ??= nf.word_count ?? nf.text_word_count ?? null;
    feat.text_char_count ??= nf.char_count ?? nf.text_char_count ?? null;
    feat.text_sentence_count ??= nf.sentence_count ?? nf.text_sentence_count ?? null;
    feat.text_avg_word_length ??= nf.avg_word_length ?? nf.text_avg_word_length ?? null;
    feat.text_question_count ??= nf.question_mark_count ?? nf.text_question_count ?? null;
    feat.text_exclamation_count ??= nf.exclamation_mark_count ?? nf.text_exclamation_count ?? null;
    feat.text_hashtag_count ??= nf.hashtag_count ?? nf.text_hashtag_count ?? null;
  }

  // Fallback: xgboost component's top_contributing_features
  const xgb = byId.get('xgboost-virality-ml');
  if (xgb?.features?.top_contributing_features) {
    for (const tcf of xgb.features.top_contributing_features) {
      if (XGBOOST_V5_FEATURES.includes(tcf.feature) && feat[tcf.feature] == null) {
        feat[tcf.feature] = tcf.value;
      }
    }
  }

  // ── 3. Component predictions ───────────────────────────────────────────────
  const compPredMap: Record<string, { pred: string; conf: string }> = {
    'hook-scorer': { pred: 'hook_scorer_pred', conf: 'hook_scorer_conf' },
    '7-legos': { pred: '7_legos_pred', conf: '7_legos_conf' },
    '9-attributes': { pred: '9_attributes_pred', conf: '9_attributes_conf' },
    '24-styles': { pred: '24_styles_pred', conf: '24_styles_conf' },
    'niche-keywords': { pred: 'niche_keywords_pred', conf: 'niche_keywords_conf' },
    'virality-matrix': { pred: 'virality_matrix_pred', conf: 'virality_matrix_conf' },
    'pattern-extraction': { pred: 'pattern_extraction_pred', conf: 'pattern_extraction_conf' },
    'trend-timing': { pred: 'trend_timing_pred', conf: 'trend_timing_conf' },
    'posting-time': { pred: 'posting_time_pred', conf: 'posting_time_conf' },
  };

  for (const [compId, mapping] of Object.entries(compPredMap)) {
    const comp = byId.get(compId);
    if (comp) {
      feat[mapping.pred] = comp.prediction ?? null;
      feat[mapping.conf] = comp.confidence ?? null;
    }
  }

  // ── 4. LLM scores ─────────────────────────────────────────────────────────
  const gpt4 = byId.get('gpt4');
  feat.gpt4_score = gpt4?.prediction ?? null;

  const claude = byId.get('claude');
  feat.claude_score = claude?.prediction ?? null;

  // ── 4b. Fallback: LLM & component scores from feature-extraction ─────────
  // feature-extraction stores LLM proxy scores as llm_hook_quality, llm_seven_legos, etc.
  if (nestedFeatures && typeof nestedFeatures === 'object') {
    const nf = nestedFeatures as Record<string, any>;
    // These are 0-1 scaled proxy scores from the feature-extraction LLM pass.
    // They are less precise than dedicated component predictions but provide
    // non-null signal for runs that never ran the full component suite.
    if (feat.hook_scorer_pred == null && nf.llm_hook_quality != null) {
      feat.hook_scorer_pred = Math.round((nf.llm_hook_quality as number) * 100 * 100) / 100;
    }
    if (feat['7_legos_pred'] == null && nf.llm_seven_legos != null) {
      feat['7_legos_pred'] = Math.round((nf.llm_seven_legos as number) * 100 * 100) / 100;
    }
    if (feat['9_attributes_pred'] == null && nf.llm_nine_attributes != null) {
      feat['9_attributes_pred'] = Math.round((nf.llm_nine_attributes as number) * 100 * 100) / 100;
    }
    if (feat.niche_keywords_pred == null && nf.niche_alignment != null) {
      feat.niche_keywords_pred = Math.round((nf.niche_alignment as number) * 100 * 100) / 100;
    }
  }

  // Fill any missing features with null (NOT zero — callers decide how to handle)
  for (const name of XGBOOST_V5_FEATURES) {
    if (feat[name] === undefined) feat[name] = null;
  }

  // ── 5. Data quality: fraction of the 41 base features that are non-null ───
  const baseFeatureCount = XGBOOST_V5_FEATURES.length - 1; // exclude coverage_ratio itself
  let nonNullCount = 0;
  for (const name of XGBOOST_V5_FEATURES) {
    if (name === 'feature_coverage_ratio') continue;
    if (feat[name] != null) nonNullCount++;
  }
  feat.feature_coverage_ratio = Math.round((nonNullCount / baseFeatureCount) * 10000) / 10000;

  // ── 6. Prosodic features (Batch B — supplementary for v6 XGBoost) ─────────
  // These are NOT part of the v5 42-feature set but will be available for v6 retrain.
  const audioComp = byId.get('audio-analyzer');
  if (audioComp?.features) {
    const af = audioComp.features;
    // Pitch features
    feat.pitch_range = af.pitchRange ?? null;
    feat.pitch_variance = af.pitchVariance ?? null;
    feat.pitch_contour_slope = af.pitchContourSlope ?? null;
    // Speaking rate features
    feat.wpm_mean = af.wpmMean ?? null;
    feat.wpm_variance = af.wpmVariance ?? null;
    feat.wpm_acceleration = af.wpmAcceleration ?? null;
    // Volume dynamics features
    feat.loudness_range = af.loudnessRange ?? null;
    feat.loudness_variance = af.loudnessVariance ?? null;
    feat.loudness_rate_of_change = af.loudnessRateOfChange ?? null;
    // Silence pattern (encoded as numeric: rhythmic=1, minimal=2, scattered=3, front_loaded=4, back_loaded=5)
    const silencePatternMap: Record<string, number> = {
      'rhythmic': 1, 'minimal': 2, 'scattered': 3, 'front-loaded': 4, 'back-loaded': 5,
    };
    feat.silence_pattern = af.silencePattern ? (silencePatternMap[af.silencePattern] ?? null) : null;
    // Sound profile features
    feat.music_ratio = af.musicRatio ?? null;
    // Audio type (encoded: speech-only=1, music-only=2, speech-over-music=3, mixed=4, silent=5)
    const audioTypeMap: Record<string, number> = {
      'speech-only': 1, 'music-only': 2, 'speech-over-music': 3, 'mixed': 4, 'silent': 5,
    };
    feat.audio_type = af.audioType ? (audioTypeMap[af.audioType] ?? null) : null;
    // Audio fingerprint (text, not numeric — for sound cluster correlation)
    feat.audio_fingerprint = af.audioFingerprint ?? null;
  }

  return feat;
}

// ── Build component_preds JSON ────────────────────────────────────────────────

function buildComponentPreds(components: ComponentRow[]): string {
  const map: Record<string, { prediction: number | null; confidence: number | null }> = {};
  for (const c of components) {
    if (c.success) {
      map[c.component_id] = { prediction: c.prediction, confidence: c.confidence };
    }
  }
  return JSON.stringify(map);
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function csvEscape(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// ── CLI arg helper ────────────────────────────────────────────────────────────

function getCliArg(flag: string): string | undefined {
  const args = process.argv.slice(2);
  // --flag=value
  const eq = args.find(a => a.startsWith(`${flag}=`));
  if (eq) return eq.split('=')[1];
  // --flag value
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export async function exportTrainingDataset(opts?: {
  splitPercent?: number; // 0-1, take only the most recent (splitPercent) rows
  outputPath?: string;
  niche?: string;        // defaults to 'side-hustles'
}): Promise<{ rowCount: number; outputPath: string; excludedCount: number; excludedPath: string | null }> {
  const splitPercent = opts?.splitPercent ?? 0; // 0 = all rows
  const niche = (opts?.niche ?? 'side-hustles').toLowerCase().replace(/_/g, '-');

  console.log('╔══════════════════════════════════════════════════╗');
  console.log(`║  Training Dataset Export — ${niche.padEnd(22)}║`);
  console.log('╚══════════════════════════════════════════════════╝\n');

  // 1. Pull ONLY training_label_eligible v2 rows from enriched view.
  // Uses training_label_eligible (v2-only) instead of training_ready (which includes legacy).
  const { data: filteredRuns, error: runErr } = await supabase
    .from('prediction_runs_enriched')
    .select(
      'id, video_id, created_at, actual_dps, predicted_dps_7d, transcription_source, raw_result, niche, account_size_band, ' +
      'dps_formula_version, dps_label_trust, dps_training_weight, actual_tier, ' +
      'actual_completion_rate, actual_share_rate, actual_save_rate, ' +
      'actual_velocity_score, actual_view_to_follower_ratio, actual_comment_rate, ' +
      'dps_signal_confidence, dps_cohort_sample_size, dps_threshold_version, ' +
      'dps_within_cohort_percentile, dps_population_percentile, ' +
      'training_label_eligible',
    )
    .eq('training_label_eligible', true)
    .eq('niche', niche)
    .order('created_at', { ascending: true });

  if (runErr) {
    console.error('Failed to fetch prediction_runs_enriched:', runErr.message);
    process.exit(1);
  }

  console.log(`  Found ${(filteredRuns || []).length} v2-eligible ${niche} runs\n`);

  if (!filteredRuns || filteredRuns.length === 0) {
    console.log('  No qualifying rows. Exiting.');
    return { rowCount: 0, outputPath: '', excludedCount: 0, excludedPath: null };
  }

  // Apply split (for eval-set export)
  let selectedRuns = filteredRuns;
  if (splitPercent > 0) {
    const splitIdx = Math.floor(filteredRuns.length * (1 - splitPercent));
    selectedRuns = filteredRuns.slice(splitIdx);
    console.log(`  Eval split: taking last ${selectedRuns.length} of ${filteredRuns.length} rows (${(splitPercent * 100).toFixed(0)}%)\n`);
  }

  // 2. Pull all component results for these runs
  const runIds = selectedRuns.map(r => r.id);
  const { data: allComponents, error: compErr } = await supabase
    .from('run_component_results')
    .select('run_id, component_id, success, prediction, confidence, features')
    .in('run_id', runIds);

  if (compErr) {
    console.error('Failed to fetch run_component_results:', compErr.message);
    process.exit(1);
  }

  // Group components by run_id
  const compsByRun = new Map<string, ComponentRow[]>();
  for (const c of allComponents || []) {
    if (!compsByRun.has(c.run_id)) compsByRun.set(c.run_id, []);
    compsByRun.get(c.run_id)!.push(c);
  }

  // Log v2 label breakdown
  const labelBreakdown = computeLabelBreakdown(selectedRuns);
  console.log(`  Label breakdown: ${labelBreakdown.v2_trusted} trusted, ${labelBreakdown.v2_degraded} degraded, ${labelBreakdown.legacy_v1} legacy, ${labelBreakdown.v2_untrusted} untrusted\n`);

  // 3. Build CSV rows, partitioning by coverage
  const v2MetaColumns = [
    'dps_formula_version',
    'dps_label_trust',
    'dps_training_weight',
    'label_category',
    'actual_tier',
    'actual_completion_rate',
    'actual_share_rate',
    'actual_save_rate',
    'actual_velocity_score',
    'actual_view_to_follower_ratio',
    'actual_comment_rate',
    'dps_signal_confidence',
    'dps_cohort_sample_size',
    'dps_threshold_version',
    'dps_within_cohort_percentile',
    'dps_population_percentile',
  ];
  const metaColumns = [
    'run_id',
    'video_id',
    'created_at',
    'account_size',
    'transcription_source',
    'actual_dps',
    'predicted_dps_7d',
    ...v2MetaColumns,
  ];
  const header = [...metaColumns, ...XGBOOST_V5_FEATURES, 'component_preds'].join(',');

  const includedRows: string[] = [header];
  const excludedRows: string[] = [header];

  for (const run of selectedRuns) {
    const components = compsByRun.get(run.id) || [];
    const features = reconstructFeatures(components, run.raw_result);
    const componentPreds = buildComponentPreds(components);
    const coverage = features.feature_coverage_ratio as number;

    const metaValues = [
      run.id,
      run.video_id,
      run.created_at,
      run.account_size_band || '',
      run.transcription_source || '',
      run.actual_dps,
      run.predicted_dps_7d,
      // v2 columns
      run.dps_formula_version ?? '',
      run.dps_label_trust ?? '',
      run.dps_training_weight ?? '',
      classifyLabelCategory(run),
      run.actual_tier ?? '',
      run.actual_completion_rate ?? '',
      run.actual_share_rate ?? '',
      run.actual_save_rate ?? '',
      run.actual_velocity_score ?? '',
      run.actual_view_to_follower_ratio ?? '',
      run.actual_comment_rate ?? '',
      run.dps_signal_confidence ?? '',
      run.dps_cohort_sample_size ?? '',
      run.dps_threshold_version ?? '',
      run.dps_within_cohort_percentile ?? '',
      run.dps_population_percentile ?? '',
    ];

    const featureValues = XGBOOST_V5_FEATURES.map(f => features[f]);
    const csvRow = [...metaValues, ...featureValues, componentPreds].map(csvEscape).join(',');

    if (coverage < MIN_FEATURE_COVERAGE) {
      excludedRows.push(csvRow);
    } else {
      includedRows.push(csvRow);
    }
  }

  // 4. Write training CSV
  const outDir = process.platform === 'win32' ? process.env.TEMP || 'C:\\Temp' : '/tmp';
  const defaultName = splitPercent > 0
    ? `trendzo_${niche}_eval.csv`
    : `trendzo_${niche}_training.csv`;
  const outputPath = opts?.outputPath ?? path.join(outDir, defaultName);

  const trainingCount = includedRows.length - 1; // minus header
  fs.writeFileSync(outputPath, includedRows.join('\n'), 'utf-8');

  const avgCoverage = selectedRuns.length > 0
    ? (includedRows.slice(1).length / selectedRuns.length * 100).toFixed(0)
    : '0';

  console.log(`  ✓ Training CSV: ${trainingCount} rows → ${outputPath}`);
  console.log(`    Columns: ${metaColumns.length} meta + ${XGBOOST_V5_FEATURES.length} features + 1 component_preds`);

  // 5. Write excluded CSV (if any)
  const excludedCount = excludedRows.length - 1;
  let excludedPath: string | null = null;
  if (excludedCount > 0) {
    excludedPath = outputPath.replace('.csv', '_excluded.csv');
    fs.writeFileSync(excludedPath, excludedRows.join('\n'), 'utf-8');
    console.log(`  ⚠ Excluded CSV: ${excludedCount} rows (coverage < ${MIN_FEATURE_COVERAGE * 100}%) → ${excludedPath}`);
  } else {
    console.log(`  ✓ No rows excluded (all above ${MIN_FEATURE_COVERAGE * 100}% coverage)`);
  }

  console.log(`  Pass rate: ${trainingCount}/${selectedRuns.length} (${avgCoverage}%)\n`);

  return { rowCount: trainingCount, outputPath, excludedCount, excludedPath };
}

// ── CLI entry point ───────────────────────────────────────────────────────────
if (require.main === module || process.argv[1]?.endsWith('export-training-dataset.ts')) {
  const cliNiche = getCliArg('--niche');
  const cliSplit = getCliArg('--split');

  exportTrainingDataset({
    niche: cliNiche,
    splitPercent: cliSplit ? parseFloat(cliSplit) : undefined,
  })
    .then(({ rowCount, outputPath }) => {
      console.log(`Done. ${rowCount} rows → ${outputPath}`);
      process.exit(0);
    })
    .catch(err => {
      console.error('Fatal:', err);
      process.exit(1);
    });
}
