import { NextRequest, NextResponse } from 'next/server';
import { ViralScrapingWorkflow } from '@/lib/donna/workflows/viral-scraping-workflow';

/**
 * Get Viral Scraping & Prediction Workflow Status
 *
 * GET /api/donna/workflow/status
 *
 * Returns current status, statistics, and recent activity.
 */
export async function GET(request: NextRequest) {
  try {
    const workflow = ViralScrapingWorkflow.getInstance();
    const status = await workflow.getStatus();

    return NextResponse.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('[Donna Workflow] Status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get workflow status'
      },
      { status: 500 }
    );
  }
}
