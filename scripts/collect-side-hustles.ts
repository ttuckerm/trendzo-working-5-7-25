#!/usr/bin/env npx tsx
/**
 * Side Hustles Data Collector via Apify
 *
 * Scrapes TikTok videos for side-hustle keywords/hashtags, stores them
 * in scraped_videos + scraped_video_metrics, dedupes by tiktok_id,
 * and enqueues each new video for prediction.
 *
 * Usage:
 *   npx tsx scripts/collect-side-hustles.ts                         (defaults: --limit 50 --days 7)
 *   npx tsx scripts/collect-side-hustles.ts --limit 200 --days 14   (space-separated)
 *   npx tsx scripts/collect-side-hustles.ts --limit=200 --days=14   (equals-separated)
 *   npx tsx scripts/collect-side-hustles.ts --dry-run
 *
 * Requires in .env.local:
 *   APIFY_API_TOKEN
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// ── Load env ──────────────────────────────────────────────────────────────────
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!APIFY_TOKEN) { console.error('Missing APIFY_API_TOKEN'); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env vars'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ── CLI args ──────────────────────────────────────────────────────────────────

const DEFAULT_LIMIT = 50;
const DEFAULT_DAYS = 7;

function parseArgs() {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const eqMatch = argv[i].match(/^--(\w[\w-]*)=(.+)$/);
    if (eqMatch) {
      // --flag=value
      args[eqMatch[1]] = eqMatch[2];
      continue;
    }
    const bareMatch = argv[i].match(/^--(\w[\w-]*)$/);
    if (bareMatch) {
      const key = bareMatch[1];
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        // --flag value
        args[key] = next;
        i++; // consume next token
      } else {
        // bare boolean flag (e.g. --dry-run)
        args[key] = 'true';
      }
    }
  }

  const limit = parseInt(args['limit'] || String(DEFAULT_LIMIT), 10);
  const days = parseInt(args['days'] || String(DEFAULT_DAYS), 10);
  const dryRun = args['dry-run'] === 'true';

  if (isNaN(limit) || limit <= 0) {
    console.error(`ERROR: --limit must be a positive integer, got "${args['limit']}"`);
    process.exit(1);
  }
  if (isNaN(days) || days <= 0) {
    console.error(`ERROR: --days must be a positive integer, got "${args['days']}"`);
    process.exit(1);
  }

  return { limit, days, dryRun };
}

const opts = parseArgs();

// ── Constants ─────────────────────────────────────────────────────────────────

const KEYWORDS = [
  'side hustle',
  'make money online',
  'online business',
  'passive income',
];

const HASHTAGS = [
  'sidehustle',
  'makemoneyonline',
  'onlinebusiness',
  'passiveincome',
  'sidehustleideas',
];

const NICHE = 'side_hustles';
const ACTOR_ID = 'clockworks~free-tiktok-scraper';

// Per-keyword cap so we spread across all keywords/hashtags
const PER_QUERY_LIMIT = Math.ceil(opts.limit / (KEYWORDS.length + HASHTAGS.length));

// ── Apify REST helpers ────────────────────────────────────────────────────────

interface ApifyItem {
  id?: string;
  webVideoUrl?: string;
  videoUrl?: string;
  text?: string;
  desc?: string;
  createTime?: string | number;
  videoDuration?: number;
  authorMeta?: {
    id?: string;
    name?: string;
    nickName?: string;
    followerCount?: number;
    verified?: boolean;
  };
  stats?: {
    playCount?: number;
    diggCount?: number;
    shareCount?: number;
    commentCount?: number;
    collectCount?: number;
  };
  hashtags?: Array<{ name?: string }>;
  musicMeta?: {
    musicId?: string;
    musicName?: string;
    musicAuthor?: string;
    musicOriginal?: boolean;
  };
  covers?: { default?: string; origin?: string };
  // Some scrapers use flat fields
  playCount?: number;
  diggCount?: number;
  shareCount?: number;
  commentCount?: number;
}

async function runApifyScraper(
  searchQueries: string[],
  isHashtag: boolean,
  maxItems: number,
): Promise<ApifyItem[]> {
  if (!Number.isInteger(maxItems) || maxItems <= 0) {
    throw new Error(`BUG: resultsPerPage must be a positive integer, got ${maxItems} (${typeof maxItems})`);
  }

  const body: Record<string, any> = {
    resultsPerPage: maxItems,
    shouldDownloadCovers: false,
    shouldDownloadSubtitles: false,
    shouldDownloadVideos: false,
  };

  if (isHashtag) {
    body.hashtags = searchQueries;
  } else {
    body.searchQueries = searchQueries;
  }

  const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=120`;

  console.log(`  → Apify call: ${isHashtag ? 'hashtags' : 'keywords'} = [${searchQueries.join(', ')}], max ${maxItems}`);

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Apify ${resp.status}: ${txt.slice(0, 200)}`);
  }

  const items: ApifyItem[] = await resp.json() as ApifyItem[];
  return Array.isArray(items) ? items : [];
}

// ── Parse Apify item → flat row ───────────────────────────────────────────────

interface ParsedVideo {
  tiktok_id: string;
  url: string;
  caption: string;
  author_handle: string;
  author_followers: number;
  author_verified: boolean;
  posted_at: string;
  duration_seconds: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  hashtags: string[];
  music_id: string | null;
  music_name: string | null;
  music_author: string | null;
  music_original: boolean;
  thumbnail_url: string | null;
  raw_json: any;
}

function parseItem(item: ApifyItem): ParsedVideo | null {
  const tiktokId = item.id;
  if (!tiktokId) return null;

  const webUrl = item.webVideoUrl || item.videoUrl || '';
  if (!webUrl) return null;

  // Parse createTime — can be epoch seconds (number) or ISO string
  let postedAt: string;
  if (typeof item.createTime === 'number') {
    postedAt = new Date(item.createTime * 1000).toISOString();
  } else if (item.createTime) {
    postedAt = new Date(item.createTime).toISOString();
  } else {
    postedAt = new Date().toISOString();
  }

  const stats = item.stats || {};

  return {
    tiktok_id: String(tiktokId),
    url: webUrl,
    caption: item.text || item.desc || '',
    author_handle: item.authorMeta?.name || '',
    author_followers: item.authorMeta?.followerCount || 0,
    author_verified: item.authorMeta?.verified || false,
    posted_at: postedAt,
    duration_seconds: item.videoDuration || 0,
    views: stats.playCount || item.playCount || 0,
    likes: stats.diggCount || item.diggCount || 0,
    comments: stats.commentCount || item.commentCount || 0,
    shares: stats.shareCount || item.shareCount || 0,
    saves: stats.collectCount || 0,
    hashtags: (item.hashtags || []).map(h => h.name || '').filter(Boolean),
    music_id: item.musicMeta?.musicId || null,
    music_name: item.musicMeta?.musicName || null,
    music_author: item.musicMeta?.musicAuthor || null,
    music_original: item.musicMeta?.musicOriginal || false,
    thumbnail_url: item.covers?.default || item.covers?.origin || null,
    raw_json: item,
  };
}

// ── Date filter ───────────────────────────────────────────────────────────────

function isWithinDays(isoDate: string, days: number): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(isoDate).getTime() >= cutoff;
}

// ── Enqueue video for prediction ──────────────────────────────────────────────

async function enqueuePrediction(videoId: string): Promise<boolean> {
  // Insert into video_files so runPredictionPipeline can reference it.
  // If it already exists (same ID), upsert gracefully.
  const { error } = await supabase
    .from('video_files')
    .upsert(
      {
        id: videoId,
        niche: NICHE,
        goal: 'go_viral',
        account_size_band: 'unknown',
        platform: 'tiktok',
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

  if (error) {
    console.warn(`    ⚠ Failed to upsert video_files for ${videoId}: ${error.message}`);
    return false;
  }

  // Mark the scraped_video as needs_processing so an existing pipeline worker
  // or a cron can pick it up.
  await supabase
    .from('scraped_videos')
    .update({ needs_processing: true, processing_priority: 1 })
    .eq('video_id', videoId);

  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  Side Hustles Data Collector (Apify → Supabase)     ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  limit : ${opts.limit} videos (per-query cap: ${PER_QUERY_LIMIT})`);
  console.log(`  days  : ${opts.days} days`);
  console.log(`  dry   : ${opts.dryRun}\n`);

  // Stats
  let collected = 0;
  let deduped = 0;
  let stored = 0;
  let metricsStored = 0;
  let enqueued = 0;
  let errors = 0;

  // 1. Fetch existing tiktok_ids so we can dedupe locally before insert
  const { data: existing } = await supabase
    .from('scraped_videos')
    .select('tiktok_id')
    .eq('niche', NICHE)
    .not('tiktok_id', 'is', null);

  const existingIds = new Set<string>((existing || []).map(r => r.tiktok_id));
  console.log(`  Existing side_hustles videos in DB: ${existingIds.size}\n`);

  // 2. Collect from Apify — keywords, then hashtags
  const allParsed: ParsedVideo[] = [];

  for (const kw of KEYWORDS) {
    try {
      const items = await runApifyScraper([kw], false, PER_QUERY_LIMIT);
      console.log(`    ← ${items.length} items for keyword "${kw}"`);
      for (const item of items) {
        const p = parseItem(item);
        if (p) allParsed.push(p);
      }
    } catch (e: any) {
      console.error(`    ✗ keyword "${kw}" failed: ${e.message}`);
      errors++;
    }
  }

  for (const tag of HASHTAGS) {
    try {
      const items = await runApifyScraper([tag], true, PER_QUERY_LIMIT);
      console.log(`    ← ${items.length} items for hashtag #${tag}`);
      for (const item of items) {
        const p = parseItem(item);
        if (p) allParsed.push(p);
      }
    } catch (e: any) {
      console.error(`    ✗ hashtag #${tag} failed: ${e.message}`);
      errors++;
    }
  }

  collected = allParsed.length;
  console.log(`\n  Raw collected: ${collected}`);

  // 3. Dedupe by tiktok_id (within batch + against DB)
  const seen = new Set<string>();
  const unique: ParsedVideo[] = [];

  for (const v of allParsed) {
    if (seen.has(v.tiktok_id) || existingIds.has(v.tiktok_id)) {
      deduped++;
      continue;
    }
    // Date filter
    if (!isWithinDays(v.posted_at, opts.days)) {
      deduped++;
      continue;
    }
    seen.add(v.tiktok_id);
    unique.push(v);
    if (unique.length >= opts.limit) break;
  }

  console.log(`  After dedupe + date filter: ${unique.length}  (deduped/filtered: ${deduped})\n`);

  if (opts.dryRun) {
    console.log('  [DRY RUN] Would store and enqueue the above. Exiting.');
    printSummary(collected, deduped, 0, 0, 0, errors);
    return;
  }

  // 4. Store into scraped_videos + scraped_video_metrics
  const now = new Date().toISOString();

  for (const v of unique) {
    const videoId = uuidv4();

    // 4a. Insert scraped_videos
    const { error: svErr } = await supabase.from('scraped_videos').insert({
      video_id: videoId,
      tiktok_id: v.tiktok_id,
      url: v.url,
      caption: v.caption,
      creator_username: v.author_handle,
      creator_followers: v.author_followers,
      creator_verified: v.author_verified,
      upload_timestamp: v.posted_at,
      created_at_utc: v.posted_at,
      duration_seconds: v.duration_seconds,
      views_count: v.views,
      likes_count: v.likes,
      comments_count: v.comments,
      shares_count: v.shares,
      saves_count: v.saves,
      hashtags: v.hashtags,
      music_id: v.music_id,
      music_name: v.music_name,
      music_author: v.music_author,
      music_is_original: v.music_original,
      thumbnail_url: v.thumbnail_url,
      niche: NICHE,
      source: 'apify-collector',
      platform: 'tiktok',
      needs_processing: true,
      processing_priority: 1,
      raw_scraping_data: v.raw_json,
      scraped_at: now,
      inserted_at: now,
    });

    if (svErr) {
      // Could be a unique constraint violation if tiktok_id race condition
      if (svErr.code === '23505') {
        deduped++;
      } else {
        console.warn(`    ⚠ scraped_videos insert failed: ${svErr.message}`);
        errors++;
      }
      continue;
    }
    stored++;

    // 4b. Insert metric snapshot
    const { error: smErr } = await supabase.from('scraped_video_metrics').insert({
      video_id: videoId,
      collected_at: now,
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      shares: v.shares,
      saves: v.saves,
      author_followers: v.author_followers,
    });

    if (smErr) {
      console.warn(`    ⚠ metrics insert failed for ${videoId}: ${smErr.message}`);
    } else {
      metricsStored++;
    }

    // 5. Enqueue for prediction
    const ok = await enqueuePrediction(videoId);
    if (ok) enqueued++;
  }

  // 6. Summary
  printSummary(collected, deduped, stored, enqueued, metricsStored, errors);
}

function printSummary(
  collected: number,
  deduped: number,
  stored: number,
  enqueued: number,
  metrics: number,
  errors: number,
) {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║          Collection Summary           ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Collected (raw)      : ${String(collected).padStart(6)}     ║`);
  console.log(`║  Deduped / filtered   : ${String(deduped).padStart(6)}     ║`);
  console.log(`║  Stored (new videos)  : ${String(stored).padStart(6)}     ║`);
  console.log(`║  Metric snapshots     : ${String(metrics).padStart(6)}     ║`);
  console.log(`║  Enqueued predictions : ${String(enqueued).padStart(6)}     ║`);
  console.log(`║  Errors               : ${String(errors).padStart(6)}     ║`);
  console.log('╚══════════════════════════════════════╝\n');
}

// ── Self-test (--self-test) ────────────────────────────────────────────────────
// Exercises parseArgs() with synthetic argv to prove both forms work.
// Run: npx tsx scripts/collect-side-hustles.ts --self-test

function selfTest() {
  console.log('Running CLI parser self-test...\n');

  const cases: { argv: string[]; expect: { limit: number; days: number; dryRun: boolean } }[] = [
    { argv: [],                                           expect: { limit: 50, days: 7, dryRun: false } },
    { argv: ['--limit', '200', '--days', '14'],           expect: { limit: 200, days: 14, dryRun: false } },
    { argv: ['--limit=100', '--days=3'],                  expect: { limit: 100, days: 3, dryRun: false } },
    { argv: ['--limit=75', '--days', '10', '--dry-run'],  expect: { limit: 75, days: 10, dryRun: true } },
    { argv: ['--dry-run', '--limit', '30'],               expect: { limit: 30, days: 7, dryRun: true } },
    { argv: ['--days=1'],                                 expect: { limit: 50, days: 1, dryRun: false } },
  ];

  // Temporarily override process.argv for each test case
  const originalArgv = process.argv;
  let passed = 0;

  for (const tc of cases) {
    process.argv = ['node', 'script.ts', ...tc.argv];
    const result = parseArgs();
    const ok =
      result.limit === tc.expect.limit &&
      result.days === tc.expect.days &&
      result.dryRun === tc.expect.dryRun;

    const status = ok ? 'PASS' : 'FAIL';
    const argStr = tc.argv.length ? tc.argv.join(' ') : '(none)';
    console.log(`  ${status}  argv=[${argStr}]  →  limit=${result.limit} days=${result.days} dry=${result.dryRun}`);
    if (!ok) {
      console.log(`        expected: limit=${tc.expect.limit} days=${tc.expect.days} dry=${tc.expect.dryRun}`);
    } else {
      passed++;
    }
  }

  process.argv = originalArgv;
  console.log(`\n  ${passed}/${cases.length} tests passed.`);

  if (passed < cases.length) {
    console.error('\n  SELF-TEST FAILED.');
    process.exit(1);
  }
  console.log('  All good.\n');
  process.exit(0);
}

// ── Entry ─────────────────────────────────────────────────────────────────────

if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });
}
