/**
 * Backfill script for 7 new pre-publication features (2026-03-18)
 *
 * Wave 1 (transcript + audio, no video download needed):
 *   - specificity_score, instructional_density, has_step_structure,
 *     hedge_word_density, vocal_confidence_composite
 *
 * Wave 2 (requires video download + Gemini Vision):
 *   - visual_proof_ratio, talking_head_ratio, visual_to_verbal_ratio,
 *     text_overlay_density
 *
 * Usage:
 *   npx tsx scripts/backfill-new-features.ts [--wave1-only] [--wave2-only] [--limit N] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// WAVE 1: Transcript/Audio Features (reuse from feature-extractor)
// ============================================================================

const SIDE_HUSTLE_TOOLS = [
  'etsy', 'shopify', 'printify', 'canva', 'chatgpt', 'fiverr', 'upwork',
  'amazon', 'ebay', 'gumroad', 'teachable', 'kajabi', 'convertkit',
  'mailchimp', 'stripe', 'paypal', 'tiktok', 'instagram', 'youtube',
  'pinterest', 'dropbox', 'notion', 'airtable', 'zapier', 'midjourney',
  'dall-e', 'dalle', 'stable diffusion', 'clickfunnels', 'kartra',
  'activecampaign', 'redbubble', 'merch by amazon', 'printful', 'teespring',
  'spreadshirt', 'amazon fba', 'amazon kdp', 'kindle', 'udemy', 'skillshare',
  'substack', 'patreon', 'ko-fi', 'buy me a coffee', 'stan store', 'linktree',
  'beacons', 'lemon squeezy', 'lemonsqueezy', 'whop', 'podia', 'thinkific',
  'samcart', 'leadpages', 'systeme', 'systeme.io',
];

const DOLLAR_AMOUNT_REGEX = /\$[\d,]+(?:\.\d{1,2})?/g;
const NON_ROUND_REGEX = /\$[\d,]*[1-9]\d{0,1}(?:\.\d{1,2})?$/;

const TIMEFRAME_PATTERNS = [
  /first\s+(?:month|week|day)/gi,
  /in\s+\d+\s+(?:days?|weeks?|months?|years?)/gi,
  /per\s+(?:month|week|day|hour|year)/gi,
  /\d+\s+(?:days?|weeks?|months?)\s+(?:ago|later|in)/gi,
  /(?:every|each)\s+(?:month|week|day)/gi,
];

const ACTION_VERBS = [
  'create', 'open', 'click', 'go', 'set up', 'sign up', 'upload', 'select',
  'type', 'paste', 'copy', 'build', 'start', 'launch', 'add', 'download',
  'install', 'connect', 'link', 'submit', 'publish', 'fill', 'choose',
  'enter', 'write', 'save', 'share', 'post', 'turn on', 'enable',
];

const SEQUENTIAL_MARKERS = [
  /\bfirst\b/gi, /\bsecond\b/gi, /\bthird\b/gi,
  /\bstep\s+\d+/gi, /\bnext\b/gi, /\bthen\b/gi,
  /\bfinally\b/gi, /\blastly\b/gi,
  /\bnumber\s+one\b/gi, /\bnumber\s+two\b/gi, /\bnumber\s+three\b/gi,
];

const HEDGE_PHRASES = [
  'maybe', 'probably', 'i think', 'i guess', 'kind of', 'sort of',
  'might', 'could be', 'not sure', "i don't know", 'possibly', 'perhaps',
  'it depends', 'in my opinion', 'some people say', 'you could try',
  'it might work', "i'm not certain", 'i believe', 'i feel like',
];

const CONFIDENCE_ANCHORS = {
  pitch_variance: { p5: 0.5, p95: 45.0 },
  loudness_variance: { p5: 0.01, p95: 8.0 },
  silence_ratio: { p5: 0.01, p95: 0.45 },
  wpm_variance: { p5: 100, p95: 8000 },
};

function normalizeToUnit(value: number, p5: number, p95: number): number {
  return Math.max(0, Math.min(1, (value - p5) / (p95 - p5)));
}

interface Wave1Result {
  specificity_score: number | null;
  instructional_density: number | null;
  has_step_structure: boolean | null;
  hedge_word_density: number | null;
  vocal_confidence_composite: number | null;
}

function computeWave1(
  transcript: string | null,
  durationSeconds: number | null,
  audioFeatures: {
    audio_pitch_variance: number | null;
    audio_loudness_variance: number | null;
    audio_silence_ratio: number | null;
    speaking_rate_wpm_variance: number | null;
  },
): Wave1Result {
  const result: Wave1Result = {
    specificity_score: null,
    instructional_density: null,
    has_step_structure: null,
    hedge_word_density: null,
    vocal_confidence_composite: null,
  };

  if (transcript) {
    const lower = transcript.toLowerCase();
    const durationMinutes = Math.max((durationSeconds || 60) / 60, 1);
    const words = transcript.split(/\s+/).filter(w => w.length > 0);
    const wordCount = Math.max(words.length, 1);

    // specificity_score
    let namedToolsCount = 0;
    for (const tool of SIDE_HUSTLE_TOOLS) {
      const regex = new RegExp(`\\b${tool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) namedToolsCount += matches.length;
    }
    const dollarMatches = transcript.match(DOLLAR_AMOUNT_REGEX) || [];
    let specificAmountsCount = 0;
    for (const match of dollarMatches) {
      specificAmountsCount += NON_ROUND_REGEX.test(match) ? 1.5 : 1;
    }
    let timeframesCount = 0;
    for (const pattern of TIMEFRAME_PATTERNS) {
      const matches = lower.match(pattern);
      if (matches) timeframesCount += matches.length;
    }
    result.specificity_score = (namedToolsCount * 2 + specificAmountsCount * 3 + timeframesCount * 1) / durationMinutes;

    // instructional_density
    let imperativeCount = 0;
    const sentences = transcript.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
    for (const sentence of sentences) {
      const trimmed = sentence.trim().toLowerCase();
      for (const verb of ACTION_VERBS) {
        if (trimmed.startsWith(verb) || trimmed.startsWith('so ' + verb) || trimmed.startsWith('and ' + verb) || trimmed.startsWith('now ' + verb)) {
          imperativeCount++;
          break;
        }
      }
    }
    let sequentialMarkerCount = 0;
    for (const pattern of SEQUENTIAL_MARKERS) {
      const matches = lower.match(pattern);
      if (matches) sequentialMarkerCount += matches.length;
    }
    result.instructional_density = (imperativeCount + sequentialMarkerCount) / durationMinutes;
    result.has_step_structure = sequentialMarkerCount >= 3;

    // hedge_word_density
    let hedgeCount = 0;
    for (const phrase of HEDGE_PHRASES) {
      const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) hedgeCount += matches.length;
    }
    result.hedge_word_density = hedgeCount / wordCount;
  }

  // vocal_confidence_composite
  const components: { value: number; weight: number }[] = [];
  if (audioFeatures.audio_pitch_variance !== null) {
    const norm = normalizeToUnit(audioFeatures.audio_pitch_variance, CONFIDENCE_ANCHORS.pitch_variance.p5, CONFIDENCE_ANCHORS.pitch_variance.p95);
    components.push({ value: 1 - norm, weight: 0.3 });
  }
  if (audioFeatures.audio_loudness_variance !== null) {
    const norm = normalizeToUnit(audioFeatures.audio_loudness_variance, CONFIDENCE_ANCHORS.loudness_variance.p5, CONFIDENCE_ANCHORS.loudness_variance.p95);
    components.push({ value: 1 - norm, weight: 0.3 });
  }
  if (audioFeatures.audio_silence_ratio !== null) {
    const norm = normalizeToUnit(audioFeatures.audio_silence_ratio, CONFIDENCE_ANCHORS.silence_ratio.p5, CONFIDENCE_ANCHORS.silence_ratio.p95);
    components.push({ value: 1 - norm, weight: 0.2 });
  }
  if (audioFeatures.speaking_rate_wpm_variance !== null) {
    const norm = normalizeToUnit(audioFeatures.speaking_rate_wpm_variance, CONFIDENCE_ANCHORS.wpm_variance.p5, CONFIDENCE_ANCHORS.wpm_variance.p95);
    components.push({ value: 1 - norm, weight: 0.2 });
  }
  if (components.length > 0) {
    const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
    result.vocal_confidence_composite = Math.max(0, Math.min(1,
      components.reduce((sum, c) => sum + c.value * (c.weight / totalWeight), 0)
    ));
  }

  return result;
}

// ============================================================================
// WAVE 2: Frame Classifier (Gemini Vision)
// ============================================================================

type FrameClassification =
  | 'talking_head' | 'screen_recording' | 'dashboard_screenshot'
  | 'product_demo' | 'text_card' | 'b_roll' | 'transition' | 'other';

interface Wave2Result {
  visual_proof_ratio: number;
  talking_head_ratio: number;
  text_overlay_density: number;
  visual_to_verbal_ratio: number | null;
}

async function computeWave2(videoPath: string, durationSeconds: number): Promise<Wave2Result | null> {
  const { GoogleGenAI } = await import('@google/genai');
  const { extractThumbnails } = await import('../src/lib/services/ffmpeg-service');
  const fs = await import('fs');

  const apiKey =
    process.env.GOOGLE_GEMINI_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) return null;

  const duration = durationSeconds > 0 ? durationSeconds : 30;
  const timestamps: number[] = [];
  for (let pct = 10; pct <= 90; pct += 10) {
    timestamps.push(Math.round((duration * pct / 100) * 10) / 10);
  }

  let framePaths: string[] = [];
  try {
    const frames = await extractThumbnails(videoPath, {
      timestamps, width: 512, quality: 3, format: 'jpg',
    });
    framePaths = frames.map(f => f.path);
    if (framePaths.length === 0) return null;

    const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    for (const fp of framePaths) {
      const imageBuffer = fs.readFileSync(fp);
      imageParts.push({
        inlineData: { mimeType: 'image/jpeg', data: imageBuffer.toString('base64') },
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          ...imageParts,
          {
            text: `You are analyzing ${framePaths.length} frames extracted from a short-form video about side hustles / making money online.

For each frame, classify it as exactly one of: talking_head, screen_recording, dashboard_screenshot, product_demo, text_card, b_roll, transition, other.

Return ONLY a JSON array of ${framePaths.length} strings in the same order as the frames.`,
          },
        ],
      }],
    });

    const responseText = result.text || '';
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```\n?/g, '');

    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return null;

    const validTypes: FrameClassification[] = [
      'talking_head', 'screen_recording', 'dashboard_screenshot',
      'product_demo', 'text_card', 'b_roll', 'transition', 'other',
    ];
    const classifications: FrameClassification[] = parsed.map((item: string) => {
      const lower = (item || '').toLowerCase().trim().replace(/\s+/g, '_');
      return validTypes.includes(lower as FrameClassification) ? (lower as FrameClassification) : 'other';
    });

    const totalFrames = classifications.length;
    const durationMinutes = Math.max(duration / 60, 1);

    const proofTypes: FrameClassification[] = ['screen_recording', 'dashboard_screenshot', 'product_demo'];
    const proofFrames = classifications.filter(c => proofTypes.includes(c)).length;
    const talkingHeadFrames = classifications.filter(c => c === 'talking_head').length;
    const textCardFrames = classifications.filter(c => c === 'text_card').length;

    return {
      visual_proof_ratio: proofFrames / totalFrames,
      talking_head_ratio: talkingHeadFrames / totalFrames,
      text_overlay_density: textCardFrames / durationMinutes,
      visual_to_verbal_ratio: null, // Requires Whisper segments, not available in backfill
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Wave2] Failed: ${msg}`);
    return null;
  } finally {
    for (const p of framePaths) {
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
    }
  }
}

// ============================================================================
// MAIN BACKFILL
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const wave1Only = args.includes('--wave1-only');
  const wave2Only = args.includes('--wave2-only');
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 0;

  console.log(`\n=== Backfill New Features (2026-03-18) ===`);
  console.log(`Wave 1: ${wave2Only ? 'SKIP' : 'YES'}`);
  console.log(`Wave 2: ${wave1Only ? 'SKIP' : 'YES'}`);
  console.log(`Dry run: ${dryRun}`);
  if (limit > 0) console.log(`Limit: ${limit}`);

  // Fetch all rows that need backfill (specificity_score IS NULL)
  let query = supabase
    .from('training_features')
    .select('video_id, meta_duration_seconds, audio_pitch_variance, audio_loudness_variance, audio_silence_ratio, speaking_rate_wpm_variance, ffmpeg_duration_seconds')
    .is('specificity_score', null);

  const { data: rows, error } = await query;
  if (error) {
    console.error(`Failed to fetch training_features: ${error.message}`);
    process.exit(1);
  }

  let targets = rows || [];
  if (limit > 0) targets = targets.slice(0, limit);
  console.log(`\nFound ${targets.length} rows to backfill\n`);

  const stats = { success: 0, nullSkipped: 0, error: 0 };

  // --- WAVE 1: Transcript features ---
  if (!wave2Only) {
    console.log('--- WAVE 1: Transcript + Audio Features ---');
    for (let i = 0; i < targets.length; i++) {
      const row = targets[i];

      // Fetch transcript from scraped_videos
      const { data: video } = await supabase
        .from('scraped_videos')
        .select('transcript_text, caption, duration_seconds')
        .eq('video_id', row.video_id)
        .single();

      if (!video) {
        stats.nullSkipped++;
        continue;
      }

      const duration = row.ffmpeg_duration_seconds || row.meta_duration_seconds || video.duration_seconds;
      const wave1 = computeWave1(video.transcript_text || video.caption, duration, {
        audio_pitch_variance: row.audio_pitch_variance,
        audio_loudness_variance: row.audio_loudness_variance,
        audio_silence_ratio: row.audio_silence_ratio,
        speaking_rate_wpm_variance: row.speaking_rate_wpm_variance,
      });

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('training_features')
          .update({
            specificity_score: wave1.specificity_score,
            instructional_density: wave1.instructional_density,
            has_step_structure: wave1.has_step_structure,
            hedge_word_density: wave1.hedge_word_density,
            vocal_confidence_composite: wave1.vocal_confidence_composite,
          })
          .eq('video_id', row.video_id);

        if (updateError) {
          console.error(`  ✗ ${row.video_id}: ${updateError.message}`);
          stats.error++;
          continue;
        }
      }

      stats.success++;
      if ((i + 1) % 50 === 0) {
        console.log(`  Wave 1 progress: ${i + 1}/${targets.length} (${stats.success} success, ${stats.error} error)`);
      }
    }
    console.log(`Wave 1 complete: ${stats.success} success, ${stats.nullSkipped} skipped, ${stats.error} error\n`);
  }

  // --- WAVE 2: Vision features (batch 10 at a time with rate limiting) ---
  if (!wave1Only) {
    console.log('--- WAVE 2: Gemini Vision Frame Classifier ---');

    const apiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log('No Gemini API key — skipping Wave 2');
    } else {
      // Re-query rows that still need vision features
      const { data: visionRows } = await supabase
        .from('training_features')
        .select('video_id, ffmpeg_duration_seconds, meta_duration_seconds')
        .is('visual_proof_ratio', null);

      let visionTargets = visionRows || [];
      if (limit > 0) visionTargets = visionTargets.slice(0, limit);

      const wave2Stats = { success: 0, skipped: 0, error: 0 };
      const BATCH_SIZE = 10;

      for (let i = 0; i < visionTargets.length; i += BATCH_SIZE) {
        const batch = visionTargets.slice(i, i + BATCH_SIZE);

        for (const row of batch) {
          // Need video URL for download
          const { data: video } = await supabase
            .from('scraped_videos')
            .select('url, duration_seconds')
            .eq('video_id', row.video_id)
            .single();

          if (!video?.url) {
            wave2Stats.skipped++;
            continue;
          }

          try {
            // Dynamic import for TikTokDownloader
            const { TikTokDownloader } = await import('../src/lib/services/tiktok-downloader');
            const downloadResult = await TikTokDownloader.downloadVideo(video.url);

            if (!downloadResult.success || !downloadResult.localPath) {
              wave2Stats.skipped++;
              continue;
            }

            const duration = row.ffmpeg_duration_seconds || row.meta_duration_seconds || video.duration_seconds || 30;
            const wave2 = await computeWave2(downloadResult.localPath, duration);

            if (wave2 && !dryRun) {
              const { error: updateError } = await supabase
                .from('training_features')
                .update({
                  visual_proof_ratio: wave2.visual_proof_ratio,
                  talking_head_ratio: wave2.talking_head_ratio,
                  text_overlay_density: wave2.text_overlay_density,
                  visual_to_verbal_ratio: wave2.visual_to_verbal_ratio,
                })
                .eq('video_id', row.video_id);

              if (updateError) {
                console.error(`  ✗ ${row.video_id}: ${updateError.message}`);
                wave2Stats.error++;
              } else {
                wave2Stats.success++;
              }
            } else if (!wave2) {
              wave2Stats.skipped++;
            }
          } catch (err: any) {
            console.error(`  ✗ ${row.video_id}: ${err.message}`);
            wave2Stats.error++;
          }
        }

        const processed = Math.min(i + BATCH_SIZE, visionTargets.length);
        if (processed % 50 === 0 || processed === visionTargets.length) {
          console.log(`  Wave 2 progress: ${processed}/${visionTargets.length} (${wave2Stats.success} success, ${wave2Stats.error} error)`);
        }

        // Rate limit: 2s pause between batches
        if (i + BATCH_SIZE < visionTargets.length) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      console.log(`Wave 2 complete: ${wave2Stats.success} success, ${wave2Stats.skipped} skipped, ${wave2Stats.error} error\n`);
    }
  }

  console.log('=== Backfill Complete ===');
  console.log(`Final counts: ${stats.success} success / ${stats.nullSkipped} null_skipped / ${stats.error} error`);
}

main().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
