/**
 * Scraping Scheduler API
 * Manages 24/7 automated scraping operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { ScrapingScheduler } from '@/lib/services/viral-prediction/scraping-scheduler';

// Global scheduler instance
let scheduler: ScrapingScheduler | null = null;

function getScheduler(): ScrapingScheduler {
  if (!scheduler) {
    scheduler = new ScrapingScheduler({
      enabled: process.env.ENABLE_AUTO_SCRAPING === 'true'
    });
  }
  return scheduler;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const schedulerInstance = getScheduler();

    switch (action) {
      case 'start': {
        await schedulerInstance.start();
        const status = schedulerInstance.getStatus();
        
        return NextResponse.json({
          success: true,
          action: 'scheduler_started',
          status,
          message: 'Scraping scheduler started successfully'
        });
      }

      case 'stop': {
        await schedulerInstance.stop();
        const status = schedulerInstance.getStatus();
        
        return NextResponse.json({
          success: true,
          action: 'scheduler_stopped',
          status,
          message: 'Scraping scheduler stopped'
        });
      }

      case 'update_config': {
        if (!body.config) {
          return NextResponse.json(
            { success: false, error: 'Missing config parameter' },
            { status: 400 }
          );
        }

        await schedulerInstance.updateConfig(body.config);
        const status = schedulerInstance.getStatus();
        
        return NextResponse.json({
          success: true,
          action: 'config_updated',
          status,
          message: 'Scheduler configuration updated'
        });
      }

      case 'trigger_job': {
        if (!body.jobType) {
          return NextResponse.json(
            { success: false, error: 'Missing jobType parameter' },
            { status: 400 }
          );
        }

        // Manually trigger a specific job
        const { ApifyScraperManager } = await import('@/lib/services/viral-prediction/apify-scraper-manager');
        const scraperManager = new ApifyScraperManager({
          apiToken: process.env.APIFY_API_TOKEN!
        });

        let result;
        switch (body.jobType) {
          case 'daily_comprehensive':
            result = await scraperManager.runDailyScraping();
            break;
          case 'trending_update':
            result = await scraperManager.scrapeTrendingVideos({ maxItems: 50 });
            break;
          case 'hashtag_update':
            const { hashtags } = await scraperManager.scrapeTrendingHashtags();
            result = { hashtags: hashtags.length };
            break;
          case 'sound_update':
            const { sounds } = await scraperManager.scrapeTrendingSounds();
            result = { sounds: sounds.length };
            break;
          default:
            return NextResponse.json(
              { success: false, error: 'Invalid job type' },
              { status: 400 }
            );
        }

        return NextResponse.json({
          success: true,
          action: 'job_triggered',
          jobType: body.jobType,
          result,
          message: `Job ${body.jobType} triggered successfully`
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Scheduler API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Scheduler operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const schedulerInstance = getScheduler();
    const status = schedulerInstance.getStatus();
    
    // Get recent job history from database
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data: recentJobs } = await supabase
      .from('scraping_jobs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20);

    const { data: dailyStats } = await supabase
      .from('scraping_results')
      .select('videos_processed, hashtags_found, sounds_found, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    // Calculate statistics
    const stats = {
      totalVideosLastWeek: dailyStats?.reduce((sum, day) => sum + (day.videos_processed || 0), 0) || 0,
      avgVideosPerDay: dailyStats && dailyStats.length > 0 
        ? Math.round(dailyStats.reduce((sum, day) => sum + (day.videos_processed || 0), 0) / dailyStats.length)
        : 0,
      totalHashtagsTracked: dailyStats?.reduce((sum, day) => sum + (day.hashtags_found || 0), 0) || 0,
      totalSoundsTracked: dailyStats?.reduce((sum, day) => sum + (day.sounds_found || 0), 0) || 0
    };

    // Calculate job success rate
    const completedJobs = recentJobs?.filter(job => job.status === 'completed').length || 0;
    const totalJobs = recentJobs?.length || 0;
    const successRate = totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : '0';

    return NextResponse.json({
      success: true,
      scheduler: {
        status: status.isRunning ? 'running' : 'stopped',
        config: status.config,
        jobs: status.jobs
      },
      
      statistics: {
        ...stats,
        jobSuccessRate: successRate + '%',
        recentJobsCount: totalJobs,
        completedJobsCount: completedJobs
      },
      
      recentJobs: recentJobs?.slice(0, 10).map(job => ({
        id: job.job_id,
        type: job.job_type,
        status: job.status,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        error: job.error
      })) || [],
      
      dailyActivity: dailyStats?.map(day => ({
        date: day.created_at,
        videos: day.videos_processed || 0,
        hashtags: day.hashtags_found || 0,
        sounds: day.sounds_found || 0
      })) || [],
      
      evidence: {
        automatedScraping: status.isRunning,
        realWorldDataCollection: stats.totalVideosLastWeek > 0,
        continuousOperation: status.jobs.length > 0,
        dataFreshness: recentJobs?.[0]?.started_at || null,
        proofOfConcept: {
          targetVideos: 24891,
          actualVideos: stats.totalVideosLastWeek,
          progressPercentage: ((stats.totalVideosLastWeek / 24891) * 100).toFixed(1) + '%'
        }
      }
    });

  } catch (error) {
    console.error('Get scheduler status error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get scheduler status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}