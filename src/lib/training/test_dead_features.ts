/**
 * Prompt 3 Step 4 — test the three feature-extractor fixes on 5 real videos.
 *
 * For each video: fetch the existing training_features row (BEFORE values,
 * which should show the "dead" defaults — NaN / 0 / 5), then run the updated
 * extractor and print the new values side-by-side for all 14 features.
 *
 * Runs Whisper (opt-in) so the speaking_rate_wpm_* + visual_to_verbal_ratio
 * features are also exercised. Cost: ~$0.03 total for 5 ~30-second videos.
 */

import { createClient } from '@supabase/supabase-js';
import { extractFeaturesForVideo, type ScrapedVideo } from '@/lib/training/feature-extractor';

process.env.ENABLE_WHISPER_FOR_TRAINING = '1';

const DEAD_FEATURES = [
  // Group A
  'speaking_rate_wpm_variance',
  'speaking_rate_wpm_acceleration',
  'speaking_rate_wpm_peak_count',
  'speaking_rate_fast_segments',
  'speaking_rate_slow_segments',
  'visual_to_verbal_ratio',
  // Group B
  'hook_audio_score',
  'hook_visual_score',
  'hook_pace_score',
  'hook_tone_score',
  // Group C
  'audio_music_ratio',
  'audio_speech_ratio',
  'audio_type_encoded',
  'audio_energy_variance',
] as const;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  const db = createClient(url, key, { auth: { persistSession: false } });

  // Pick 5 videos across the DPS range so we exercise different hook strengths
  const { data: videos, error } = await db
    .from('scraped_videos')
    .select('video_id, url, caption, transcript_text, hashtags, duration_seconds, creator_followers_count, upload_timestamp, music_is_original, dps_score')
    .not('dps_score', 'is', null)
    .not('url', 'is', null)
    .order('dps_score', { ascending: false })
    .limit(1)
    .then(async (r1) => {
      if (r1.error) throw r1.error;
      const lo = await db
        .from('scraped_videos')
        .select('video_id, url, caption, transcript_text, hashtags, duration_seconds, creator_followers_count, upload_timestamp, music_is_original, dps_score')
        .not('dps_score', 'is', null)
        .not('url', 'is', null)
        .order('dps_score', { ascending: true })
        .limit(1);
      if (lo.error) throw lo.error;
      // Three in between
      const mid = await db
        .from('scraped_videos')
        .select('video_id, url, caption, transcript_text, hashtags, duration_seconds, creator_followers_count, upload_timestamp, music_is_original, dps_score')
        .not('dps_score', 'is', null)
        .not('url', 'is', null)
        .order('video_id', { ascending: true })
        .range(100, 102);
      if (mid.error) throw mid.error;
      return {
        data: [...(r1.data ?? []), ...(mid.data ?? []), ...(lo.data ?? [])],
        error: null as any,
      };
    });

  if (error) throw error;
  if (!videos || videos.length === 0) throw new Error('No videos returned');

  console.log(`\n=== Testing ${videos.length} videos ===\n`);

  for (const v of videos) {
    const videoId = v.video_id as string;
    console.log('━'.repeat(78));
    console.log(`Video ${videoId}  (dps=${(v as any).dps_score})`);
    console.log(`  caption: ${String(v.caption).slice(0, 80)}…`);
    console.log('━'.repeat(78));

    // BEFORE: existing training_features row
    const { data: before } = await db
      .from('training_features')
      .select(DEAD_FEATURES.join(','))
      .eq('video_id', videoId)
      .maybeSingle();

    // AFTER: re-run the updated extractor
    const scraped: ScrapedVideo = {
      video_id: videoId,
      url: v.url as string,
      caption: (v.caption as string) ?? '',
      transcript_text: (v.transcript_text as string | null) ?? null,
      hashtags: (v.hashtags as string[]) ?? [],
      duration_seconds: (v.duration_seconds as number | null) ?? null,
      creator_followers_count: (v.creator_followers_count as number) ?? 0,
      upload_timestamp: (v.upload_timestamp as string | null) ?? null,
      is_original_sound: ((v as any).music_is_original as boolean | null) ?? null,
    };

    let row: Awaited<ReturnType<typeof extractFeaturesForVideo>> | null = null;
    try {
      row = await extractFeaturesForVideo(scraped);
    } catch (e: any) {
      console.log(`  FAILED: ${e.message}`);
      continue;
    }

    console.log(`${'feature'.padEnd(38)} ${'BEFORE'.padStart(12)} ${'AFTER'.padStart(12)}  changed?`);
    for (const f of DEAD_FEATURES) {
      const b = (before as Record<string, any> | null)?.[f];
      const a = (row as Record<string, any>)[f];
      const bStr = b === null || b === undefined ? 'null' : typeof b === 'number' ? b.toFixed(4) : String(b);
      const aStr = a === null || a === undefined ? 'null' : typeof a === 'number' ? a.toFixed(4) : String(a);
      const changed = bStr !== aStr ? '✓' : '·';
      console.log(`${f.padEnd(38)} ${bStr.padStart(12)} ${aStr.padStart(12)}  ${changed}`);
    }
    if (row.extraction_errors.length > 0) {
      console.log(`  errors: ${row.extraction_errors.slice(0, 5).join(' | ')}`);
    }
    console.log();
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
