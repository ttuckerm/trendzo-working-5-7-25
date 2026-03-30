import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data: stories, error } = await supabaseClient
      .from('success_stories')
      .select(`
        id,
        user_id,
        user_email,
        before_metrics,
        after_metrics,
        testimonial_text,
        video_url,
        improvement_percentage,
        verified,
        featured,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch success stories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stories: stories || []
    });

  } catch (error) {
    console.error('Success stories API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_email,
      testimonial_text,
      video_url,
      before_metrics,
      after_metrics,
      improvement_percentage
    } = body;

    // Validate required fields
    if (!user_email || !testimonial_text || !before_metrics || !after_metrics) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create success story
    const { data: story, error } = await supabaseClient
      .from('success_stories')
      .insert({
        user_email,
        testimonial_text,
        video_url: video_url || null,
        before_metrics,
        after_metrics,
        improvement_percentage: improvement_percentage || 0,
        verified: false,
        featured: false
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create success story' },
        { status: 500 }
      );
    }

    // Log analytics event
    await supabaseClient
      .from('user_analytics')
      .insert({
        user_id: story.user_id,
        action_type: 'success_story_created',
        details: {
          story_id: story.id,
          improvement_percentage: improvement_percentage
        }
      });

    return NextResponse.json({
      success: true,
      story
    });

  } catch (error) {
    console.error('Create success story API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}