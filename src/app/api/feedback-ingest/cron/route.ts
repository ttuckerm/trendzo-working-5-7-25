import { NextRequest, NextResponse } from 'next/server';
import { ingestMetrics, getFeedbackIngestStatus } from '../../../../lib/modules/feedback-ingest';

/**
 * FeedbackIngest Cron API Endpoint
 * Scheduled to run every 15 minutes for real-world metrics collection
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🕒 FeedbackIngest cron job triggered');

    // Verify this is a legitimate cron call (optional auth header)
    const authHeader = request.headers.get('authorization');
    const cronKey = process.env.CRON_SECRET_KEY;
    
    if (cronKey && authHeader !== `Bearer ${cronKey}`) {
      console.warn('⚠️ Unauthorized cron call attempted');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run the metrics ingestion
    await ingestMetrics();
    
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'FeedbackIngest completed successfully',
      metadata: {
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('❌ FeedbackIngest cron job failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processing_time_ms: processingTime,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return FeedbackIngest status for monitoring
    const status = await getFeedbackIngestStatus();
    
    return NextResponse.json({
      module: 'FeedbackIngest',
      cron_schedule: 'Every 15 minutes',
      ...status,
      endpoints: {
        trigger: 'POST /api/feedback-ingest/cron',
        status: 'GET /api/feedback-ingest/cron'
      },
      version: '1.0.0'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        module: 'FeedbackIngest',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}