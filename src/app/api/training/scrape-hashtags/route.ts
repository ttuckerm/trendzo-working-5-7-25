/**
 * API Route: /api/training/scrape-hashtags
 *
 * Triggers hashtag-based TikTok scraping for cohort expansion.
 * Uses clockworks/tiktok-scraper (paid actor) with hashtag input.
 * Scrapes videos, stores in scraped_videos, computes DPS v2.
 *
 * NOTE: This route writes to scraped_videos (not prediction_runs).
 *
 * POST /api/training/scrape-hashtags
 * Body: {
 *   "hashtags": ["sidehustle", "makemoneyonline"],
 *   "resultsPerPage": 1000,
 *   "niche": "side-hustles",
 *   "source": "hashtag_scrape_training",
 *   "dryRun": false
 * }
 */

import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import {
  computeDpsV2FromRows,
  type DpsV2RawMetrics,
  type ScrapedVideoRow,
} from '@/lib/training/dps-v2';
import { extractApifyMetrics } from '@/lib/training/scrape-label';
import {
  callApifyScraperAsync,
  getApifyToken,
} from '@/lib/services/apify-tiktok-client';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const ACTOR_HASHTAG = 'clockworks/tiktok-scraper';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ============================================================================
// PARSE — handles both profile-scraper and hashtag-scraper output formats
// ============================================================================

function parseHashtagItem(raw: any, now: string, niche: string, source: string) {
  const id = raw.id;
  if (!id) return null;

  const metrics = extractApifyMetrics(raw);
  if (!metrics) return null;

  // Author fields — try multiple paths for resilience across actor output formats
  const authorName =
    raw.authorMeta?.name ||
    raw.authorMeta?.uniqueId ||
    raw.author?.uniqueId ||
    raw.authorMeta?.nickName ||
    '';
  const creatorNickname =
    raw.authorMeta?.nickName ||
    raw.authorMeta?.nickname ||
    raw.author?.nickname ||
    null;
  const creatorFollowers =
    raw.authorMeta?.fans ||
    raw.authorMeta?.followerCount ||
    raw.authorStats?.followerCount ||
    raw.author?.followers ||
    0;
  const creatorVerified =
    raw.authorMeta?.verified || raw.author?.verified || false;
  const creatorId =
    raw.authorMeta?.id || raw.author?.id || null;

  // Canonical URL
  const webUrl =
    raw.webVideoUrl ||
    (authorName && id
      ? `https://www.tiktok.com/@${authorName}/video/${id}`
      : '');
  if (!webUrl) return null;

  // Timestamp
  let uploadTimestamp: string | null = null;
  const ct = raw.createTime ?? raw.createTimeISO;
  if (typeof ct === 'number') {
    uploadTimestamp = new Date(ct > 1e12 ? ct : ct * 1000).toISOString();
  } else if (typeof ct === 'string') {
    const parsed = new Date(ct);
    if (!isNaN(parsed.getTime())) uploadTimestamp = parsed.toISOString();
  }

  // Transcript / subtitles
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

  // Music fields — try multiple paths
  const musicId =
    raw.musicMeta?.musicId || raw.music?.id || null;
  const musicName =
    raw.musicMeta?.musicName || raw.music?.title || null;
  const musicAuthor =
    raw.musicMeta?.musicAuthor || raw.music?.authorName || null;
  const musicIsOriginal =
    raw.musicMeta?.musicOriginal ?? raw.music?.original ?? null;

  // Video URL (CDN link, may expire)
  const videoUrl =
    raw.videoMeta?.downloadAddr ||
    raw.video?.downloadAddr ||
    raw.video?.playAddr ||
    null;

  return {
    video_id: String(id),
    tiktok_id: String(id),
    url: webUrl,
    caption: raw.text || raw.desc || '',
    creator_username: authorName,
    creator_id: creatorId,
    creator_nickname: creatorNickname,
    creator_followers_count: creatorFollowers,
    creator_verified: creatorVerified,
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
    niche,
    source,
    platform: 'tiktok',
    needs_processing: false,
    raw_scraping_data: raw,
    scraped_at: now,
    inserted_at: now,
    // Music fields
    music_id: musicId,
    music_name: musicName,
    music_author: musicAuthor,
    music_is_original: musicIsOriginal,
    // Video URL
    video_url: videoUrl,
  };
}

// ============================================================================
// DPS RECOMPUTE — same as scrape-profiles
// ============================================================================

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

async function recomputeDps(supabase: any, niche: string, source: string) {
  const cohort = await fetchCohort(supabase, niche);
  const tierCounts: Record<string, number> = {};
  let dpsUpdated = 0;

  if (cohort.length === 0) return { dpsUpdated: 0, cohortSize: 0, tierBreakdown: {} };

  const PAGE = 500;
  for (let offset = 0; ; offset += PAGE) {
    const { data: videos, error } = await supabase
      .from('scraped_videos')
      .select('video_id, views_count, likes_count, comments_count, shares_count, saves_count, creator_followers_count')
      .eq('niche', niche)
      .eq('source', source)
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

      const dbTier =
        tier === 'mega-viral' ? 'mega-viral'
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

  return { dpsUpdated, cohortSize: cohort.length, tierBreakdown: tierCounts };
}

// ============================================================================
// POST handler
// ============================================================================

export async function POST(request: Request) {
  noStore();

  const token = getApifyToken();
  if (!token) {
    return Response.json({ error: 'APIFY_API_TOKEN not configured' }, { status: 500 });
  }

  let hashtags: string[] = [];
  let resultsPerPage = 1000;
  let niche = 'side-hustles';
  let source = 'hashtag_scrape_training';
  let dryRun = false;

  try {
    const body = await request.json().catch(() => ({}));
    if (body.hashtags && Array.isArray(body.hashtags)) hashtags = body.hashtags;
    if (body.resultsPerPage && typeof body.resultsPerPage === 'number') resultsPerPage = body.resultsPerPage;
    if (body.niche && typeof body.niche === 'string') niche = body.niche;
    if (body.source && typeof body.source === 'string') source = body.source;
    if (body.dryRun === true) dryRun = body.dryRun;
  } catch {
    // Use defaults
  }

  if (hashtags.length === 0) {
    return Response.json({ error: 'hashtags array is required and must not be empty' }, { status: 400 });
  }

  const supabase = getSupabase();
  const now = new Date().toISOString();

  let totalScraped = 0;
  let totalInserted = 0;
  let totalDupes = 0;
  let totalErrors = 0;
  const perHashtag: Record<string, number> = {};
  const sampleRows: any[] = [];

  // Fetch existing IDs for dedup
  const { data: existing } = await supabase
    .from('scraped_videos')
    .select('video_id')
    .eq('niche', niche);
  const existingIds = new Set<string>((existing || []).map((r: any) => r.video_id));

  console.log(`[scrape-hashtags] Starting: ${hashtags.length} hashtags, ${resultsPerPage} results/hashtag, niche=${niche}, dryRun=${dryRun}`);
  console.log(`[scrape-hashtags] Existing videos in cohort: ${existingIds.size}`);

  // Scrape each hashtag individually to maximize coverage
  for (const hashtag of hashtags) {
    try {
      console.log(`[scrape-hashtags] Scraping hashtag: ${hashtag} (${resultsPerPage} results)`);

      const items = await callApifyScraperAsync(
        {
          hashtags: [hashtag],
          resultsPerPage,
          shouldDownloadSubtitles: true,
          shouldDownloadCovers: false,
          shouldDownloadSlideshowImages: false,
          shouldDownloadVideos: false,
        },
        { actor: ACTOR_HASHTAG, waitSecs: 600 },
      );

      console.log(`[scrape-hashtags] Hashtag "${hashtag}" returned ${items.length} items`);
      totalScraped += items.length;
      perHashtag[hashtag] = items.length;

      for (const raw of items) {
        const row = parseHashtagItem(raw, now, niche, source);
        if (!row) continue;

        // Collect samples in dryRun mode
        if (dryRun && sampleRows.length < 5) {
          const { raw_scraping_data, ...sampleWithoutRaw } = row;
          sampleRows.push(sampleWithoutRaw);
        }

        if (existingIds.has(row.video_id)) {
          totalDupes++;
          continue;
        }

        if (dryRun) {
          totalInserted++; // Count as "would insert"
          existingIds.add(row.video_id);
          continue;
        }

        const { error } = await supabase
          .from('scraped_videos')
          .upsert(row, { onConflict: 'video_id' });

        if (error) {
          if (error.code === '23505') totalDupes++;
          else {
            console.error(`[scrape-hashtags] Insert error: ${error.message}`);
            totalErrors++;
          }
          continue;
        }

        totalInserted++;
        existingIds.add(row.video_id);
      }
    } catch (err: any) {
      console.error(`[scrape-hashtags] Hashtag "${hashtag}" error: ${err.message}`);
      perHashtag[hashtag] = 0;
      totalErrors++;
    }
  }

  console.log(`[scrape-hashtags] Scrape complete: ${totalScraped} scraped, ${totalInserted} inserted, ${totalDupes} dupes, ${totalErrors} errors`);

  // DPS recompute (skip in dryRun)
  let dpsResult = { dpsUpdated: 0, cohortSize: 0, tierBreakdown: {} as Record<string, number> };
  if (!dryRun && totalInserted > 0) {
    console.log(`[scrape-hashtags] Recomputing DPS for ${niche} cohort...`);
    dpsResult = await recomputeDps(supabase, niche, source);
    console.log(`[scrape-hashtags] DPS recompute done: ${dpsResult.dpsUpdated} updated`);
  }

  const response: any = {
    success: true,
    dryRun,
    totalScraped,
    totalInserted: dryRun ? 0 : totalInserted,
    wouldInsert: dryRun ? totalInserted : undefined,
    totalDupes,
    totalErrors,
    dpsUpdated: dpsResult.dpsUpdated,
    cohortSize: dpsResult.cohortSize,
    tierBreakdown: dpsResult.tierBreakdown,
    perHashtag,
  };

  if (dryRun) {
    response.sampleRows = sampleRows;
  }

  return Response.json(response);
}
