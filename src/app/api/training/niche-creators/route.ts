/**
 * Niche Top Creators API
 *
 * GET /api/training/niche-creators
 *   - No params: returns per-niche summary (creator count + last_scraped_at)
 *   - ?niche=side-hustles: returns top creators for that niche
 *   - ?limit=20: max creators to return (default 20, max 50)
 *
 * POST /api/training/niche-creators
 *   - Manual trigger to scrape creators for specific or all niches
 *   - Body: { niches?: string[], maxCreatorsPerNiche?: number, dryRun?: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
};

export async function GET(request: NextRequest) {
  noStore();
  const supabase = getSupabase();
  const searchParams = request.nextUrl.searchParams;
  const niche = searchParams.get('niche');
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 50);

  try {
    if (niche) {
      // Detail mode: return top creators for a specific niche
      const { data, error } = await supabase
        .from('niche_top_creators')
        .select('creator_username, platform, follower_count, avg_views, avg_engagement_rate, top_video_ids, sample_video_count, last_scraped_at')
        .eq('niche_key', niche)
        .order('avg_engagement_rate', { ascending: false })
        .limit(limit);

      if (error) {
        return NextResponse.json(
          { success: false, error: `Query failed: ${error.message}` },
          { status: 500, headers: CACHE_HEADERS }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            niche_key: niche,
            creators: data || [],
            count: data?.length || 0,
          },
        },
        { headers: CACHE_HEADERS }
      );
    }

    // Summary mode: return per-niche counts
    const { data, error } = await supabase
      .from('niche_top_creators')
      .select('niche_key, last_scraped_at');

    if (error) {
      return NextResponse.json(
        { success: false, error: `Query failed: ${error.message}` },
        { status: 500, headers: CACHE_HEADERS }
      );
    }

    const rows = data || [];
    const nicheMap = new Map<string, { count: number; last_scraped_at: string }>();
    for (const row of rows) {
      const entry = nicheMap.get(row.niche_key);
      if (!entry) {
        nicheMap.set(row.niche_key, { count: 1, last_scraped_at: row.last_scraped_at });
      } else {
        entry.count++;
        if (row.last_scraped_at > entry.last_scraped_at) {
          entry.last_scraped_at = row.last_scraped_at;
        }
      }
    }

    const niches = Array.from(nicheMap.entries()).map(([niche_key, val]) => ({
      niche_key,
      creator_count: val.count,
      last_scraped_at: val.last_scraped_at,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          niches,
          total_creators: rows.length,
        },
      },
      { headers: CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error' },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  noStore();

  try {
    const body = await request.json().catch(() => ({}));
    const { niches, maxCreatorsPerNiche, dryRun } = body as {
      niches?: string[];
      maxCreatorsPerNiche?: number;
      dryRun?: boolean;
    };

    const { scrapeNicheCreators } = await import('@/lib/training/niche-creator-scraper');
    const result = await scrapeNicheCreators({
      niches,
      maxCreatorsPerNiche,
      dryRun,
    });

    return NextResponse.json(
      { success: true, data: result },
      { headers: CACHE_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Scrape failed' },
      { status: 500, headers: CACHE_HEADERS }
    );
  }
}
