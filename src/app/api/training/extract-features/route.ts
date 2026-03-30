/**
 * API Route: Extract Training Features
 *
 * POST /api/training/extract-features
 *   Body: { limit?: number, batchSize?: number }
 *   Triggers feature extraction on scraped_videos without training_features rows.
 *
 * GET /api/training/extract-features
 *   Returns current extraction summary (no processing).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runFeatureExtraction, getExtractionSummary } from '@/lib/training/feature-extractor';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min max for serverless

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { persistSession: false } }
    );

    const summary = await getExtractionSummary(supabase);

    // Count scraped_videos for context
    const { count: totalScraped } = await supabase
      .from('scraped_videos')
      .select('video_id', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      summary: {
        ...summary,
        totalScrapedVideos: totalScraped || 0,
        remaining: (totalScraped || 0) - summary.totalRows,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = typeof body.limit === 'number' ? body.limit : 10;
    const batchSize = typeof body.batchSize === 'number' ? body.batchSize : 3;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { persistSession: false } }
    );

    const result = await runFeatureExtraction(supabase, {
      limit,
      batchSize,
    });

    return NextResponse.json({
      success: true,
      result: {
        totalProcessed: result.totalProcessed,
        succeeded: result.succeeded,
        failed: result.failed,
        skipped: result.skipped,
        featuresPerVideo: result.featuresPerVideo,
        durationMs: result.durationMs,
        errorCount: result.errors.length,
        errors: result.errors.slice(0, 20),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
