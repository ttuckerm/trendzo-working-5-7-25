/**
 * POST /api/admin/scrape-search
 *
 * Unified scrape endpoint supporting three modes:
 *   1. keyword  — Apify searchQueries  → top N videos matching keyword
 *   2. creator  — Apify profile startUrl → recent videos from a creator
 *   3. hashtag  — Apify searchQueries with # prefix
 *
 * Returns an array of lightweight video objects the UI can queue for prediction.
 * No prediction is performed here — the caller decides what to do with the list.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { callApifyScraperSync, normalizeApifyItem } from '@/lib/services/apify-tiktok-client';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

interface ScrapeSearchBody {
  mode: 'keyword' | 'creator' | 'hashtag';
  query: string;
  limit?: number;
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body: ScrapeSearchBody = await request.json();
    const { mode, query } = body;
    const limit = Math.min(body.limit ?? 10, 30);

    if (!mode || !query?.trim()) {
      return NextResponse.json({ error: 'mode and query are required' }, { status: 400 });
    }

    const trimmedQuery = query.trim();
    let apifyInput: Record<string, unknown>;

    switch (mode) {
      case 'keyword':
        apifyInput = {
          searchQueries: [trimmedQuery],
          resultsPerPage: limit,
          searchSection: '/video',
          shouldDownloadSubtitles: false,
          shouldDownloadVideos: false,
          excludePinnedPosts: true,
        };
        break;

      case 'hashtag':
        apifyInput = {
          searchQueries: [trimmedQuery.startsWith('#') ? trimmedQuery : `#${trimmedQuery}`],
          resultsPerPage: limit,
          searchSection: '/video',
          shouldDownloadSubtitles: false,
          shouldDownloadVideos: false,
          excludePinnedPosts: true,
        };
        break;

      case 'creator': {
        const username = trimmedQuery.startsWith('@') ? trimmedQuery.slice(1) : trimmedQuery;
        const profileUrl = `https://www.tiktok.com/@${username}`;
        apifyInput = {
          startUrls: [{ url: profileUrl }],
          resultsPerPage: limit,
          shouldDownloadSubtitles: false,
          shouldDownloadVideos: false,
          excludePinnedPosts: true,
        };
        break;
      }

      default:
        return NextResponse.json({ error: `Invalid mode: ${mode}` }, { status: 400 });
    }

    console.log(`[ScrapeSearch] mode=${mode} query="${trimmedQuery}" limit=${limit}`);

    const rawItems = await callApifyScraperSync(apifyInput, { timeoutSecs: 90 });

    const results = rawItems.slice(0, limit).map((raw: any) => {
      const normalized = normalizeApifyItem(raw);
      const stats = raw.stats || raw.statsV2 || {};
      return {
        id: normalized.id,
        url: normalized.webVideoUrl,
        text: normalized.text.slice(0, 200),
        authorName: normalized.authorName,
        duration: normalized.duration,
        hashtags: normalized.hashtags.slice(0, 10),
        views: stats.playCount ?? null,
        likes: stats.diggCount ?? null,
        thumbnail: raw.covers?.default || raw.videoMeta?.coverUrl || null,
        createTime: raw.createTime
          ? new Date(Number(raw.createTime) * 1000).toISOString()
          : null,
      };
    });

    console.log(`[ScrapeSearch] Returned ${results.length} results for ${mode}:"${trimmedQuery}"`);

    return NextResponse.json({
      mode,
      query: trimmedQuery,
      count: results.length,
      results,
    });
  } catch (error: any) {
    console.error('[ScrapeSearch] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
