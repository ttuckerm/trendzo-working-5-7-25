import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * GET /api/scraping/metrics
 * Get aggregated metrics
 */
export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Today's metrics
    const { data: todayJobs } = await supabase
      .from('scraping_jobs')
      .select('videos_found, videos_processed, avg_dps, status')
      .gte('created_at', today);

    // Week's metrics
    const { data: weekJobs } = await supabase
      .from('scraping_jobs')
      .select('videos_found, videos_processed, avg_dps, status')
      .gte('created_at', weekAgo);

    const todayComplete = todayJobs?.filter(j => j.status === 'complete') || [];
    const weekComplete = weekJobs?.filter(j => j.status === 'complete') || [];

    const metrics = {
      today: {
        jobs_completed: todayComplete.length,
        videos_scraped: todayComplete.reduce((sum, j) => sum + (j.videos_found || 0), 0),
        avg_dps: todayComplete.reduce((sum, j) => sum + (j.avg_dps || 0), 0) / (todayComplete.length || 1),
      },
      week: {
        jobs_completed: weekComplete.length,
        videos_scraped: weekComplete.reduce((sum, j) => sum + (j.videos_found || 0), 0),
        avg_dps: weekComplete.reduce((sum, j) => sum + (j.avg_dps || 0), 0) / (weekComplete.length || 1),
      },
      byNiche: [], // Could aggregate by niche if needed
    };

    return NextResponse.json({
      success: true,
      metrics,
    });

  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
