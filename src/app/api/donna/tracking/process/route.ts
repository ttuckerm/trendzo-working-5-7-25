import { NextRequest, NextResponse } from 'next/server';
import { TrackingSystem } from '@/lib/donna/workflows/viral-scraping-workflow';

/**
 * Process Due Tracking Checkpoints
 *
 * POST /api/donna/tracking/process
 *
 * Processes all due checkpoints (5min, 30min, 1hr, 4hr, 24hr, 7day).
 * Should be called every 1-5 minutes via cron job.
 */
export async function POST(request: NextRequest) {
  try {
    const trackingSystem = TrackingSystem.getInstance();

    const results = await trackingSystem.processDueCheckpoints();

    return NextResponse.json({
      success: true,
      message: 'Checkpoints processed successfully',
      checkpointsProcessed: results.length,
      results
    });
  } catch (error) {
    console.error('[Donna Tracking] Process error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process checkpoints'
      },
      { status: 500 }
    );
  }
}
