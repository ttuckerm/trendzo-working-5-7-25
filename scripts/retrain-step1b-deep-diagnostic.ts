#!/usr/bin/env npx tsx
/**
 * Step 1b: Deep diagnostic — display scores, feature availability, video files
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  STEP 1b: Deep Diagnostic                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Query clean labeled rows with display scores
  const { data: rows, error } = await supabase
    .from('prediction_runs')
    .select(`
      id, video_id, predicted_dps_7d, actual_dps, actual_tier,
      dps_v2_display_score, dps_v2_breakdown,
      dps_formula_version, dps_label_trust, dps_training_weight,
      dps_v2_incomplete, score_version, raw_result
    `)
    .not('actual_dps', 'is', null)
    .neq('dps_v2_incomplete', true);

  if (error) { console.error('Query failed:', error.message); process.exit(1); }

  console.log(`Clean labeled rows: ${rows!.length}\n`);

  // ── Display score analysis ────────────────────────────────────────────────
  console.log('━━━ DISPLAY SCORE (dps_v2_display_score) ━━━');
  let displayScoreCount = 0;
  let displayFromBreakdown = 0;
  const displayScores: number[] = [];

  for (const row of rows!) {
    let ds = (row as any).dps_v2_display_score;
    if (ds != null) {
      displayScoreCount++;
      displayScores.push(Number(ds));
    } else {
      // Try to get from breakdown
      const bd = (row as any).dps_v2_breakdown;
      if (bd?.display_score != null) {
        displayFromBreakdown++;
        displayScores.push(Number(bd.display_score));
      }
    }
  }

  console.log(`  Direct column: ${displayScoreCount}/${rows!.length}`);
  console.log(`  From breakdown JSONB: ${displayFromBreakdown}/${rows!.length - displayScoreCount}`);
  console.log(`  Total with display score: ${displayScores.length}/${rows!.length}\n`);

  if (displayScores.length > 0) {
    displayScores.sort((a, b) => a - b);
    console.log(`  Display score range: ${displayScores[0].toFixed(1)} - ${displayScores[displayScores.length - 1].toFixed(1)}`);
    console.log(`  Median: ${displayScores[Math.floor(displayScores.length / 2)].toFixed(1)}`);
    console.log(`  Mean: ${(displayScores.reduce((s, v) => s + v, 0) / displayScores.length).toFixed(1)}\n`);
  }

  // ── Feature source check ──────────────────────────────────────────────────
  console.log('━━━ FEATURE SOURCES ━━━');

  // Source 1: run_component_results (xgboost features JSONB)
  const runIds = rows!.map((r: any) => r.id);
  const { data: compResults } = await supabase
    .from('run_component_results')
    .select('run_id, component_id, features')
    .in('run_id', runIds);

  // Check ALL component results (not just xgboost)
  const featuresByRun = new Map<string, Record<string, any>>();
  for (const cr of (compResults || [])) {
    if (!cr.features || typeof cr.features !== 'object') continue;
    if (!featuresByRun.has(cr.run_id)) featuresByRun.set(cr.run_id, {});
    const existing = featuresByRun.get(cr.run_id)!;

    // Merge features from this component
    if (cr.component_id === 'ffmpeg' || cr.component_id === 'ffmpeg-canonical') {
      const feats = (cr.features as any).features || cr.features;
      Object.assign(existing, feats);
    } else if (cr.component_id === 'xgboost-virality-ml') {
      // XGBoost stores the full feature vector it received
      const feats = (cr.features as any).features || (cr.features as any).feature_values || cr.features;
      if (feats && typeof feats === 'object') Object.assign(existing, feats);
    } else {
      // Other components — check for nested features
      const feats = (cr.features as any).features || cr.features;
      if (feats && typeof feats === 'object') Object.assign(existing, feats);
    }
  }

  // Count how many of the 58 v10 features each run has
  const V10_FEATURES = [
    'ffmpeg_scene_changes', 'ffmpeg_cuts_per_second', 'ffmpeg_avg_motion',
    'ffmpeg_color_variance', 'ffmpeg_brightness_avg', 'ffmpeg_contrast_score',
    'ffmpeg_resolution_width', 'ffmpeg_resolution_height', 'ffmpeg_duration_seconds',
    'ffmpeg_bitrate', 'ffmpeg_fps',
    'audio_pitch_mean_hz', 'audio_pitch_variance', 'audio_pitch_range',
    'audio_pitch_std_dev', 'audio_pitch_contour_slope',
    'audio_loudness_mean_lufs', 'audio_loudness_range', 'audio_loudness_variance',
    'audio_silence_ratio', 'audio_silence_count',
    'speaking_rate_wpm',
    'visual_scene_count', 'visual_avg_scene_duration', 'visual_score',
    'thumb_brightness', 'thumb_contrast', 'thumb_colorfulness', 'thumb_overall_score',
    'hook_score', 'hook_confidence', 'hook_text_score', 'hook_type_encoded',
    'text_word_count', 'text_sentence_count', 'text_question_mark_count',
    'text_exclamation_count', 'text_transcript_length', 'text_avg_sentence_length',
    'text_unique_word_ratio', 'text_avg_word_length', 'text_syllable_count',
    'text_flesch_reading_ease', 'text_has_cta', 'text_negative_word_count',
    'text_emoji_count',
    'meta_duration_seconds', 'meta_words_per_second',
    'text_overlay_density', 'visual_proof_ratio', 'vocal_confidence_composite',
    'creator_followers_log', 'post_hour_utc', 'post_day_of_week',
    'specificity_score', 'instructional_density', 'has_step_structure', 'hedge_word_density',
  ];

  let fullCoverage = 0;
  let partialCoverage = 0;
  let noCoverage = 0;
  const coverageCounts: number[] = [];

  for (const row of rows!) {
    const feats = featuresByRun.get(row.id) || {};
    const count = V10_FEATURES.filter(f => feats[f] !== undefined && feats[f] !== null).length;
    coverageCounts.push(count);
    if (count >= 50) fullCoverage++;
    else if (count > 0) partialCoverage++;
    else noCoverage++;
  }

  console.log(`\n  From run_component_results:`);
  console.log(`    Full coverage (50+/58): ${fullCoverage}`);
  console.log(`    Partial coverage (1-49/58): ${partialCoverage}`);
  console.log(`    No coverage (0/58): ${noCoverage}`);

  if (coverageCounts.some(c => c > 0)) {
    const nonZero = coverageCounts.filter(c => c > 0);
    console.log(`    Avg features when available: ${(nonZero.reduce((s, v) => s + v, 0) / nonZero.length).toFixed(0)}/58`);
  }

  // Source 2: raw_result.feature_values
  let rawResultFeatures = 0;
  for (const row of rows!) {
    const rr = (row as any).raw_result;
    if (rr?.feature_values && Object.keys(rr.feature_values).length > 10) {
      rawResultFeatures++;
    }
  }
  console.log(`\n  From raw_result.feature_values: ${rawResultFeatures}/${rows!.length}`);

  // Source 3: Video files on disk
  const videoIds = rows!.map((r: any) => r.video_id);
  const { data: videoFiles } = await supabase
    .from('video_files')
    .select('id, storage_path, tiktok_url, niche')
    .in('id', videoIds);

  let filesOnDisk = 0;
  let filesNotFound = 0;
  const missingVideos: string[] = [];

  for (const vf of (videoFiles || [])) {
    if (vf.storage_path) {
      const fullPath = path.resolve(process.cwd(), vf.storage_path);
      if (fs.existsSync(fullPath)) {
        filesOnDisk++;
      } else {
        filesNotFound++;
        missingVideos.push(vf.id);
      }
    } else {
      filesNotFound++;
      missingVideos.push(vf.id);
    }
  }

  console.log(`\n  Video files on disk: ${filesOnDisk}/${rows!.length}`);
  console.log(`  Video files missing: ${filesNotFound}/${rows!.length}`);

  // ── Summary: which rows can we train on? ──────────────────────────────────
  console.log('\n━━━ TRAINABLE ROWS SUMMARY ━━━');

  let trainable = 0;
  const featureSource: Record<string, number> = { component_results: 0, raw_result: 0, re_extract: 0, none: 0 };

  for (const row of rows!) {
    // Need display score as target
    let hasTarget = false;
    if ((row as any).dps_v2_display_score != null) hasTarget = true;
    else if ((row as any).dps_v2_breakdown?.display_score != null) hasTarget = true;

    if (!hasTarget) continue;

    // Need features
    const crFeats = featuresByRun.get(row.id) || {};
    const crCount = V10_FEATURES.filter(f => crFeats[f] !== undefined && crFeats[f] !== null).length;

    const rr = (row as any).raw_result;
    const rrCount = rr?.feature_values ? V10_FEATURES.filter(f => rr.feature_values[f] !== undefined && rr.feature_values[f] !== null).length : 0;

    if (crCount >= 30) {
      trainable++;
      featureSource.component_results++;
    } else if (rrCount >= 30) {
      trainable++;
      featureSource.raw_result++;
    } else {
      // Check if video file exists for re-extraction
      const vf = (videoFiles || []).find((v: any) => v.id === row.video_id);
      if (vf?.storage_path && fs.existsSync(path.resolve(process.cwd(), vf.storage_path))) {
        trainable++;
        featureSource.re_extract++;
      } else {
        featureSource.none++;
      }
    }
  }

  console.log(`  Trainable (features + target): ${trainable}/${rows!.length}`);
  console.log(`  Feature sources:`);
  console.log(`    run_component_results: ${featureSource.component_results}`);
  console.log(`    raw_result: ${featureSource.raw_result}`);
  console.log(`    Re-extraction needed: ${featureSource.re_extract}`);
  console.log(`    No feature source: ${featureSource.none}`);

  // ── Print 3 sample rows for inspection ────────────────────────────────────
  console.log('\n━━━ SAMPLE ROWS ━━━');
  for (const row of rows!.slice(0, 3)) {
    const ds = (row as any).dps_v2_display_score ?? (row as any).dps_v2_breakdown?.display_score ?? 'N/A';
    const crFeats = featuresByRun.get(row.id) || {};
    const crCount = V10_FEATURES.filter(f => crFeats[f] !== undefined && crFeats[f] !== null).length;
    console.log(`  Run ${row.id.slice(0, 8)}... | actual_dps(z)=${row.actual_dps} | display=${ds} | tier=${row.actual_tier} | features=${crCount}/58 | version=${row.score_version}`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
