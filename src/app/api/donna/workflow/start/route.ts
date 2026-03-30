import { NextRequest, NextResponse } from 'next/server';
import { ViralScrapingWorkflow } from '@/lib/donna/workflows/viral-scraping-workflow';

/**
 * Start the Viral Scraping & Prediction Workflow
 *
 * POST /api/donna/workflow/start
 *
 * Starts continuous monitoring of viral creators and hashtags.
 * Scrapes fresh videos every 5-15 minutes, generates predictions,
 * and tracks performance over time.
 */
export async function POST(request: NextRequest) {
  try {
    const workflow = ViralScrapingWorkflow.getInstance();

    // Check if already running
    if (workflow.isRunning()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Workflow is already running',
          status: await workflow.getStatus()
        },
        { status: 400 }
      );
    }

    // Start the workflow
    await workflow.start();

    return NextResponse.json({
      success: true,
      message: 'Viral scraping workflow started successfully',
      status: await workflow.getStatus()
    });
  } catch (error) {
    console.error('[Donna Workflow] Start error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start workflow'
      },
      { status: 500 }
    );
  }
}
