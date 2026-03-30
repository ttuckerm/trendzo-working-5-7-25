import { getServerSupabase } from '@/lib/supabase-server';

// ─── Legacy synchronous export (used by old /admin/viral-studio flow) ────────
// Re-exports the synchronous getCalibrationVideos so SignalCalibrationPhase keeps working.
export { getCalibrationVideos } from './calibration-video-pool.DEPRECATED';

// ─── New async function for the new onboarding flow ──────────────────────────

export interface CalibrationVideoEntry {
  id: string;
  title: string;
  creator: string;
  niche: string;
  thumbnail_url: string;
  views: number;
  likes: number;
  dps_score: number;
  group: 'high_performer' | 'comparison';
}

/**
 * Fetch real calibration videos from scraped_videos for a given niche.
 * Returns the top half as "high performers" and bottom half as "comparison".
 *
 * Used by the new onboarding flow (via /api/onboarding/calibration-videos).
 */
export async function getRealCalibrationVideos(
  niche: string,
  limit = 30
): Promise<{ videos: CalibrationVideoEntry[]; error: string | null }> {
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
    return { videos: [], error: error.message };
  }

  if (!data || data.length === 0) {
    return { videos: [], error: null };
  }

  const midpoint = Math.ceil(data.length / 2);

  const videos: CalibrationVideoEntry[] = data.map((row, i) => ({
    id: row.id,
    title: row.title ?? '',
    creator: row.creator ?? '',
    niche: row.niche,
    thumbnail_url: row.thumbnail_url,
    views: row.views ?? 0,
    likes: row.likes ?? 0,
    dps_score: row.dps_score,
    group: i < midpoint ? 'high_performer' as const : 'comparison' as const,
  }));

  return { videos, error: null };
}
