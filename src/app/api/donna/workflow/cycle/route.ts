import { NextRequest, NextResponse } from 'next/server';
import { ViralScrapingWorkflow } from '@/lib/donna/workflows/viral-scraping-workflow';

/**
 * Run a single scraping cycle (called by cron)
 *
 * POST /api/donna/workflow/cycle
 *
 * This endpoint is called every 5 minutes by Vercel cron.
 * It runs one cycle of the viral scraping workflow:
 * 1. Scrape fresh videos from viral creators & hashtags
 * 2. Generate predictions using The Donna
 * 3. Store predictions and schedule tracking
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron request (Vercel adds this header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Cron triggered: Running scraping cycle...');

    const workflow = ViralScrapingWorkflow.getInstance();

    // Run a single cycle manually (don't start continuous loop)
    await workflow['runScrapingCycle']();

    return NextResponse.json({
      success: true,
      message: 'Scraping cycle completed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Cron Cycle] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
