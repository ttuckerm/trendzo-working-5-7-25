#!/usr/bin/env npx tsx
/**
 * XGBoost Retrain Sandbox — Steps 1 & 2
 *
 * Step 1: Diagnostic on labeled data quality in prediction_runs.
 * Step 2: Extract the 58-feature vector for each clean labeled row.
 *
 * Feature sources (priority order):
 *   1. raw_result JSONB → component outputs (hook-scorer, thumbnail-analyzer,
 *      visual-scene-detector, xgboost features metadata)
 *   2. scraped_videos → caption, duration_seconds, creator_followers_count
 *   3. Text analysis → computed from caption/description
 *   4. NaN for unavailable features (XGBoost handles NaN natively)
 *
 * Output: data/xgboost-retrain-input.json
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { extractCreatorFeatures, CREATOR_FEATURE_NAMES } from '../src/lib/features/creator-trajectory';
import { extractCulturalFeatures, CULTURAL_FEATURE_NAMES } from '../src/lib/features/cultural-momentum';
import { extractAudienceFeatures, AUDIENCE_FEATURE_NAMES } from '../src/lib/features/audience-quality';
import { extractDistributionFeatures, DISTRIBUTION_FEATURE_NAMES } from '../src/lib/features/distribution-signals';
import { ALL_FEATURES } from '../src/lib/features/feature-matrix-builder';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

// Canonical v10 feature list (58 content features)
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

// ── DPS Tier Classification (matches dps-v2.ts) ─────────────────────────────

function classifyDpsTier(displayScore: number): string {
  if (displayScore >= 99.9) return 'mega-viral';
  if (displayScore >= 99.0) return 'hyper-viral';
  if (displayScore >= 95.0) return 'viral';
  if (displayScore >= 70.0) return 'above-average';
  if (displayScore >= 30.0) return 'average';
  if (displayScore >= 5.0) return 'below-average';
  return 'poor';
}

// ── Text Feature Extraction (from extract-prediction-features.ts) ────────────

const NEGATIVE_WORDS = ['hate', 'worst', 'terrible', 'bad', 'awful', 'horrible', 'never', 'ugly', 'disgusting', 'disappointing'];
const CTA_WORDS = ['follow', 'like', 'comment', 'share', 'subscribe', 'save', 'click', 'link'];
const HOOK_TYPE_MAP: Record<string, number> = {
  'weak': 0, 'question': 1, 'list_preview': 2, 'contrarian': 3, 'myth_bust': 4,
  'statistic': 5, 'authority': 6, 'result_preview': 7, 'personal_story': 8,
  'problem_identification': 9, 'urgency': 10,
};

function extractTextFeatures(text: string): Record<string, number | null> {
  if (!text || text.length < 5) return {};
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const lower = text.toLowerCase();
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));

  const countSyllables = (word: string): number => {
    const matches = word.toLowerCase().match(/[aeiouy]+/g);
    return matches ? matches.length : 1;
  };
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u2600-\u27BF]/g;

  return {
    text_word_count: words.length,
    text_sentence_count: sentences.length,
    text_question_mark_count: (text.match(/\?/g) || []).length,
    text_exclamation_count: (text.match(/!/g) || []).length,
    text_transcript_length: text.length,
    text_avg_sentence_length: sentences.length > 0 ? words.length / sentences.length : 0,
    text_unique_word_ratio: words.length > 0 ? uniqueWords.size / words.length : 0,
    text_avg_word_length: words.length > 0 ? words.reduce((s, w) => s + w.length, 0) / words.length : 0,
    text_syllable_count: syllableCount,
    text_flesch_reading_ease: words.length > 0 && sentences.length > 0
      ? 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllableCount / words.length)
      : null,
    text_has_cta: CTA_WORDS.some(w => lower.includes(w)) ? 1 : 0,
    text_negative_word_count: NEGATIVE_WORDS.filter(w => lower.includes(w)).length,
    text_emoji_count: (text.match(emojiRegex) || []).length,
  };
}

// ── v10 Text Analysis Features ───────────────────────────────────────────────

const SIDE_HUSTLE_TOOLS = [
  'etsy', 'shopify', 'printify', 'canva', 'chatgpt', 'fiverr', 'upwork',
  'amazon', 'ebay', 'gumroad', 'teachable', 'kajabi', 'convertkit',
  'mailchimp', 'stripe', 'paypal', 'tiktok', 'instagram', 'youtube',
  'pinterest', 'notion', 'airtable', 'zapier', 'midjourney',
  'dall-e', 'dalle', 'stable diffusion', 'clickfunnels',
  'redbubble', 'merch by amazon', 'printful', 'teespring',
  'amazon fba', 'amazon kdp', 'kindle', 'udemy', 'skillshare',
  'substack', 'patreon', 'stan store', 'linktree', 'whop', 'podia', 'thinkific',
];
const ACTION_VERBS = [
  'create', 'open', 'click', 'go', 'set up', 'sign up', 'upload', 'select',
  'type', 'paste', 'copy', 'build', 'start', 'launch', 'add', 'download',
  'install', 'connect', 'link', 'submit', 'publish', 'fill', 'choose',
  'enter', 'write', 'save', 'share', 'post', 'turn on', 'enable',
];
const SEQUENTIAL_MARKERS = [
  /\bfirst\b/gi, /\bsecond\b/gi, /\bthird\b/gi, /\bstep\s+\d+/gi,
  /\bnext\b/gi, /\bthen\b/gi, /\bfinally\b/gi, /\blastly\b/gi,
  /\bnumber\s+one\b/gi, /\bnumber\s+two\b/gi, /\bnumber\s+three\b/gi,
];
const HEDGE_PHRASES = [
  'maybe', 'probably', 'i think', 'i guess', 'kind of', 'sort of',
  'might', 'could be', 'not sure', "i don't know", 'possibly', 'perhaps',
  'it depends', 'in my opinion', 'some people say', 'you could try',
  'it might work', "i'm not certain", 'i believe', 'i feel like',
];

function extractV10TextFeatures(text: string, durationSeconds: number): Record<string, number | null> {
  if (!text || text.length < 5) return {};
  const lower = text.toLowerCase();
  const durationMinutes = Math.max(durationSeconds / 60, 1);
  const wordCount = Math.max(text.split(/\s+/).filter(w => w.length > 0).length, 1);

  let namedToolsCount = 0;
  for (const tool of SIDE_HUSTLE_TOOLS) {
    const regex = new RegExp(`\\b${tool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) namedToolsCount += matches.length;
  }
  const dollarMatches = text.match(/\$[\d,]+(?:\.\d{1,2})?/g) || [];
  let specificAmountsCount = 0;
  for (const m of dollarMatches) specificAmountsCount += /\$[\d,]*[1-9]\d{0,1}(?:\.\d{1,2})?$/.test(m) ? 1.5 : 1;
  const TIMEFRAME_PATTERNS = [
    /first\s+(?:month|week|day)/gi, /in\s+\d+\s+(?:days?|weeks?|months?|years?)/gi,
    /per\s+(?:month|week|day|hour|year)/gi, /\d+\s+(?:days?|weeks?|months?)\s+(?:ago|later|in)/gi,
    /(?:every|each)\s+(?:month|week|day)/gi,
  ];
  let timeframesCount = 0;
  for (const p of TIMEFRAME_PATTERNS) { const m = lower.match(p); if (m) timeframesCount += m.length; }

  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
  let imperativeCount = 0;
  for (const sentence of sentences) {
    const trimmed = sentence.trim().toLowerCase();
    for (const verb of ACTION_VERBS) {
      if (trimmed.startsWith(verb) || trimmed.startsWith('so ' + verb) ||
          trimmed.startsWith('and ' + verb) || trimmed.startsWith('now ' + verb)) {
        imperativeCount++; break;
      }
    }
  }
  let seqMarkerCount = 0;
  for (const p of SEQUENTIAL_MARKERS) { const m = lower.match(p); if (m) seqMarkerCount += m.length; }

  let hedgeCount = 0;
  for (const phrase of HEDGE_PHRASES) {
    const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const m = lower.match(regex);
    if (m) hedgeCount += m.length;
  }

  return {
    specificity_score: (namedToolsCount * 2 + specificAmountsCount * 3 + timeframesCount * 1) / durationMinutes,
    instructional_density: (imperativeCount + seqMarkerCount) / durationMinutes,
    has_step_structure: seqMarkerCount >= 3 ? 1 : 0,
    hedge_word_density: hedgeCount / wordCount,
  };
}

// ── Feature Extraction from raw_result JSONB ─────────────────────────────────

function extractFeaturesFromRawResult(rawResult: any): Record<string, number | null> {
  const features: Record<string, number | null> = {};
  if (!rawResult || !rawResult.features) return features;
  const f = rawResult.features;

  // hook-scorer component
  if (f['hook-scorer']) {
    const hs = f['hook-scorer'];
    features.hook_score = hs.hookScore ?? null;
    features.hook_confidence = hs.hookConfidence ?? (rawResult.paths?.[2]?.results?.find((r: any) => r.componentId === 'hook-scorer')?.confidence ?? null);
    features.hook_text_score = hs.textScore ?? null;
    features.hook_type_encoded = hs.hookType ? (HOOK_TYPE_MAP[hs.hookType] ?? 0) : null;
  }

  // visual-scene-detector
  if (f['visual-scene-detector']) {
    const vsd = f['visual-scene-detector'];
    features.visual_scene_count = vsd.sceneChanges ?? null;
    features.visual_score = vsd.visualScore != null ? vsd.visualScore * 10 : null;
    if (vsd.cutsPerSecond != null) features.ffmpeg_cuts_per_second = vsd.cutsPerSecond;
  }

  // thumbnail-analyzer
  if (f['thumbnail-analyzer']) {
    const ta = f['thumbnail-analyzer'];
    features.thumb_brightness = ta.brightness ?? null;
    features.thumb_contrast = ta.contrast ?? null;
    features.thumb_colorfulness = ta.colorfulness ?? null;
    features.thumb_overall_score = ta.visualScore != null ? ta.visualScore * 10 : null;
  }

  // visual-rubric Pack V
  if (f['visual-rubric']) {
    const vr = f['visual-rubric'];
    if (vr.overall_visual_score != null) {
      if (features.visual_score == null) features.visual_score = vr.overall_visual_score;
    }
  }

  return features;
}

// ── Vocal Confidence Composite (matches live extraction) ─────────────────────

const CONFIDENCE_ANCHORS = {
  pitch_variance: { p5: 0.5, p95: 45.0 },
  loudness_variance: { p5: 0.01, p95: 8.0 },
  silence_ratio: { p5: 0.01, p95: 0.45 },
};

function computeVocalConfidence(features: Record<string, number | null>): number | null {
  const components: { value: number; weight: number }[] = [];
  const normalize = (v: number, p5: number, p95: number) => Math.max(0, Math.min(1, (v - p5) / (p95 - p5)));

  if (features.audio_pitch_variance != null) {
    components.push({ value: 1 - normalize(features.audio_pitch_variance, CONFIDENCE_ANCHORS.pitch_variance.p5, CONFIDENCE_ANCHORS.pitch_variance.p95), weight: 0.35 });
  }
  if (features.audio_loudness_variance != null) {
    components.push({ value: 1 - normalize(features.audio_loudness_variance, CONFIDENCE_ANCHORS.loudness_variance.p5, CONFIDENCE_ANCHORS.loudness_variance.p95), weight: 0.35 });
  }
  if (features.audio_silence_ratio != null) {
    components.push({ value: 1 - normalize(features.audio_silence_ratio, CONFIDENCE_ANCHORS.silence_ratio.p5, CONFIDENCE_ANCHORS.silence_ratio.p95), weight: 0.3 });
  }

  if (components.length === 0) return null;
  const totalWeight = components.reduce((s, c) => s + c.weight, 0);
  return Math.max(0, Math.min(1, components.reduce((s, c) => s + c.value * (c.weight / totalWeight), 0)));
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  STEP 1: Diagnostic on Labeled Data Quality                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ── 1a. Query all clean labeled rows ───────────────────────────────────
  const { data: labeledRows, error: labelErr } = await supabase
    .from('prediction_runs')
    .select('id, video_id, actual_dps, dps_v2_display_score, actual_tier, actual_views, actual_likes, actual_comments, actual_shares, actual_saves, actual_follower_count, predicted_dps_7d, raw_result, dps_v2_incomplete, created_at')
    .or('actual_dps.not.is.null,dps_v2_display_score.not.is.null')
    .neq('dps_v2_incomplete', true);

  if (labelErr) { console.error('Query error:', labelErr.message); process.exit(1); }

  // Deduplicate by video_id (keep latest)
  const seenVideoIds = new Set<string>();
  const uniqueRows = (labeledRows || [])
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter((r: any) => {
      if (seenVideoIds.has(r.video_id)) return false;
      seenVideoIds.add(r.video_id);
      return true;
    });

  console.log(`  Total labeled rows (raw): ${(labeledRows || []).length}`);
  console.log(`  After dedup by video_id: ${uniqueRows.length}`);

  // Get display score for each row
  const rows = uniqueRows.map((r: any) => ({
    ...r,
    display_score: r.dps_v2_display_score ?? r.actual_dps,
    tier: r.actual_tier ?? classifyDpsTier(r.dps_v2_display_score ?? r.actual_dps),
  }));

  // ── 1b. Report totals ────────────────────────────────────────────────
  console.log(`\n  (a) Total clean labeled rows: ${rows.length}`);

  if (rows.length < 50) {
    console.log('\n  ⛔ STOP: Fewer than 50 clean rows survived filtering.');
    console.log('  Fix data quality before retraining.');
    process.exit(1);
  }

  // ── 1c. Tier distribution ─────────────────────────────────────────────
  const tierDist = new Map<string, number>();
  for (const r of rows) tierDist.set(r.tier, (tierDist.get(r.tier) || 0) + 1);

  console.log('\n  (b) DPS Tier Distribution:');
  const tierOrder = ['mega-viral', 'hyper-viral', 'viral', 'above-average', 'average', 'below-average', 'poor'];
  for (const tier of tierOrder) {
    const cnt = tierDist.get(tier) || 0;
    if (cnt > 0) {
      const bar = '█'.repeat(Math.ceil(cnt / 2));
      console.log(`      ${tier.padEnd(18)} ${String(cnt).padStart(3)} ${bar}`);
    }
  }

  // ── 1d. View count spread ─────────────────────────────────────────────
  const views = rows.filter((r: any) => r.actual_views != null && r.actual_views > 0).map((r: any) => r.actual_views).sort((a: number, b: number) => a - b);
  const dpsScores = rows.map((r: any) => r.display_score).sort((a: number, b: number) => a - b);

  console.log('\n  (c) View Count Spread:');
  if (views.length > 0) {
    console.log(`      Min:    ${views[0].toLocaleString()}`);
    console.log(`      Q1:     ${views[Math.floor(views.length * 0.25)].toLocaleString()}`);
    console.log(`      Median: ${views[Math.floor(views.length * 0.5)].toLocaleString()}`);
    console.log(`      Q3:     ${views[Math.floor(views.length * 0.75)].toLocaleString()}`);
    console.log(`      Max:    ${views[views.length - 1].toLocaleString()}`);
  }
  console.log(`\n      DPS range: ${dpsScores[0]?.toFixed(1)} — ${dpsScores[dpsScores.length - 1]?.toFixed(1)}`);
  console.log(`      DPS mean:  ${(dpsScores.reduce((s: number, v: number) => s + v, 0) / dpsScores.length).toFixed(1)}`);
  console.log(`      DPS median: ${dpsScores[Math.floor(dpsScores.length / 2)]?.toFixed(1)}`);

  // ── 1e. Missing data ──────────────────────────────────────────────────
  const missingFollowers = rows.filter((r: any) => !r.actual_follower_count || r.actual_follower_count === 0).length;
  const missingViews = rows.filter((r: any) => !r.actual_views || r.actual_views === 0).length;
  const missingEngagement = rows.filter((r: any) => r.actual_likes == null && r.actual_shares == null).length;

  console.log('\n  (d) Missing Data:');
  console.log(`      Missing follower_count: ${missingFollowers}`);
  console.log(`      Missing views:          ${missingViews}`);
  console.log(`      Missing engagement:     ${missingEngagement}`);

  // ── 1f. Concentration warning ─────────────────────────────────────────
  console.log('\n  (e) Tier Concentration Check:');
  const maxTierPct = Math.max(...[...tierDist.values()].map(c => c / rows.length * 100));
  const maxTier = [...tierDist.entries()].find(([, c]) => c / rows.length * 100 === maxTierPct)?.[0];
  if (maxTierPct > 60) {
    console.log(`      ⚠️  WARNING: ${maxTierPct.toFixed(0)}% concentrated in "${maxTier}" tier.`);
    console.log('      Model may struggle with underrepresented tiers.');
  } else {
    console.log(`      ✅ Largest tier: "${maxTier}" at ${maxTierPct.toFixed(0)}% — acceptable spread.`);
  }

  const hasViral = (tierDist.get('viral') || 0) + (tierDist.get('hyper-viral') || 0) + (tierDist.get('mega-viral') || 0);
  const hasBelowAvg = (tierDist.get('below-average') || 0) + (tierDist.get('poor') || 0);
  if (hasViral === 0) console.log('      ⚠️  WARNING: No viral/hyper-viral/mega-viral samples. Model cannot learn what "viral" looks like.');
  if (hasBelowAvg < 3) console.log(`      ⚠️  WARNING: Only ${hasBelowAvg} below-average/poor samples.`);

  // ══════════════════════════════════════════════════════════════════════
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  STEP 2: Extract Features for All Clean Labeled Rows        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Get scraped_videos data for videos that exist there
  const videoIds = rows.map((r: any) => r.video_id);
  const scrapedMap = new Map<string, any>();
  const batchSize = 50;
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const { data: svBatch } = await supabase
      .from('scraped_videos')
      .select('video_id, caption, description, duration_seconds, creator_followers_count, views_count, hashtags, niche')
      .in('video_id', batch);
    for (const sv of (svBatch || [])) scrapedMap.set(sv.video_id, sv);
  }
  console.log(`  Scraped video matches: ${scrapedMap.size}/${rows.length}`);

  // Try to load creator_id mapping (column may not exist yet)
  const creatorIdMap = new Map<string, string>();
  try {
    const runIds = rows.map((r: any) => r.id);
    for (let i = 0; i < runIds.length; i += batchSize) {
      const batch = runIds.slice(i, i + batchSize);
      const { data: cidBatch, error: cidErr } = await supabase
        .from('prediction_runs')
        .select('id, creator_id')
        .in('id', batch)
        .not('creator_id', 'is', null);
      if (cidErr) throw cidErr;
      for (const r of (cidBatch || [])) {
        if (r.creator_id) creatorIdMap.set(r.id, r.creator_id);
      }
    }
    console.log(`  Creator ID matches: ${creatorIdMap.size}/${rows.length}`);
  } catch {
    console.log('  Creator ID column not available — using default trajectory features for all rows');
  }

  // Extract features for each row
  const outputRows: any[] = [];
  const extractionErrors: { video_id: string; reason: string }[] = [];
  let totalFeaturesExtracted = 0;

  for (const row of rows) {
    const features: Record<string, number | null> = {};
    for (const fname of V10_FEATURES) features[fname] = null;

    let featureCount = 0;
    const scraped = scrapedMap.get(row.video_id);
    const rawResult = row.raw_result;

    // Source 1: raw_result JSONB (component outputs)
    if (rawResult) {
      const rawFeatures = extractFeaturesFromRawResult(rawResult);
      for (const [k, v] of Object.entries(rawFeatures)) {
        if (v != null && V10_FEATURES.includes(k)) {
          features[k] = v;
          featureCount++;
        }
      }
    }

    // Source 2: scraped_videos metadata
    const durationSeconds = scraped?.duration_seconds ?? (rawResult?.features?.['visual-scene-detector']?.cutsPerSecond > 0 && rawResult?.features?.['visual-scene-detector']?.sceneChanges > 0
      ? rawResult.features['visual-scene-detector'].sceneChanges / rawResult.features['visual-scene-detector'].cutsPerSecond
      : null);

    if (durationSeconds != null && durationSeconds > 0) {
      features.meta_duration_seconds = durationSeconds;
      features.ffmpeg_duration_seconds = durationSeconds;
      featureCount += 2;
    }

    const followerCount = row.actual_follower_count ?? scraped?.creator_followers_count;
    if (followerCount != null && followerCount > 0) {
      features.creator_followers_log = Math.log10(followerCount + 1);
      featureCount++;
    }

    // Source 3: Text features from caption/description
    const textSource = scraped?.caption ?? scraped?.description ?? '';
    if (textSource && textSource.length >= 5) {
      const textFeatures = extractTextFeatures(textSource);
      for (const [k, v] of Object.entries(textFeatures)) {
        if (v != null && V10_FEATURES.includes(k) && features[k] == null) {
          features[k] = v;
          featureCount++;
        }
      }

      // Speaking rate and words per second from text + duration
      if (features.text_word_count != null && durationSeconds != null && durationSeconds > 0) {
        features.speaking_rate_wpm = (features.text_word_count / durationSeconds) * 60;
        features.meta_words_per_second = features.text_word_count / durationSeconds;
        featureCount += 2;
      }

      // v10 text-analysis features
      const dur = durationSeconds ?? 60;
      const v10Text = extractV10TextFeatures(textSource, dur);
      for (const [k, v] of Object.entries(v10Text)) {
        if (v != null && V10_FEATURES.includes(k) && features[k] == null) {
          features[k] = v;
          featureCount++;
        }
      }
    }

    // Vocal confidence composite (from any extracted audio features)
    const vc = computeVocalConfidence(features);
    if (vc != null) { features.vocal_confidence_composite = vc; featureCount++; }

    // post_hour_utc and post_day_of_week are training-only context (always null at prediction)
    features.post_hour_utc = null;
    features.post_day_of_week = null;

    // ── Creator trajectory features (5 new features) ────────────────────
    const creatorId = creatorIdMap.get(row.id) || null;
    const videoPostDate = new Date(row.created_at);
    const creatorFeatures = await extractCreatorFeatures(
      creatorId || '',
      videoPostDate,
      supabase,
    );
    features.creator_momentum_30d = creatorFeatures.creator_momentum_30d;
    features.creator_avg_vps_90d = creatorFeatures.creator_avg_vps_90d;
    features.creator_viral_recency = creatorFeatures.creator_viral_recency;
    features.creator_consistency_score = creatorFeatures.creator_consistency_score;
    features.creator_trajectory_label = creatorFeatures.creator_trajectory_label;
    featureCount += 5;

    // ── Cultural momentum features (4 new features) ──────────────────────
    const videoNiche = scraped?.niche || '';
    const videoTopic = scraped?.caption || scraped?.description || '';
    const culturalFeatures = await extractCulturalFeatures(
      videoNiche,
      videoTopic,
      videoPostDate,
      supabase,
    );
    features.cultural_momentum_score = culturalFeatures.cultural_momentum_score;
    features.trend_phase_encoded = culturalFeatures.trend_phase_encoded;
    features.niche_activation_score = culturalFeatures.niche_activation_score;
    features.cultural_timing_advantage = culturalFeatures.cultural_timing_advantage;
    featureCount += 4;

    // ── Audience quality features (5 new features) ───────────────────────
    const audienceFeatures = await extractAudienceFeatures(
      creatorId || '',
      supabase,
    );
    features.follower_count_log = audienceFeatures.follower_count_log;
    features.engagement_rate_estimate = audienceFeatures.engagement_rate_estimate;
    features.follower_growth_velocity = audienceFeatures.follower_growth_velocity;
    features.audience_size_tier = audienceFeatures.audience_size_tier;
    features.follower_quality_score = audienceFeatures.follower_quality_score;
    featureCount += 5;

    // ── Distribution signal features (6 new features) ────────────────────
    const distFeatures = await extractDistributionFeatures(
      row.video_id,
      audienceFeatures.audience_size_tier,
      supabase,
    );
    features.post_hour_score = distFeatures.post_hour_score;
    features.post_day_score = distFeatures.post_day_score;
    features.hashtag_strategy_score = distFeatures.hashtag_strategy_score;
    features.sound_advantage_score = distFeatures.sound_advantage_score;
    features.early_velocity_signal = distFeatures.early_velocity_signal;
    features.distribution_composite = distFeatures.distribution_composite;
    featureCount += 6;

    // Log first row's new features for verification
    if (outputRows.length === 0) {
      console.log('\n  ── First row creator trajectory features ──');
      console.log(`    creator_id:               ${creatorId || '(none)'}`);
      console.log(`    creator_momentum_30d:      ${creatorFeatures.creator_momentum_30d}`);
      console.log(`    creator_avg_vps_90d:       ${creatorFeatures.creator_avg_vps_90d}`);
      console.log(`    creator_viral_recency:     ${creatorFeatures.creator_viral_recency}`);
      console.log(`    creator_consistency_score:  ${creatorFeatures.creator_consistency_score}`);
      console.log(`    creator_trajectory_label:   ${creatorFeatures.creator_trajectory_label}`);
      console.log('  ── First row cultural momentum features ──');
      console.log(`    niche:                     ${videoNiche || '(none)'}`);
      console.log(`    cultural_momentum_score:    ${culturalFeatures.cultural_momentum_score}`);
      console.log(`    trend_phase_encoded:        ${culturalFeatures.trend_phase_encoded}`);
      console.log(`    niche_activation_score:     ${culturalFeatures.niche_activation_score}`);
      console.log(`    cultural_timing_advantage:  ${culturalFeatures.cultural_timing_advantage}`);
      console.log('  ── First row audience quality features ──');
      console.log(`    follower_count_log:         ${audienceFeatures.follower_count_log}`);
      console.log(`    engagement_rate_estimate:   ${audienceFeatures.engagement_rate_estimate}`);
      console.log(`    follower_growth_velocity:   ${audienceFeatures.follower_growth_velocity}`);
      console.log(`    audience_size_tier:          ${audienceFeatures.audience_size_tier}`);
      console.log(`    follower_quality_score:      ${audienceFeatures.follower_quality_score}`);
      console.log('  ── First row distribution signal features ──');
      console.log(`    video_id:                   ${row.video_id}`);
      console.log(`    post_hour_score:            ${distFeatures.post_hour_score}`);
      console.log(`    post_day_score:             ${distFeatures.post_day_score}`);
      console.log(`    hashtag_strategy_score:     ${distFeatures.hashtag_strategy_score}`);
      console.log(`    sound_advantage_score:      ${distFeatures.sound_advantage_score}`);
      console.log(`    early_velocity_signal:      ${distFeatures.early_velocity_signal}`);
      console.log(`    distribution_composite:     ${distFeatures.distribution_composite}`);
    }

    if (featureCount < 3) {
      extractionErrors.push({ video_id: row.video_id, reason: `Only ${featureCount} features extractable (minimum 3)` });
      continue;
    }

    totalFeaturesExtracted += featureCount;
    outputRows.push({
      video_id: row.video_id,
      features,
      actual_dps_display_score: row.display_score,
      actual_dps_tier: row.tier,
      actual_views: row.actual_views,
      actual_follower_count: followerCount,
      feature_count: featureCount,
      null_feature_count: ALL_FEATURES.length - featureCount,
      has_scraped_data: !!scraped,
      has_raw_result: !!rawResult,
    });
  }

  // Feature extraction summary
  const avgFeatures = totalFeaturesExtracted / outputRows.length;
  console.log(`\n  Rows with features: ${outputRows.length}/${rows.length}`);
  console.log(`  Extraction failures: ${extractionErrors.length}`);
  console.log(`  Training with ${ALL_FEATURES.length} features (${V10_FEATURES.length} content + ${CREATOR_FEATURE_NAMES.length} creator + ${CULTURAL_FEATURE_NAMES.length} cultural + ${AUDIENCE_FEATURE_NAMES.length} audience + ${DISTRIBUTION_FEATURE_NAMES.length} distribution)`);
  console.log(`  Avg features per row: ${avgFeatures.toFixed(1)}/${ALL_FEATURES.length}`);

  // Feature coverage by category
  const featureCoverage = new Map<string, { filled: number; total: number }>();
  for (const fname of ALL_FEATURES) {
    const prefix = fname.split('_')[0];
    if (!featureCoverage.has(prefix)) featureCoverage.set(prefix, { filled: 0, total: 0 });
    const stat = featureCoverage.get(prefix)!;
    stat.total += outputRows.length;
    stat.filled += outputRows.filter(r => r.features[fname] != null).length;
  }
  console.log('\n  Feature Coverage by Category:');
  for (const [prefix, stat] of [...featureCoverage.entries()].sort((a, b) => b[1].filled / b[1].total - a[1].filled / a[1].total)) {
    const pct = (stat.filled / stat.total * 100).toFixed(0);
    console.log(`    ${prefix.padEnd(12)} ${pct}% filled`);
  }

  if (extractionErrors.length > 0) {
    console.log(`\n  Extraction errors:`);
    for (const e of extractionErrors) console.log(`    ${e.video_id}: ${e.reason}`);
  }

  // Save output
  const output = {
    rows: outputRows.map(r => ({
      video_id: r.video_id,
      features: r.features,
      actual_dps_display_score: r.actual_dps_display_score,
      actual_dps_tier: r.actual_dps_tier,
      actual_dps_z_score: null,
    })),
    metadata: {
      total_rows: outputRows.length,
      feature_count: ALL_FEATURES.length,
      feature_names: ALL_FEATURES,
      cohort_size: 6718,
      avg_features_per_row: Math.round(avgFeatures * 10) / 10,
      source: 'prediction_runs (labeled) + raw_result JSONB + scraped_videos',
      timestamp: new Date().toISOString(),
      v10_training_rows: 863,
      feature_coverage: Object.fromEntries(
        [...featureCoverage.entries()].map(([k, v]) => [k, Math.round(v.filled / v.total * 100)])
      ),
    },
  };

  const outDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'xgboost-retrain-input.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\n  ✅ Saved ${outputRows.length} rows to ${outPath}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
