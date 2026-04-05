#!/usr/bin/env npx tsx
/**
 * Step 2: Extract features + DPS targets for XGBoost retraining
 *
 * Sources:
 *   - training_features table → 58-feature vectors
 *   - scraped_videos table → DPS display score targets
 *
 * Outputs: data/xgboost-retrain-input.json
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

// The 58 v10 features (canonical order from models/xgboost-v10-features.json)
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

// DPS tier classification (matches dps-v2.ts classifyDpsV2)
function classifyDpsTier(displayScore: number): string {
  // Convert display score back to approximate z-score for tier classification
  // display_score = CDF(z) * 100, so z = invCDF(display/100)
  // Simpler: use score thresholds based on zScoreToDisplayDps mapping
  if (displayScore >= 99.9) return 'mega-viral';
  if (displayScore >= 99.0) return 'hyper-viral';
  if (displayScore >= 95.0) return 'viral';
  if (displayScore >= 70.0) return 'above-average';
  if (displayScore >= 30.0) return 'average';
  if (displayScore >= 5.0) return 'below-average';
  return 'poor';
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  STEP 2: Extract Features + Targets                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // 1. Get ALL training_features
  const featureColumns = ['video_id', ...V10_FEATURES].join(', ');
  const { data: tfRows, error: tfErr } = await supabase
    .from('training_features')
    .select(featureColumns)
    .limit(10000);

  if (tfErr) { console.error('training_features error:', tfErr.message); process.exit(1); }
  console.log(`training_features fetched: ${tfRows!.length}`);

  // 2. Get DPS targets from scraped_videos (batch query)
  const videoIds = tfRows!.map((r: any) => r.video_id);
  const dpsMap = new Map<string, { dps_score: number; dps_classification: string; niche: string; views_count: number; follower_count: number }>();

  const batchSize = 200;
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const { data: svBatch } = await supabase
      .from('scraped_videos')
      .select('video_id, dps_score, dps_classification, niche, views_count, creator_followers_count')
      .in('video_id', batch)
      .not('dps_score', 'is', null);

    for (const sv of (svBatch || [])) {
      dpsMap.set(sv.video_id, {
        dps_score: Number(sv.dps_score),
        dps_classification: sv.dps_classification || 'unknown',
        niche: sv.niche || 'unknown',
        views_count: Number(sv.views_count) || 0,
        follower_count: Number(sv.creator_followers_count) || 0,
      });
    }

    if ((i + batchSize) % 500 === 0 || i + batchSize >= videoIds.length) {
      process.stdout.write(`\r  Fetched scraped_videos: ${dpsMap.size}...`);
    }
  }
  console.log(`\nscraped_videos with DPS matched: ${dpsMap.size}/${tfRows!.length}`);

  // 3. Build feature matrix
  const rows: any[] = [];
  const errors: { video_id: string; reason: string }[] = [];

  for (const tfRow of tfRows!) {
    const videoId = (tfRow as any).video_id;
    const sv = dpsMap.get(videoId);

    if (!sv) {
      errors.push({ video_id: videoId, reason: 'No DPS score in scraped_videos' });
      continue;
    }

    // Check if DPS score is in display score range (0-100)
    if (sv.dps_score < 0 || sv.dps_score > 100) {
      errors.push({ video_id: videoId, reason: `DPS score out of range: ${sv.dps_score}` });
      continue;
    }

    // Extract 58 features
    const features: Record<string, number | null> = {};
    let featureCount = 0;
    let nullCount = 0;

    for (const fname of V10_FEATURES) {
      const val = (tfRow as any)[fname];
      if (val !== null && val !== undefined) {
        features[fname] = typeof val === 'boolean' ? (val ? 1 : 0) : Number(val);
        if (!isNaN(features[fname]!)) featureCount++;
        else { features[fname] = null; nullCount++; }
      } else {
        features[fname] = null;
        nullCount++;
      }
    }

    // Require at least 25% feature coverage
    if (featureCount < V10_FEATURES.length * 0.25) {
      errors.push({ video_id: videoId, reason: `Too few features: ${featureCount}/${V10_FEATURES.length}` });
      continue;
    }

    rows.push({
      video_id: videoId,
      features,
      actual_dps_display_score: sv.dps_score,
      actual_dps_tier: sv.dps_classification || classifyDpsTier(sv.dps_score),
      niche: sv.niche,
      views_count: sv.views_count,
      follower_count: sv.follower_count,
      feature_count: featureCount,
      null_feature_count: nullCount,
    });
  }

  console.log(`\nTrainable rows: ${rows.length}`);
  console.log(`Skipped (no DPS): ${errors.filter(e => e.reason.includes('No DPS')).length}`);
  console.log(`Skipped (other): ${errors.filter(e => !e.reason.includes('No DPS')).length}`);

  if (errors.filter(e => !e.reason.includes('No DPS')).length > 0) {
    console.log(`\nNon-DPS errors:`);
    for (const e of errors.filter(e => !e.reason.includes('No DPS'))) {
      console.log(`  ${e.video_id}: ${e.reason}`);
    }
  }

  // 4. Statistics
  const dpsScores = rows.map(r => r.actual_dps_display_score).sort((a: number, b: number) => a - b);
  console.log(`\n━━━ DATASET STATISTICS ━━━`);
  console.log(`  Total rows: ${rows.length}`);
  console.log(`  Feature count: ${V10_FEATURES.length}`);
  console.log(`  DPS range: ${dpsScores[0]?.toFixed(2)} - ${dpsScores[dpsScores.length - 1]?.toFixed(2)}`);
  console.log(`  DPS mean: ${(dpsScores.reduce((s: number, v: number) => s + v, 0) / dpsScores.length).toFixed(2)}`);
  console.log(`  DPS median: ${dpsScores[Math.floor(dpsScores.length / 2)]?.toFixed(2)}`);

  // Tier distribution
  const tierDist = new Map<string, number>();
  for (const r of rows) {
    tierDist.set(r.actual_dps_tier, (tierDist.get(r.actual_dps_tier) || 0) + 1);
  }
  console.log(`\n  Tier distribution:`);
  for (const [tier, count] of [...tierDist.entries()].sort((a, b) => b[1] - a[1])) {
    const pct = ((count / rows.length) * 100).toFixed(1);
    console.log(`    ${tier.padEnd(18)} ${String(count).padStart(4)} (${pct}%)`);
  }

  // Feature coverage
  const avgFeatures = rows.reduce((s, r) => s + r.feature_count, 0) / rows.length;
  console.log(`\n  Avg features per row: ${avgFeatures.toFixed(1)}/${V10_FEATURES.length}`);

  // 5. Save to JSON
  const output = {
    rows: rows.map(r => ({
      video_id: r.video_id,
      features: r.features,
      actual_dps_display_score: r.actual_dps_display_score,
      actual_dps_tier: r.actual_dps_tier,
    })),
    metadata: {
      total_rows: rows.length,
      feature_count: V10_FEATURES.length,
      feature_names: V10_FEATURES,
      cohort_size: 6718,
      dps_score_type: 'display_score_0_100',
      source: 'training_features + scraped_videos',
      timestamp: new Date().toISOString(),
      v10_training_rows: 863,
      delta_rows: rows.length - 863,
    },
  };

  const outPath = path.resolve(process.cwd(), 'data/xgboost-retrain-input.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ Saved ${rows.length} rows to ${outPath}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
