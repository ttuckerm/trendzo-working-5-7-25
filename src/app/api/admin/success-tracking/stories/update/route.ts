import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { story_id, verified, featured } = body;

    if (!story_id) {
      return NextResponse.json(
        { success: false, error: 'Story ID is required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = { updated_at: new Date().toISOString() };
    if (typeof verified === 'boolean') updateData.verified = verified;
    if (typeof featured === 'boolean') updateData.featured = featured;

    // Update the story
    const { data: story, error } = await supabaseClient
      .from('success_stories')
      .update(updateData)
      .eq('id', story_id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update success story' },
        { status: 500 }
      );
    }

    // Log the update action
    const actionType = verified !== undefined 
      ? (verified ? 'story_verified' : 'story_unverified')
      : (featured ? 'story_featured' : 'story_unfeatured');

    await supabaseClient
      .from('user_analytics')
      .insert({
        user_id: story.user_id,
        action_type: actionType,
        details: {
          story_id: story_id,
          admin_action: true,
          verified: story.verified,
          featured: story.featured
        }
      });

    return NextResponse.json({
      success: true,
      story
    });

  } catch (error) {
    console.error('Update success story API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}