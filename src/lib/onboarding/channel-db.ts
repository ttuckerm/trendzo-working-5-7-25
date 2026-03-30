import { getSupabaseClient } from '@/lib/supabase/client';

export interface UserChannelData {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followerCount: number | null;
  followingCount: number | null;
  videoCount: number | null;
  recentVideoCount: number | null;
  avgViews: number | null;
  avgLikes: number | null;
  avgComments: number | null;
  avgEngagementRate: number | null;
  inferredNicheKey: string | null;
  inferredNicheConfidence: number | null;
  topHashtags: string[];
  accountSizeBand: string;
  region: string | null;
  rawAuthorMeta: Record<string, unknown> | null;
}

export interface SavedUserChannel extends UserChannelData {
  lastVerifiedAt: string;
  updatedAt: string;
}

export async function saveUserChannel(
  userId: string,
  data: UserChannelData
): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('user_channels')
    .upsert(
      {
        user_id: userId,
        platform: 'tiktok',
        username: data.username,
        display_name: data.displayName,
        avatar_url: data.avatarUrl,
        bio: data.bio,
        follower_count: data.followerCount,
        following_count: data.followingCount,
        video_count: data.videoCount,
        recent_video_count: data.recentVideoCount,
        avg_views: data.avgViews,
        avg_likes: data.avgLikes,
        avg_comments: data.avgComments,
        avg_engagement_rate: data.avgEngagementRate,
        inferred_niche_key: data.inferredNicheKey,
        inferred_niche_confidence: data.inferredNicheConfidence,
        top_hashtags: data.topHashtags,
        region: data.region,
        raw_author_meta: data.rawAuthorMeta,
        last_verified_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform' }
    );

  return { error: error?.message ?? null };
}

export async function loadUserChannel(
  userId: string
): Promise<SavedUserChannel | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('user_channels')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', 'tiktok')
    .single();

  if (error || !data) return null;

  return {
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    followerCount: data.follower_count,
    followingCount: data.following_count,
    videoCount: data.video_count,
    recentVideoCount: data.recent_video_count,
    avgViews: data.avg_views != null ? Number(data.avg_views) : null,
    avgLikes: data.avg_likes != null ? Number(data.avg_likes) : null,
    avgComments: data.avg_comments != null ? Number(data.avg_comments) : null,
    avgEngagementRate: data.avg_engagement_rate != null ? Number(data.avg_engagement_rate) : null,
    inferredNicheKey: data.inferred_niche_key,
    inferredNicheConfidence: data.inferred_niche_confidence != null ? Number(data.inferred_niche_confidence) : null,
    topHashtags: data.top_hashtags ?? [],
    accountSizeBand: followerCountToAccountSizeBand(data.follower_count),
    region: data.region ?? null,
    rawAuthorMeta: data.raw_author_meta,
    lastVerifiedAt: data.last_verified_at,
    updatedAt: data.updated_at,
  };
}

function followerCountToAccountSizeBand(followers: number | null): string {
  if (followers == null) return 'small (0-10K)';
  if (followers >= 1_000_000) return 'mega (1M+)';
  if (followers >= 100_000) return 'large (100K-1M)';
  if (followers >= 10_000) return 'medium (10K-100K)';
  return 'small (0-10K)';
}
