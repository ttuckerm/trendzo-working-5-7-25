/**
 * GET /api/channel/me
 *
 * Returns the authenticated user's verified TikTok channel data.
 * Used by upload-test page to auto-populate niche and account size.
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { followerCountToAccountSizeBand } from '@/lib/onboarding/channel-verifier';
import { getNicheByKey } from '@/lib/prediction/system-registry';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ channel: null });
    }

    const { data, error } = await supabase
      .from('user_channels')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'tiktok')
      .single();

    if (error || !data) {
      return NextResponse.json({ channel: null });
    }

    const nicheEntry = data.inferred_niche_key ? getNicheByKey(data.inferred_niche_key) : null;

    return NextResponse.json({
      channel: {
        username: data.username,
        displayName: data.display_name,
        followerCount: data.follower_count,
        avgViews: data.avg_views != null ? Number(data.avg_views) : null,
        avgEngagementRate: data.avg_engagement_rate != null ? Number(data.avg_engagement_rate) : null,
        inferredNicheKey: data.inferred_niche_key,
        inferredNicheLabel: nicheEntry?.label ?? null,
        accountSizeBand: followerCountToAccountSizeBand(data.follower_count),
        lastVerifiedAt: data.last_verified_at,
      },
    });
  } catch (err: any) {
    console.error('[ChannelMe] Error:', err.message);
    return NextResponse.json({ channel: null });
  }
}
