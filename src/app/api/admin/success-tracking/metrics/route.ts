import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Get all success stories
    const { data: stories, error: storiesError } = await supabaseClient
      .from('success_stories')
      .select('*');

    // Get limited users count for conversion rate
    const { data: users, error: usersError } = await supabaseClient
      .from('limited_users')
      .select('id');

    if (storiesError || usersError) {
      console.error('Database errors:', { storiesError, usersError });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }

    const allStories = stories || [];
    const totalUsers = users?.length || 0;

    // Calculate metrics
    const totalStories = allStories.length;
    const verifiedStories = allStories.filter(s => s.verified).length;
    const featuredStories = allStories.filter(s => s.featured).length;
    
    // Calculate average improvement
    const avgImprovement = totalStories > 0 
      ? allStories.reduce((sum, story) => sum + (story.improvement_percentage || 0), 0) / totalStories
      : 0;

    // Calculate conversion rate (users with success stories / total users)
    const usersWithStories = new Set(allStories.map(s => s.user_id)).size;
    const conversionRate = totalUsers > 0 ? (usersWithStories / totalUsers) * 100 : 0;

    const metrics = {
      totalStories,
      verifiedStories,
      featuredStories,
      avgImprovement,
      conversionRate
    };

    return NextResponse.json({
      success: true,
      metrics
    });

  } catch (error) {
    console.error('Success metrics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}