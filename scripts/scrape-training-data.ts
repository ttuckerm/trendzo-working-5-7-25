#!/usr/bin/env npx tsx
/**
 * Profile-Based TikTok Scraper for Training Data
 *
 * Scrapes ALL videos from 20 specific side-hustles creators using
 * the Apify profile scraper, stores them in scraped_videos, then
 * computes DPS (Dynamic Performance Score) for every new row.
 *
 * Usage:
 *   npx tsx scripts/scrape-training-data.ts
 *   npx tsx scripts/scrape-training-data.ts --dry-run
 *   npx tsx scripts/scrape-training-data.ts --batch-size=5
 *
 * Requires in .env.local:
 *   APIFY_API_TOKEN
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ── Load env ──────────────────────────────────────────────────────────────────
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const APIFY_TOKEN = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!APIFY_TOKEN) { console.error('Missing APIFY_API_TOKEN'); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env vars'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTOR_PROFILE = 'clockworks~tiktok-profile-scraper';
const API_BASE = 'https://api.apify.com/v2';
const NICHE = 'side-hustles';
const SOURCE = 'profile_scrape_training';
const RESULTS_PER_PAGE = 50;

const CREATORS = [
  'theofficialecomchapman', 'officialnigellavers', 'liannebudgets', 'natlie.styles',
  'simply.nilly', 'notesbynathan', 'maxtalkstech', 'moneywithfar1', 'paulylong',
  'successwithalley', 'kellanhenneberry', 'jparkecom', 'digitalkingship',
  'realdennisdemarino5', 'melyndagerrard', 'shaylynnstudios', 'evo.gisselle',
  'monetizewitheddie', 'achievewithcharlie', 'the6figurewelder',
];

// ── CLI args ──────────────────────────────────────────────────────────────────

function parseArgs() {
  const args: Record<string, string> = {};
  for (let i = 2; i < process.argv.length; i++) {
    const eq = process.argv[i].match(/^--(\w[\w-]*)=(.+)$/);
    if (eq) { args[eq[1]] = eq[2]; continue; }
    const bare = process.argv[i].match(/^--(\w[\w-]*)$/);
    if (bare) {
      const next = process.argv[i + 1];
      if (next && !next.startsWith('--')) { args[bare[1]] = next; i++; }
      else { args[bare[1]] = 'true'; }
    }
  }
  return {
    dryRun: args['dry-run'] === 'true',
    dpsOnly: args['dps-only'] === 'true', // skip scraping, just recompute DPS
    batchSize: parseInt(args['batch-size'] || '5', 10), // creators per Apify call
  };
}

const opts = parseArgs();

// ── Apify Profile Scraper ─────────────────────────────────────────────────────

async function scrapeProfiles(usernames: string[]): Promise<any[]> {
  const input = {
    profiles: usernames,
    resultsPerPage: RESULTS_PER_PAGE,
    shouldDownloadSubtitles: true,
    shouldDownloadCovers: false,
    shouldDownloadSlideshowImages: false,
    shouldDownloadVideos: false,
  };

  const timeout = 300; // 5 min for profile scrapes
  const url = `${API_BASE}/acts/${ACTOR_PROFILE}/run-sync-get-dataset-items?timeout=${timeout}`;

  console.log(`  → Apify profile scrape: ${usernames.length} creators, ${RESULTS_PER_PAGE} results/page`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${APIFY_TOKEN}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Apify API error ${response.status}: ${text.slice(0, 500)}`);
  }

  const items: any[] = await response.json();
  console.log(`  ← ${items.length} items returned`);
  return items;
}

// ── Extract metrics (same logic as scrape-label.ts) ───────────────────────────

interface ScrapedMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

function extractMetrics(raw: any): ScrapedMetrics | null {
  if (!raw) return null;
  const stats = raw.stats || raw.statsV2 || {};
  const views = Number(raw.playCount ?? stats.playCount ?? 0);
  const likes = Number(raw.diggCount ?? stats.diggCount ?? 0);
  const comments = Number(raw.commentCount ?? stats.commentCount ?? 0);
  const shares = Number(raw.shareCount ?? stats.shareCount ?? 0);
  const saves = Number(raw.collectCount ?? stats.collectCount ?? 0);
  if (views === 0 && likes === 0 && comments === 0) return null;
  return { views, likes, comments, shares, saves };
}

// ── Parse raw Apify item → DB row ────────────────────────────────────────────

interface VideoRow {
  video_id: string;
  tiktok_id: string;
  url: string;
  caption: string;
  creator_username: string;
  creator_id: string | null;
  creator_nickname: string | null;
  creator_followers_count: number;
  creator_verified: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  duration_seconds: number | null;
  transcript_text: string | null;
  hashtags: string[];
  upload_timestamp: string | null;
  created_at_utc: string | null;
  niche: string;
  source: string;
  platform: string;
  needs_processing: boolean;
  raw_scraping_data: any;
  scraped_at: string;
  inserted_at: string;
}

function parseItem(raw: any, now: string): VideoRow | null {
  const id = raw.id;
  if (!id) return null;

  const metrics = extractMetrics(raw);
  if (!metrics) return null;

  // Build canonical URL
  const authorName = raw.authorMeta?.name || raw.authorMeta?.nickName || '';
  const webUrl = raw.webVideoUrl ||
    (authorName && id ? `https://www.tiktok.com/@${authorName}/video/${id}` : '');
  if (!webUrl) return null;

  // Parse createTime
  let uploadTimestamp: string | null = null;
  const ct = raw.createTime ?? raw.createTimeISO;
  if (typeof ct === 'number') {
    uploadTimestamp = new Date(ct > 1e12 ? ct : ct * 1000).toISOString();
  } else if (typeof ct === 'string') {
    const parsed = new Date(ct);
    if (!isNaN(parsed.getTime())) uploadTimestamp = parsed.toISOString();
  }

  // Extract subtitles → transcript text
  let transcriptText: string | null = null;
  if (Array.isArray(raw.subtitles) && raw.subtitles.length > 0) {
    transcriptText = raw.subtitles
      .map((s: any) => s.text || '')
      .filter(Boolean)
      .join(' ');
  }

  // Hashtags
  const hashtags = (raw.hashtags || [])
    .map((h: any) => h.name || h.title || '')
    .filter(Boolean);

  return {
    video_id: String(id),
    tiktok_id: String(id),
    url: webUrl,
    caption: raw.text || raw.desc || '',
    creator_username: authorName,
    creator_id: raw.authorMeta?.id || null,
    creator_nickname: raw.authorMeta?.nickName || null,
    creator_followers_count: raw.authorMeta?.fans || raw.authorMeta?.followerCount || 0,
    creator_verified: raw.authorMeta?.verified || false,
    views_count: metrics.views,
    likes_count: metrics.likes,
    comments_count: metrics.comments,
    shares_count: metrics.shares,
    saves_count: metrics.saves,
    duration_seconds: raw.videoMeta?.duration || raw.video?.duration || null,
    transcript_text: transcriptText,
    hashtags,
    upload_timestamp: uploadTimestamp,
    created_at_utc: uploadTimestamp,
    niche: NICHE,
    source: SOURCE,
    platform: 'tiktok',
    needs_processing: false,
    raw_scraping_data: raw,
    scraped_at: now,
    inserted_at: now,
  };
}

// ── DPS scoring removed (2026-03-25) ─────────────────────────────────────────
// Legacy inline DPS formula deleted. Ground-truth scoring is in
// src/lib/training/dps-v2.ts. scraped_videos rows no longer get dps_score
// at import time — raw metrics are stored and v2 uses them for cohort stats.

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Profile-Based Training Data Scraper                     ║');
  console.log('║  Apify → scraped_videos → DPS labeling                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`  Creators : ${CREATORS.length}`);
  console.log(`  Niche    : ${NICHE}`);
  console.log(`  Batch    : ${opts.batchSize} creators per Apify call`);
  console.log(`  DPS only : ${opts.dpsOnly}`);
  console.log(`  Dry run  : ${opts.dryRun}\n`);

  // Track stats
  let totalScraped = 0;
  let totalInserted = 0;
  let totalDupes = 0;
  let totalErrors = 0;
  const perCreator: Record<string, number> = {};
  const newVideoIds: string[] = [];

  if (opts.dpsOnly) {
    console.log('  [DPS-ONLY] --dps-only mode removed (2026-03-25). DPS scoring is now in dps-v2.ts.');
    console.log('  Use scripts/rescore-legacy-to-v2.ts for labeling.');
    return;
  }

  // 1. Fetch existing video IDs to dedupe locally
  const { data: existing } = await supabase
    .from('scraped_videos')
    .select('video_id')
    .eq('niche', NICHE);
  const existingIds = new Set<string>((existing || []).map((r: any) => r.video_id));
  console.log(`  Existing ${NICHE} videos in DB: ${existingIds.size}\n`);

  // 2. Scrape in batches of creators
  const now = new Date().toISOString();
  for (let i = 0; i < CREATORS.length; i += opts.batchSize) {
    const batch = CREATORS.slice(i, i + opts.batchSize);
    console.log(`\n── Batch ${Math.floor(i / opts.batchSize) + 1}: ${batch.join(', ')} ──`);

    let items: any[];
    try {
      items = await scrapeProfiles(batch);
    } catch (err: any) {
      console.error(`  ✗ Apify error: ${err.message}`);
      totalErrors++;
      continue;
    }

    totalScraped += items.length;

    // Parse and upsert each item
    for (const raw of items) {
      const row = parseItem(raw, now);
      if (!row) continue;

      // Track creator
      const creator = row.creator_username;
      perCreator[creator] = (perCreator[creator] || 0) + 1;

      // Skip duplicates
      if (existingIds.has(row.video_id)) {
        totalDupes++;
        continue;
      }

      if (opts.dryRun) {
        totalInserted++;
        newVideoIds.push(row.video_id);
        existingIds.add(row.video_id);
        continue;
      }

      // Upsert to scraped_videos
      const { error } = await supabase
        .from('scraped_videos')
        .upsert(row, { onConflict: 'video_id' });

      if (error) {
        if (error.code === '23505') {
          totalDupes++;
        } else {
          console.warn(`    ⚠ Insert failed for ${row.video_id}: ${error.message}`);
          totalErrors++;
        }
        continue;
      }

      totalInserted++;
      newVideoIds.push(row.video_id);
      existingIds.add(row.video_id);
    }

    console.log(`  Batch result: ${items.length} scraped, ${totalInserted} inserted so far`);
  }

  console.log(`\n══ Scraping complete ══`);
  console.log(`  Total scraped: ${totalScraped}`);
  console.log(`  Inserted: ${totalInserted}`);
  console.log(`  Duplicates: ${totalDupes}`);
  console.log(`  Errors: ${totalErrors}`);

  if (opts.dryRun) {
    console.log('\n  [DRY RUN] Skipping DPS computation.');
    printSummary(totalScraped, totalInserted, totalDupes, totalErrors, perCreator, {});
    return;
  }

  // DPS scoring removed (2026-03-25) — raw metrics stored; v2 uses them for cohort stats.
  printSummary(totalScraped, totalInserted, totalDupes, totalErrors, perCreator, {});
}

function printSummary(
  scraped: number,
  inserted: number,
  dupes: number,
  errors: number,
  perCreator: Record<string, number>,
  tierCounts: Record<string, number>,
) {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    SCRAPE SUMMARY                        ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Total scraped       : ${String(scraped).padStart(6)}                            ║`);
  console.log(`║  New inserted        : ${String(inserted).padStart(6)}                            ║`);
  console.log(`║  Duplicates skipped  : ${String(dupes).padStart(6)}                            ║`);
  console.log(`║  Errors              : ${String(errors).padStart(6)}                            ║`);
  console.log('╠═══════════════════════════════════════════════════════════╣');

  if (Object.keys(tierCounts).length > 0) {
    console.log('║  DPS Tier Breakdown:                                     ║');
    for (const tier of ['mega-viral', 'viral', 'good', 'average', 'low']) {
      const count = tierCounts[tier] || 0;
      console.log(`║    ${tier.padEnd(12)} : ${String(count).padStart(6)}                            ║`);
    }
    console.log('╠═══════════════════════════════════════════════════════════╣');
  }

  console.log('║  Per-Creator Counts:                                     ║');
  const sorted = Object.entries(perCreator).sort((a, b) => b[1] - a[1]);
  for (const [creator, count] of sorted) {
    console.log(`║    @${creator.padEnd(28)} : ${String(count).padStart(4)}          ║`);
  }

  console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

// ── Entry ─────────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
