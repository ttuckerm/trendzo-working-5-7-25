/**
 * POST /api/channel/verify
 *
 * Verifies a TikTok channel by scraping recent videos via Apify.
 * Returns channel metrics, inferred niche, and account size band.
 * Saves verified channel data to user_channels table.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { verifyTikTokChannel } from '@/lib/onboarding/channel-verifier';

// Service-key client for DB writes (same pattern as /api/kai/predict)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    let userId: string | null = null;
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // Auth not available — allow userId from body for admin testing
    }
    if (!userId && body.userId) {
      userId = body.userId;
    }

    // Verify channel via Apify
    const result = await verifyTikTokChannel(username);

    // Save to DB if we have a user ID (fire-and-forget)
    if (userId) {
      supabaseAdmin
        .from('user_channels')
        .upsert(
          {
            user_id: userId,
            platform: 'tiktok',
            username: result.username,
            display_name: result.displayName,
            avatar_url: result.avatarUrl,
            bio: result.bio,
            follower_count: result.followerCount,
            following_count: result.followingCount,
            video_count: result.videoCount,
            recent_video_count: result.recentVideoCount,
            avg_views: result.avgViews,
            avg_likes: result.avgLikes,
            avg_comments: result.avgComments,
            avg_engagement_rate: result.avgEngagementRate,
            inferred_niche_key: result.inferredNicheKey,
            inferred_niche_confidence: result.inferredNicheConfidence,
            top_hashtags: result.topHashtags,
            region: result.region,
            raw_author_meta: result.rawAuthorMeta,
            last_verified_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,platform' }
        )
        .then(({ error }) => {
          if (error) console.error('[ChannelVerify] DB save failed:', error.message);
          else console.log('[ChannelVerify] Saved to user_channels');
        });
    }

    return NextResponse.json({ success: true, channel: result });
  } catch (err: any) {
    console.error('[ChannelVerify] Error:', err.message);
    return NextResponse.json(
      { success: false, error: err.message || 'Channel verification failed' },
      { status: err.message?.includes('not configured') ? 503 : 422 }
    );
  }
}
