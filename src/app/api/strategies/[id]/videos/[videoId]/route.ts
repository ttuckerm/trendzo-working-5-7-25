import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { StrategyVideoData } from '@/types/database';

/**
 * GET /api/strategies/[id]/videos/[videoId]
 * Get a single video
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { id: strategyId, videoId } = await params;
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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

    // Fetch the video
    const { data: video, error } = await supabase
      .from('strategy_videos')
      .select('*')
      .eq('id', videoId)
      .eq('strategy_id', strategyId)
      .single();

    if (error || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error('GET /api/strategies/[id]/videos/[videoId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/strategies/[id]/videos/[videoId]
 * Update a video's data (beats, caption, results, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { id: strategyId, videoId } = await params;
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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

    // Parse request body
    const body = await request.json();
    const videoData: StrategyVideoData = body.video_data;

    if (!videoData) {
      return NextResponse.json({ error: 'video_data is required' }, { status: 400 });
    }

    // Update the video
    const { data: video, error } = await supabase
      .from('strategy_videos')
      .update({
        video_data: videoData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', videoId)
      .eq('strategy_id', strategyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating video:', error);
      return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
    }

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error('PUT /api/strategies/[id]/videos/[videoId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/strategies/[id]/videos/[videoId]
 * Delete a video
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { id: strategyId, videoId } = await params;
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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

    // Delete the video
    const { error } = await supabase
      .from('strategy_videos')
      .delete()
      .eq('id', videoId)
      .eq('strategy_id', strategyId);

    if (error) {
      console.error('Error deleting video:', error);
      return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/strategies/[id]/videos/[videoId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
