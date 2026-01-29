import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { StrategyVideoData } from '@/types/database';

/**
 * GET /api/strategies/[id]/videos
 * List all videos for a strategy
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: strategyId } = await params;
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error in GET /api/strategies/[id]/videos:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns this strategy
    const { data: strategy, error: strategyError } = await supabase
      .from('content_strategies')
      .select('id')
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .single();

    if (strategyError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    // Fetch videos for this strategy
    const { data: videos, error } = await supabase
      .from('strategy_videos')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching videos:', error);
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }

    return NextResponse.json({ videos: videos || [] });
  } catch (error) {
    console.error('GET /api/strategies/[id]/videos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/strategies/[id]/videos
 * Create a new video from a strategy
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: strategyId } = await params;
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error in POST /api/strategies/[id]/videos:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns this strategy
    const { data: strategy, error: strategyError } = await supabase
      .from('content_strategies')
      .select('id')
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .single();

    if (strategyError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
    }

    // Parse request body (optional - can create empty video)
    let videoData: StrategyVideoData = {};
    try {
      const body = await request.json();
      videoData = body.video_data || {};
    } catch {
      // Empty body is fine - we'll create a blank video
    }

    // Create the video
    const { data: video, error } = await supabase
      .from('strategy_videos')
      .insert({
        strategy_id: strategyId,
        video_data: videoData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating video:', error);
      return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
    }

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error('POST /api/strategies/[id]/videos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
