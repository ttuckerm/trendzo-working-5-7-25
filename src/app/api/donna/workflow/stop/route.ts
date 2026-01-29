import { NextRequest, NextResponse } from 'next/server';
import { ViralScrapingWorkflow } from '@/lib/donna/workflows/viral-scraping-workflow';

/**
 * Stop the Viral Scraping & Prediction Workflow
 *
 * POST /api/donna/workflow/stop
 *
 * Gracefully stops the workflow. Completes current cycle
 * before shutting down.
 */
export async function POST(request: NextRequest) {
  try {
    const workflow = ViralScrapingWorkflow.getInstance();

    // Check if running
    if (!workflow.isRunning()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Workflow is not running',
          status: await workflow.getStatus()
        },
        { status: 400 }
      );
    }

    // Stop the workflow
    await workflow.stop();

    return NextResponse.json({
      success: true,
      message: 'Viral scraping workflow stopped successfully',
      status: await workflow.getStatus()
    });
  } catch (error) {
    console.error('[Donna Workflow] Stop error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop workflow'
      },
      { status: 500 }
    );
  }
}
