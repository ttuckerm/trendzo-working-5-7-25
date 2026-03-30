/**
 * Follower Resolver — resolves creator follower count for a prediction run
 *
 * Priority order:
 * 1. metric_check_schedule.actual_metrics.follower_count (from Apify, most recent)
 * 2. scraped_videos.creator_followers_count (matched by TikTok URL from source_meta)
 * 3. null (cannot resolve — DPS percentile will be skipped)
 */

import { extractTikTokUrl } from './metric-scheduler';

export async function resolveFollowerCount(
  supabase: any,
  runId: string,
  sourceMeta: Record<string, any> | null,
): Promise<number | null> {
  // Source 1: Check actual_metrics from the best completed checkpoint
  try {
    const { data: schedules } = await supabase
      .from('metric_check_schedule')
      .select('actual_metrics')
      .eq('prediction_run_id', runId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1);

    const followerCount = schedules?.[0]?.actual_metrics?.follower_count;
    if (followerCount && Number(followerCount) > 0) {
      return Number(followerCount);
    }
  } catch {}

  // Source 2: Look up scraped_videos by TikTok URL
  const tiktokUrl = extractTikTokUrl(sourceMeta);
  if (tiktokUrl) {
    try {
      // Try matching by URL
      const { data: sv } = await supabase
        .from('scraped_videos')
        .select('creator_followers_count')
        .eq('url', tiktokUrl)
        .limit(1)
        .maybeSingle();

      if (sv?.creator_followers_count && Number(sv.creator_followers_count) > 0) {
        return Number(sv.creator_followers_count);
      }

      // Try matching by video_id extracted from URL
      const videoIdMatch = tiktokUrl.match(/\/video\/(\d+)/);
      if (videoIdMatch) {
        const { data: sv2 } = await supabase
          .from('scraped_videos')
          .select('creator_followers_count')
          .eq('video_id', videoIdMatch[1])
          .limit(1)
          .maybeSingle();

        if (sv2?.creator_followers_count && Number(sv2.creator_followers_count) > 0) {
          return Number(sv2.creator_followers_count);
        }
      }
    } catch {}
  }

  return null;
}
