import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Fetch system metrics
    const today = new Date().toISOString().split('T')[0];

    // Get total and active users
    const { data: totalUsers, error: usersError } = await supabaseClient
      .from('limited_users')
      .select('id, created_at')
      .eq('status', 'active');

    // Get today's activity
    const { data: todayActivity, error: activityError } = await supabaseClient
      .from('user_analytics')
      .select('user_id, action_type')
      .gte('timestamp', `${today}T00:00:00Z`)
      .lt('timestamp', `${today}T23:59:59Z`);

    // Get prediction counts
    const { data: predictions, error: predictionsError } = await supabaseClient
      .from('prediction_validation')
      .select('id')
      .gte('prediction_timestamp', `${today}T00:00:00Z`)
      .lt('prediction_timestamp', `${today}T23:59:59Z`);

    if (usersError || activityError || predictionsError) {
      console.error('Database errors:', { usersError, activityError, predictionsError });
      return NextResponse.json(
        { success: false, error: 'Failed to fetch system metrics' },
        { status: 500 }
      );
    }

    const activeUserIds = new Set(todayActivity?.map(a => a.user_id) || []);
    const analysesToday = todayActivity?.filter(a => a.action_type === 'video_analyzed').length || 0;

    return NextResponse.json({
      success: true,
      metrics: {
        totalUsers: totalUsers?.length || 0,
        activeToday: activeUserIds.size,
        analysesToday,
        predictionsToday: predictions?.length || 0
      }
    });

  } catch (error) {
    console.error('Mission Control metrics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}