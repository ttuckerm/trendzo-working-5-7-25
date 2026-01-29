import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Get user from session (in production, implement proper auth)
    const userId = 'demo-user'; // Replace with actual user ID from session

    // Get user basic info
    const { data: user, error: userError } = await supabaseClient
      .from('limited_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user analytics
    const { data: analytics, error: analyticsError } = await supabaseClient
      .from('user_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('action_type', 'video_analyzed')
      .order('timestamp', { ascending: false });

    if (analyticsError) {
      console.error('Analytics error:', analyticsError);
    }

    const userAnalytics = analytics || [];
    const totalAnalyses = userAnalytics.length;

    // Calculate stats
    const viralScores = userAnalytics
      .map(a => a.details?.viral_probability || 0)
      .filter(score => score > 0);

    const avgViralScore = viralScores.length > 0 
      ? viralScores.reduce((sum, score) => sum + score, 0) / viralScores.length
      : 0;

    const bestScore = viralScores.length > 0 
      ? Math.max(...viralScores)
      : 0;

    // Get recent analyses for display
    const recentAnalyses = userAnalytics.slice(0, 10).map(analysis => ({
      id: analysis.id,
      viral_score: analysis.details?.viral_probability || 0,
      timestamp: analysis.timestamp,
      video_url: analysis.details?.video_url
    }));

    const stats = {
      analyses_used_today: user.analyses_used_today,
      daily_limit: user.daily_analysis_limit,
      total_analyses: totalAnalyses,
      avg_viral_score: avgViralScore,
      best_score: bestScore
    };

    return NextResponse.json({
      success: true,
      stats,
      recent_analyses: recentAnalyses
    });

  } catch (error) {
    console.error('User stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}