import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';

/**
 * GET /api/onboarding/calibration-videos?niche=fitness&limit=30
 *
 * Returns real scraped videos for signal calibration.
 * Filters out videos without thumbnails or DPS scores.
 * Splits into high_performer (top half) and comparison (bottom half).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get('niche');
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  if (!niche) {
    return NextResponse.json({ error: 'niche parameter required' }, { status: 400 });
  }

  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from('scraped_videos')
    .select('id, title, creator, niche, thumbnail_url, views, likes, dps_score')
    .eq('niche', niche)
    .not('dps_score', 'is', null)
    .not('thumbnail_url', 'is', null)
    .order('dps_score', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ videos: [], error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ videos: [], error: null });
  }

  const midpoint = Math.ceil(data.length / 2);
  const videos = data.map((row: any, i: number) => ({
    id: row.id,
    title: row.title ?? '',
    creator: row.creator ?? '',
    niche: row.niche,
    thumbnail_url: row.thumbnail_url,
    views: row.views ?? 0,
    likes: row.likes ?? 0,
    dps_score: row.dps_score,
    group: i < midpoint ? 'high_performer' : 'comparison',
  }));

  return NextResponse.json({ videos, error: null });
}
