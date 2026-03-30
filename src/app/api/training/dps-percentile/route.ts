/**
 * POST /api/training/dps-percentile
 *
 * Compute DPS v2 score for a video given actual metrics + follower count.
 * Rewired to use canonical DPS v2 module (2026-03-25).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  computeDpsV2FromRows,
  DPS_V2_FORMULA_VERSION,
  type DpsV2RawMetrics,
  type ScrapedVideoRow,
} from '@/lib/training/dps-v2';

export const dynamic = 'force-dynamic';

const COHORT_PAGE_SIZE = 1000;

async function fetchCohort(niche: string): Promise<ScrapedVideoRow[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );

  const cohort: ScrapedVideoRow[] = [];
  let offset = 0;

  while (true) {
    const { data: page, error } = await supabase
      .from('scraped_videos')
      .select('views_count, likes_count, comments_count, shares_count, saves_count, creator_followers_count')
      .eq('niche', niche)
      .not('views_count', 'is', null)
      .gt('views_count', 0)
      .range(offset, offset + COHORT_PAGE_SIZE - 1);

    if (error || !page || page.length === 0) break;

    for (const r of page) {
      cohort.push({
        views: (r as any).views_count ?? 0,
        likes: (r as any).likes_count ?? 0,
        comments: (r as any).comments_count ?? 0,
        shares: (r as any).shares_count ?? 0,
        saves: (r as any).saves_count ?? 0,
        follower_count: (r as any).creator_followers_count ?? 0,
      });
    }

    if (page.length < COHORT_PAGE_SIZE) break;
    offset += COHORT_PAGE_SIZE;
  }

  return cohort;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { views, likes, comments, shares, saves, followerCount, hoursSinceUpload, niche } = body;

    if (!views || !followerCount) {
      return NextResponse.json(
        { error: 'views and followerCount are required' },
        { status: 400 },
      );
    }

    const cohortNiche = (niche || 'side-hustles').toLowerCase().replace(/_/g, '-');
    const cohort = await fetchCohort(cohortNiche);

    if (cohort.length === 0) {
      return NextResponse.json(
        { error: `No cohort data for niche '${cohortNiche}'` },
        { status: 422 },
      );
    }

    const rawMetrics: DpsV2RawMetrics = {
      views: Number(views),
      likes: Number(likes ?? 0),
      comments: Number(comments ?? 0),
      shares: Number(shares ?? 0),
      saves: Number(saves ?? 0),
      follower_count: Number(followerCount),
      hours_since_post: Number(hoursSinceUpload ?? 168),
    };

    const result = computeDpsV2FromRows(rawMetrics, cohort);

    return NextResponse.json({
      score: result.score,
      display_score: result.display_score,
      tier: result.tier,
      confidence: result.breakdown?.confidence ?? null,
      breakdown: result.breakdown,
      cohort_size: cohort.length,
      formula_version: DPS_V2_FORMULA_VERSION,
      dps_v2_incomplete: result.dps_v2_incomplete ?? false,
      dps_v2_incomplete_reason: result.dps_v2_incomplete_reason,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
