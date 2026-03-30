/**
 * Phase 83: Metric Collection v1 — TikTok Metric Fetcher
 *
 * Fetches post-execution metrics for a single TikTok video via Apify.
 * Returns a minimal metrics payload (views, likes, comments, shares, saves).
 *
 * Uses the Apify clockworks~free-tiktok-scraper actor.
 * Video URLs (/video/) require postURLs: ["<url>"] (array of strings).
 * Profile URLs use startUrls: [{ url }] (array of objects).
 *
 * CONTAMINATION SAFETY: This data is ONLY written to metric_check_schedule.actual_metrics.
 * It is NEVER stored in feature columns or used by the prediction pipeline.
 */

import type { TikTokMetricsPayload } from './training-ingest-types';

const APIFY_ACTOR = 'clockworks~free-tiktok-scraper';
const APIFY_RUN_URL = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items`;

/**
 * Extract a numeric TikTok video ID from various URL formats.
 * Accepts:
 *  - "7123456789012345678" (raw ID)
 *  - "https://www.tiktok.com/@user/video/7123456789012345678"
 *  - "https://vm.tiktok.com/XXXXXXXXX/"
 *
 * Returns the original string if it looks like a URL (for Apify to resolve).
 * Returns null if completely unparseable.
 */
export function parsePlatformVideoId(input: string): { url: string | null; videoId: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { url: null, videoId: null };

  // Raw numeric ID
  if (/^\d{15,25}$/.test(trimmed)) {
    return {
      url: `https://www.tiktok.com/video/${trimmed}`,
      videoId: trimmed,
    };
  }

  // Full TikTok URL — extract video ID if present
  const match = trimmed.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (match) {
    return { url: trimmed, videoId: match[1] };
  }

  // Short URL (vm.tiktok.com) — pass directly to Apify
  if (/tiktok\.com/i.test(trimmed)) {
    return { url: trimmed, videoId: null };
  }

  // Unknown format — try as-is
  return { url: trimmed, videoId: null };
}

/**
 * Fetch metrics for a single TikTok video via Apify.
 * Returns null if the video can't be found or Apify fails.
 */
export async function fetchTikTokMetrics(
  platformVideoId: string
): Promise<TikTokMetricsPayload | null> {
  const token = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error('APIFY_API_TOKEN is not configured');
  }

  const parsed = parsePlatformVideoId(platformVideoId);
  if (!parsed.url) {
    throw new Error(`Cannot parse platform_video_id: "${platformVideoId}"`);
  }

  // Clockworks free-tiktok-scraper input schema:
  //   Video URLs (/video/) → postURLs: ["<url>"]  (array of strings)
  //   Profile/other URLs   → startUrls: [{ url }]  (array of objects)
  const isVideoUrl = /\/video\//i.test(parsed.url);

  const apifyInput: Record<string, unknown> = isVideoUrl
    ? { postURLs: [parsed.url], resultsPerPage: 1 }
    : {
        startUrls: [{ url: parsed.url }],
        resultsPerPage: 1,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        shouldDownloadSlideshow: false,
        shouldDownloadSubtitles: false,
      };

  console.log(
    `[TikTokMetrics] actor=${APIFY_ACTOR} isVideoUrl=${isVideoUrl} input=${JSON.stringify(apifyInput)}`
  );

  const response = await fetch(APIFY_RUN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(apifyInput),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[TikTokMetrics] Apify error response (full): ${text}`);
    throw new Error(`Apify API error ${response.status}: ${text}`);
  }

  const data: any[] = await response.json();

  if (!data || data.length === 0) {
    console.log(`[TikTokMetrics] No data returned for ${parsed.url}`);
    return null;
  }

  const item = data[0];
  const stats = item.stats || {};
  const authorMeta = item.authorMeta || {};

  const payload: TikTokMetricsPayload = {
    views: stats.playCount ?? 0,
    likes: stats.diggCount ?? 0,
    comments: stats.commentCount ?? 0,
    shares: stats.shareCount ?? 0,
    saves: stats.collectCount ?? null,
    author: authorMeta.name || authorMeta.nickName || null,
    follower_count: authorMeta.fans ?? null,
    posted_at: item.createTime
      ? new Date(Number(item.createTime) * 1000).toISOString()
      : null,
    collected_at: new Date().toISOString(),
    source: 'apify',
    raw_stats: stats,
  };

  console.log(
    `[TikTokMetrics] Got metrics: ${payload.views} views, ${payload.likes} likes, ` +
      `${payload.comments} comments, ${payload.shares} shares`
  );

  return payload;
}
