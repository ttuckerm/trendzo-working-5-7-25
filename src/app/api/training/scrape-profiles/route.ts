/**
 * API Route: /api/training/scrape-profiles
 *
 * Triggers profile-based TikTok scraping for side-hustles creators.
 * Scrapes all videos, stores in scraped_videos, computes DPS v2 for
 * scraped_videos classification.
 *
 * NOTE: This route writes to scraped_videos (not prediction_runs).
 * DPS v2 computation is used for consistency.
 *
 * POST /api/training/scrape-profiles
 * Body (optional): { "creators": [...], "batchSize": 5 }
 */

import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import {
  computeDpsV2FromRows,
  type DpsV2RawMetrics,
  type ScrapedVideoRow,
} from '@/lib/training/dps-v2';
import { extractApifyMetrics } from '@/lib/training/scrape-label';
import { callApifyScraperSync, getApifyToken } from '@/lib/services/apify-tiktok-client';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const ACTOR_PROFILE = 'clockworks~tiktok-profile-scraper';
const NICHE = 'side-hustles';
const SOURCE = 'profile_scrape_training';
const RESULTS_PER_PAGE = 50;

const DEFAULT_CREATORS = [
  'theofficialecomchapman', 'officialnigellavers', 'liannebudgets', 'natlie.styles',
  'simply.nilly', 'notesbynathan', 'maxtalkstech', 'moneywithfar1', 'paulylong',
  'successwithalley', 'kellanhenneberry', 'jparkecom', 'digitalkingship',
  'realdennisdemarino5', 'melyndagerrard', 'shaylynnstudios', 'evo.gisselle',
  'monetizewitheddie', 'achievewithcharlie', 'the6figurewelder',
];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

function parseItem(raw: any, now: string) {
  const id = raw.id;
  if (!id) return null;

  const metrics = extractApifyMetrics(raw);
  if (!metrics) return null;

  const authorName = raw.authorMeta?.name || raw.authorMeta?.nickName || '';
  const webUrl = raw.webVideoUrl ||
    (authorName && id ? `https://www.tiktok.com/@${authorName}/video/${id}` : '');
  if (!webUrl) return null;

  let uploadTimestamp: string | null = null;
  const ct = raw.createTime ?? raw.createTimeISO;
  if (typeof ct === 'number') {
    uploadTimestamp = new Date(ct > 1e12 ? ct : ct * 1000).toISOString();
  } else if (typeof ct === 'string') {
    const parsed = new Date(ct);
    if (!isNaN(parsed.getTime())) uploadTimestamp = parsed.toISOString();
  }

  let transcriptText: string | null = null;
  if (Array.isArray(raw.subtitles) && raw.subtitles.length > 0) {
    transcriptText = raw.subtitles.map((s: any) => s.text || '').filter(Boolean).join(' ');
  }

  const hashtags = (raw.hashtags || []).map((h: any) => h.name || h.title || '').filter(Boolean);

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
    // Music fields
    music_id: raw.musicMeta?.musicId || raw.music?.id || null,
    music_name: raw.musicMeta?.musicName || raw.music?.title || null,
    music_author: raw.musicMeta?.musicAuthor || raw.music?.authorName || null,
    music_is_original: raw.musicMeta?.musicOriginal ?? raw.music?.original ?? null,
    // Video URL (CDN link, may expire)
    video_url: raw.videoMeta?.downloadAddr || raw.video?.downloadAddr || raw.video?.playAddr || null,
  };
}

async function fetchCohort(supabase: any, niche: string): Promise<ScrapedVideoRow[]> {
  const cohort: ScrapedVideoRow[] = [];
  let offset = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('scraped_videos')
      .select('views_count, likes_count, comments_count, shares_count, saves_count, creator_followers_count')
      .eq('niche', niche)
      .not('views_count', 'is', null)
      .gt('views_count', 0)
      .range(offset, offset + PAGE - 1);

    if (error || !data || data.length === 0) break;

    for (const r of data) {
      cohort.push({
        views: (r as any).views_count ?? 0,
        likes: (r as any).likes_count ?? 0,
        comments: (r as any).comments_count ?? 0,
        shares: (r as any).shares_count ?? 0,
        saves: (r as any).saves_count ?? 0,
        follower_count: (r as any).creator_followers_count ?? 0,
      });
    }

    if (data.length < PAGE) break;
    offset += PAGE;
  }

  return cohort;
}

export async function POST(request: Request) {
  noStore();

  const token = getApifyToken();
  if (!token) {
    return Response.json({ error: 'APIFY_API_TOKEN not configured' }, { status: 500 });
  }

  const supabase = getSupabase();

  let creators = DEFAULT_CREATORS;
  let batchSize = 5;

  try {
    const body = await request.json().catch(() => ({}));
    if (body.creators && Array.isArray(body.creators)) creators = body.creators;
    if (body.batchSize && typeof body.batchSize === 'number') batchSize = body.batchSize;
  } catch {
    // Use defaults
  }

  const now = new Date().toISOString();
  let totalScraped = 0;
  let totalInserted = 0;
  let totalDupes = 0;
  let totalErrors = 0;
  const perCreator: Record<string, number> = {};

  // Fetch existing IDs for dedup
  const { data: existing } = await supabase
    .from('scraped_videos')
    .select('video_id')
    .eq('niche', NICHE);
  const existingIds = new Set<string>((existing || []).map((r: any) => r.video_id));

  // Scrape in batches
  for (let i = 0; i < creators.length; i += batchSize) {
    const batch = creators.slice(i, i + batchSize);

    try {
      const items = await callApifyScraperSync(
        {
          profiles: batch,
          resultsPerPage: RESULTS_PER_PAGE,
          shouldDownloadSubtitles: true,
          shouldDownloadCovers: false,
          shouldDownloadSlideshowImages: false,
          shouldDownloadVideos: false,
        },
        { actor: ACTOR_PROFILE, timeoutSecs: 300 },
      );

      totalScraped += items.length;

      for (const raw of items) {
        const row = parseItem(raw, now);
        if (!row) continue;

        perCreator[row.creator_username] = (perCreator[row.creator_username] || 0) + 1;

        if (existingIds.has(row.video_id)) {
          totalDupes++;
          continue;
        }

        const { error } = await supabase
          .from('scraped_videos')
          .upsert(row, { onConflict: 'video_id' });

        if (error) {
          if (error.code === '23505') totalDupes++;
          else totalErrors++;
          continue;
        }

        totalInserted++;
        existingIds.add(row.video_id);
      }
    } catch (err: any) {
      console.error(`[scrape-profiles] Batch error: ${err.message}`);
      totalErrors++;
    }
  }

  // Compute DPS v2 for all profile_scrape_training videos
  const cohort = await fetchCohort(supabase, NICHE);
  const tierCounts: Record<string, number> = {};
  let dpsUpdated = 0;

  if (cohort.length > 0) {
    const PAGE = 500;
    for (let offset = 0; ; offset += PAGE) {
      const { data: videos, error } = await supabase
        .from('scraped_videos')
        .select('video_id, views_count, likes_count, comments_count, shares_count, saves_count, creator_followers_count')
        .eq('niche', NICHE)
        .eq('source', SOURCE)
        .not('views_count', 'is', null)
        .gt('views_count', 0)
        .range(offset, offset + PAGE - 1);

      if (error || !videos || videos.length === 0) break;

      for (const v of videos) {
        const rawMetrics: DpsV2RawMetrics = {
          views: (v as any).views_count,
          likes: (v as any).likes_count,
          comments: (v as any).comments_count,
          shares: (v as any).shares_count,
          saves: (v as any).saves_count,
          follower_count: (v as any).creator_followers_count ?? 0,
          hours_since_post: 0,
        };

        const v2Result = computeDpsV2FromRows(rawMetrics, cohort);
        const tier = v2Result.tier;
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;

        const dbTier = tier === 'mega-viral' ? 'mega-viral'
          : tier === 'hyper-viral' ? 'hyper-viral'
          : tier === 'viral' ? 'viral'
          : 'normal';

        const { error: updateErr } = await supabase
          .from('scraped_videos')
          .update({
            dps_score: v2Result.score,
            dps_classification: dbTier,
            dps_breakdown: { ...v2Result.breakdown, formula_version: 'dps_v2' },
          })
          .eq('video_id', (v as any).video_id);

        if (!updateErr) dpsUpdated++;
      }

      if (videos.length < PAGE) break;
    }
  }

  return Response.json({
    success: true,
    totalScraped,
    totalInserted,
    totalDupes,
    totalErrors,
    dpsUpdated,
    cohortSize: cohort.length,
    tierBreakdown: tierCounts,
    perCreator,
  });
}
