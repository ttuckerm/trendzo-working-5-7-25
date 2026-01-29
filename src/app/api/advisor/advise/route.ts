import { NextRequest, NextResponse } from 'next/server';
import { advise, AdvisorInput, AdvisorOutput } from '../../../../lib/modules/advisor-service';

/**
 * AdvisorService API Endpoint
 * Template match and fix-list generator for video drafts
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const input: AdvisorInput = body;

    // Validate required input
    if (!input.video_id || !input.genes || !input.prediction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input: video_id, genes, and prediction are required'
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(input.genes) || input.genes.length !== 48) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input: genes must be boolean array of length 48'
        },
        { status: 400 }
      );
    }

    // Call the AdvisorService
    const forceHeader = request.headers.get('x-recheck') === 'true'
    const result = await advise({ ...input, forceRecheck: forceHeader });
    
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        api_processing_time_ms: processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('❌ AdvisorService API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          api_processing_time_ms: processingTime,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'status') {
    // Return AdvisorService status
    return NextResponse.json({
      module: 'AdvisorService',
      status: 'operational',
      advisor_status: {
        performance_target: '< 10ms',
        features: [
          'Template matching',
          'Missing gene detection',
          'Fix list generation',
          'Probability estimation'
        ],
        dependencies: ['Orchestrator', 'template_library', 'framework_genes.json']
      },
      version: '1.0.0',
      last_updated: new Date().toISOString()
    });
  }

  return NextResponse.json(
    { error: 'Invalid action. Use ?action=status for status check.' },
    { status: 400 }
  );
}