import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get total users
    const { data: allUsers, error: usersError } = await supabaseClient
      .from('limited_users')
      .select('id, created_at, status');

    // Get today's activity
    const { data: todayActivity, error: activityError } = await supabaseClient
      .from('user_analytics')
      .select('user_id, action_type')
      .gte('timestamp', `${today}T00:00:00Z`)
      .lt('timestamp', `${today}T23:59:59Z`);

    // Get success stories for conversion rate
    const { data: successStories, error: storiesError } = await supabaseClient
      .from('success_stories')
      .select('user_id');

    if (usersError || activityError) {
      console.error('Database errors:', { usersError, activityError, storiesError });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    const users = allUsers || [];
    const activities = todayActivity || [];
    const stories = successStories || [];

    // Calculate stats
    const totalUsers = users.length;
    const activeToday = new Set(activities.map(a => a.user_id)).size;
    const analysesToday = activities.filter(a => a.action_type === 'video_analyzed').length;
    const conversionRate = totalUsers > 0 ? stories.length / totalUsers : 0;

    const stats = {
      totalUsers,
      activeToday,
      analysesToday,
      conversionRate
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Limited users stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}