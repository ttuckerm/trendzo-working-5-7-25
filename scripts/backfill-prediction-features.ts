/**
 * Backfill Feature Extraction for Labeled prediction_runs
 *
 * For each labeled prediction_runs row:
 *   1. Resolve a TikTok URL (from scraped_videos or video_files)
 *   2. Download the video
 *   3. Run extractFeaturesForVideo() — the same pipeline that populates training_features
 *   4. Save the TrainingFeatureRow to training_features (upsert)
 *   5. Save a 58-key JSONB to prediction_runs.extracted_features
 *   6. Log progress
 *
 * Usage: npx tsx scripts/backfill-prediction-features.ts
 */

import './load-env';

import { createClient } from '@supabase/supabase-js';
import { join } from 'path';
import { existsSync } from 'fs';
import { extractFeaturesForVideo, type ScrapedVideo, type TrainingFeatureRow } from '@/lib/training/feature-extractor';

const V10_FEATURE_NAMES: string[] = [
  'ffmpeg_scene_changes', 'ffmpeg_cuts_per_second', 'ffmpeg_avg_motion',
  'ffmpeg_color_variance', 'ffmpeg_brightness_avg', 'ffmpeg_contrast_score',
  'ffmpeg_resolution_width', 'ffmpeg_resolution_height', 'ffmpeg_duration_seconds',
  'ffmpeg_bitrate', 'ffmpeg_fps',
  'audio_pitch_mean_hz', 'audio_pitch_variance', 'audio_pitch_range',
  'audio_pitch_std_dev', 'audio_pitch_contour_slope', 'audio_loudness_mean_lufs',
  'audio_loudness_range', 'audio_loudness_variance', 'audio_silence_ratio',
  'audio_silence_count', 'speaking_rate_wpm',
  'visual_scene_count', 'visual_avg_scene_duration', 'visual_score',
  'thumb_brightness', 'thumb_contrast', 'thumb_colorfulness', 'thumb_overall_score',
  'hook_score', 'hook_confidence', 'hook_text_score', 'hook_type_encoded',
  'text_word_count', 'text_sentence_count', 'text_question_mark_count',
  'text_exclamation_count', 'text_transcript_length', 'text_avg_sentence_length',
  'text_unique_word_ratio', 'text_avg_word_length', 'text_syllable_count',
  'text_flesch_reading_ease', 'text_has_cta', 'text_negative_word_count',
  'text_emoji_count', 'meta_duration_seconds', 'meta_words_per_second',
  'text_overlay_density', 'visual_proof_ratio', 'vocal_confidence_composite',
  'creator_followers_log', 'post_hour_utc', 'post_day_of_week',
  'specificity_score', 'instructional_density', 'has_step_structure',
  'hedge_word_density',
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

interface LabeledRow {
  run_id: string;
  video_id: string;
  actual_dps: number | null;
  dps_v2_display_score: number | null;
  scraped_url: string | null;
  scraped_caption: string | null;
  scraped_transcript: string | null;
  scraped_hashtags: string[] | null;
  scraped_duration: number | null;
  scraped_followers: number | null;
  scraped_upload_timestamp: string | null;
  scraped_is_original_sound: boolean | null;
  vf_storage_path: string | null;
  vf_tiktok_url: string | null;
}

function toFeatureJsonb(row: TrainingFeatureRow): Record<string, number | boolean | null> {
  const out: Record<string, number | boolean | null> = {};
  for (const key of V10_FEATURE_NAMES) {
    out[key] = (row as any)[key] ?? null;
  }
  return out;
}

function countPopulated(jsonb: Record<string, number | boolean | null>): number {
  return Object.values(jsonb).filter(v => v !== null && v !== undefined).length;
}

async function main() {
  console.log('='.repeat(70));
  console.log('BACKFILL: Feature Extraction for Labeled prediction_runs');
  console.log('='.repeat(70));

  // ── 1. Query all labeled, clean rows with joined data ──
  const { data: rows, error } = await supabase.rpc('backfill_labeled_rows_with_urls' as any);

  // Fallback: raw SQL via separate queries if RPC doesn't exist
  let labeledRows: LabeledRow[] = [];

  if (error || !rows) {
    console.log('RPC not available, using direct queries...');

    const { data: prRows, error: prErr } = await supabase
      .from('prediction_runs')
      .select('id, video_id, actual_dps, dps_v2_display_score, dps_v2_incomplete')
      .or('actual_dps.not.is.null,dps_v2_display_score.not.is.null');

    if (prErr || !prRows) {
      console.error('Failed to query prediction_runs:', prErr);
      process.exit(1);
    }

    const cleanRows = prRows.filter(r =>
      (r.actual_dps !== null || r.dps_v2_display_score !== null)
      && r.dps_v2_incomplete !== true
    );

    console.log(`Found ${cleanRows.length} labeled prediction_runs rows`);

    // Batch-fetch scraped_videos and video_files info
    const videoIds = [...new Set(cleanRows.map(r => r.video_id))];

    const { data: svRows } = await supabase
      .from('scraped_videos')
      .select('video_id, url, caption, transcript_text, hashtags, duration_seconds, creator_followers_count, upload_timestamp, is_original_sound')
      .in('video_id', videoIds);

    const svMap = new Map((svRows || []).map(r => [r.video_id, r]));

    // video_files uses UUID IDs but prediction_runs.video_id might be text
    const { data: vfRows } = await supabase
      .from('video_files')
      .select('id, storage_path, tiktok_url')
      .in('id', videoIds);

    const vfMap = new Map((vfRows || []).map(r => [r.id, r]));

    for (const pr of cleanRows) {
      const sv = svMap.get(pr.video_id);
      const vf = vfMap.get(pr.video_id);

      labeledRows.push({
        run_id: pr.id,
        video_id: pr.video_id,
        actual_dps: pr.actual_dps,
        dps_v2_display_score: pr.dps_v2_display_score,
        scraped_url: sv?.url || null,
        scraped_caption: sv?.caption || null,
        scraped_transcript: sv?.transcript_text || null,
        scraped_hashtags: sv?.hashtags || null,
        scraped_duration: sv?.duration_seconds || null,
        scraped_followers: sv?.creator_followers_count || null,
        scraped_upload_timestamp: sv?.upload_timestamp || null,
        scraped_is_original_sound: sv?.is_original_sound || null,
        vf_storage_path: vf?.storage_path || null,
        vf_tiktok_url: vf?.tiktok_url || null,
      });
    }
  }

  console.log(`\nTotal labeled rows to process: ${labeledRows.length}`);

  // ── 2. Classify rows ──
  const downloadable: LabeledRow[] = [];
  const localFile: LabeledRow[] = [];
  const noVideo: LabeledRow[] = [];

  for (const row of labeledRows) {
    const tiktokUrl = row.scraped_url || row.vf_tiktok_url;
    if (tiktokUrl) {
      downloadable.push(row);
    } else if (row.vf_storage_path) {
      const absPath = join(process.cwd(), row.vf_storage_path);
      if (existsSync(absPath)) {
        localFile.push(row);
      } else {
        noVideo.push(row);
      }
    } else {
      noVideo.push(row);
    }
  }

  console.log(`\n  Downloadable (TikTok URL): ${downloadable.length}`);
  console.log(`  Local video file on disk:  ${localFile.length}`);
  console.log(`  No video available:        ${noVideo.length}`);

  // ── 3. Process each row ──
  const results = {
    success: [] as { video_id: string; run_id: string; features_populated: number }[],
    failed: [] as { video_id: string; run_id: string; reason: string }[],
  };

  const allRowsUnfiltered = [...downloadable, ...localFile];

  // Skip videos that already have training_features rows
  const existingIds = new Set<string>();
  let existingOffset = 0;
  const PG = 1000;
  while (true) {
    const { data: page } = await supabase
      .from('training_features')
      .select('video_id')
      .range(existingOffset, existingOffset + PG - 1);
    if (!page || page.length === 0) break;
    for (const r of page) existingIds.add(r.video_id);
    if (page.length < PG) break;
    existingOffset += PG;
  }

  const allRows = allRowsUnfiltered.filter(r => !existingIds.has(r.video_id));
  const skippedCount = allRowsUnfiltered.length - allRows.length;
  console.log(`\n  Already extracted (skipping): ${skippedCount}`);
  console.log(`  Remaining to process:        ${allRows.length}\n`);

  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i];
    const tiktokUrl = row.scraped_url || row.vf_tiktok_url;
    const isLocal = !tiktokUrl && !!row.vf_storage_path;

    console.log(`[${i + 1}/${allRows.length}] video_id=${row.video_id} run_id=${row.run_id.slice(0, 8)}...`);

    try {
      // Build a ScrapedVideo-shaped object for extractFeaturesForVideo()
      const scrapedInput: ScrapedVideo = {
        video_id: row.video_id,
        url: tiktokUrl || '',
        caption: row.scraped_caption || '',
        transcript_text: row.scraped_transcript || null,
        hashtags: row.scraped_hashtags || [],
        duration_seconds: row.scraped_duration || null,
        creator_followers_count: row.scraped_followers || 0,
        upload_timestamp: row.scraped_upload_timestamp || null,
        is_original_sound: row.scraped_is_original_sound || null,
      };

      // For local files, we need to patch the URL to skip download.
      // extractFeaturesForVideo downloads from url, but we can pass the local path.
      // We'll use a trick: if the file is already local, we modify the function behavior.
      // Actually, extractFeaturesForVideo always downloads via TikTokDownloader.
      // For local files, we need a different approach — use extractPredictionFeatures directly.

      let featureRow: TrainingFeatureRow;

      if (isLocal && row.vf_storage_path) {
        // Use extractPredictionFeatures for local files (same feature pipeline)
        const { extractPredictionFeatures } = await import('@/lib/prediction/extract-prediction-features');
        const absPath = join(process.cwd(), row.vf_storage_path);

        const result = await extractPredictionFeatures({
          videoFilePath: absPath,
          transcript: row.scraped_transcript || null,
          niche: null,
          caption: row.scraped_caption || null,
          creatorFollowerCount: row.scraped_followers || null,
        });

        // Convert PredictionFeatureResult → TrainingFeatureRow
        featureRow = {
          video_id: row.video_id,
          extracted_at: new Date().toISOString(),
          extraction_version: 1,
          extraction_duration_ms: result.extractionTimeMs,
          extraction_errors: result.errors,
          ...Object.fromEntries(
            Object.keys(result.features).map(k => [k, result.features[k]])
          ),
        } as any;
      } else {
        // Use the training feature extractor (downloads from TikTok URL)
        featureRow = await extractFeaturesForVideo(scrapedInput);
      }

      // Build the 58-feature JSONB
      const featureJsonb = toFeatureJsonb(featureRow);
      const populated = countPopulated(featureJsonb);

      // 4. Upsert into training_features
      const { error: tfErr } = await supabase
        .from('training_features')
        .upsert(featureRow, { onConflict: 'video_id' });

      if (tfErr) {
        console.error(`  ✗ training_features upsert failed: ${tfErr.message}`);
        results.failed.push({ video_id: row.video_id, run_id: row.run_id, reason: `training_features upsert: ${tfErr.message}` });
        continue;
      }

      // 5. Update prediction_runs.extracted_features
      const { error: prErr } = await supabase
        .from('prediction_runs')
        .update({ extracted_features: featureJsonb })
        .eq('id', row.run_id);

      if (prErr) {
        console.error(`  ✗ prediction_runs update failed: ${prErr.message}`);
        results.failed.push({ video_id: row.video_id, run_id: row.run_id, reason: `prediction_runs update: ${prErr.message}` });
        continue;
      }

      results.success.push({ video_id: row.video_id, run_id: row.run_id, features_populated: populated });
      console.log(`  ✓ ${populated}/${V10_FEATURE_NAMES.length} features extracted`);

    } catch (err: any) {
      console.error(`  ✗ Error: ${err.message}`);
      results.failed.push({ video_id: row.video_id, run_id: row.run_id, reason: err.message });
    }
  }

  // ── 4. Report ──
  console.log('\n' + '='.repeat(70));
  console.log('BACKFILL RESULTS');
  console.log('='.repeat(70));
  console.log(`Total labeled rows found:      ${labeledRows.length}`);
  console.log(`Successfully backfilled:       ${results.success.length}`);
  console.log(`Failed:                        ${results.failed.length}`);
  console.log(`No video available (manual):   ${noVideo.length}`);

  // Feature fill rate for successful rows
  if (results.success.length > 0) {
    const avgFill = results.success.reduce((s, r) => s + r.features_populated, 0) / results.success.length;
    console.log(`\nAvg features populated (new):   ${avgFill.toFixed(1)} / ${V10_FEATURE_NAMES.length}`);
    console.log(`Avg fill rate (new):            ${((avgFill / V10_FEATURE_NAMES.length) * 100).toFixed(1)}%`);
  }

  if (results.failed.length > 0) {
    console.log('\n--- FAILED ROWS ---');
    for (const f of results.failed) {
      console.log(`  video_id=${f.video_id}  reason=${f.reason}`);
    }
  }

  if (noVideo.length > 0) {
    console.log('\n--- NEEDS MANUAL RE-UPLOAD (no TikTok URL, no local file) ---');
    for (const nv of noVideo) {
      console.log(`  video_id=${nv.video_id}  run_id=${nv.run_id}`);
    }
  }

  // ── 5. Post-backfill verification ──
  console.log('\n' + '='.repeat(70));
  console.log('POST-BACKFILL VERIFICATION');
  console.log('='.repeat(70));

  const { data: tfCount } = await supabase
    .from('training_features')
    .select('video_id', { count: 'exact', head: true });

  // Count new rows
  const newVideoIds = results.success.map(r => r.video_id);
  const { data: newTfRows } = await supabase
    .from('training_features')
    .select('video_id')
    .in('video_id', newVideoIds.length > 0 ? newVideoIds : ['__none__']);

  console.log(`\nTotal training_features rows:   ${(tfCount as any)?.length ?? 'unknown'} (check via count)`);

  // Get exact count via SQL-like approach
  const { count: totalTfCount } = await supabase
    .from('training_features')
    .select('*', { count: 'exact', head: true });

  console.log(`Total training_features rows:   ${totalTfCount ?? 'unknown'}`);
  console.log(`New rows added this session:    ${newTfRows?.length ?? 0}`);

  // Feature fill rate comparison for new rows
  if (newVideoIds.length > 0) {
    const { data: newRows } = await supabase
      .from('training_features')
      .select('*')
      .in('video_id', newVideoIds)
      .limit(5);

    if (newRows && newRows.length > 0) {
      console.log(`\nSample new row fill rates:`);
      for (const nr of newRows) {
        const filled = V10_FEATURE_NAMES.filter(k => (nr as any)[k] !== null).length;
        console.log(`  video_id=${nr.video_id}: ${filled}/${V10_FEATURE_NAMES.length} features`);
      }
    }
  }

  // Compare new vs original average fill rate
  const { data: origSample } = await supabase
    .from('training_features')
    .select('*')
    .not('video_id', 'in', `(${newVideoIds.join(',')})`)
    .limit(50);

  if (origSample && origSample.length > 0) {
    const origAvg = origSample.reduce((sum, r) => {
      const filled = V10_FEATURE_NAMES.filter(k => (r as any)[k] !== null).length;
      return sum + filled;
    }, 0) / origSample.length;
    console.log(`\nOriginal rows avg fill rate:    ${origAvg.toFixed(1)}/${V10_FEATURE_NAMES.length} (${((origAvg / V10_FEATURE_NAMES.length) * 100).toFixed(1)}%)`);
  }

  // Check prediction_runs.extracted_features populated
  const { count: prWithFeatures } = await supabase
    .from('prediction_runs')
    .select('*', { count: 'exact', head: true })
    .not('extracted_features', 'is', null);

  console.log(`\nprediction_runs with features:  ${prWithFeatures ?? 0}`);
  console.log('\nDone. Do NOT retrain yet — verify data quality first.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
