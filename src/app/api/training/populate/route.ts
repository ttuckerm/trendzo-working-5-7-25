/**
 * API Route: Trigger Training Data Population
 * 
 * POST /api/training/populate
 * 
 * Triggers the training data preparation pipeline to process
 * videos from scraped_videos into the training_data table.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  populateTrainingData, 
  PopulationOptions,
  getTrainingPipelineStats 
} from '@/lib/services/training';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Build options from request body
    const options: PopulationOptions = {
      selectionCriteria: {
        limit: body.limit || 500,
        requireDPS: true,
        requireTranscript: body.requireTranscript || false,
        performanceTiers: body.performanceTiers,
        minViews: body.minViews,
        minLikes: body.minLikes,
        source: body.source
      },
      minQualityScore: body.minQualityScore ?? 50,
      skipExisting: body.skipExisting !== false,
      dataSplit: body.dataSplit || 'auto',
      splitRatios: body.splitRatios || { train: 0.7, validation: 0.15, test: 0.15 },
      batchSize: body.batchSize || 10
    };

    console.log('🚀 Starting training data population...');
    console.log('   Options:', JSON.stringify(options, null, 2));

    // Run population
    const result = await populateTrainingData(options);

    // Get updated stats
    const stats = await getTrainingPipelineStats();

    console.log('✅ Population complete');
    console.log(`   Processed: ${result.processed}, Inserted: ${result.inserted}, Skipped: ${result.skipped}, Failed: ${result.failed}`);

    return NextResponse.json({
      success: result.success,
      result,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Training population error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        details: error.stack 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/training/populate
 * 
 * Check if a population job can be started (no running jobs)
 */
export async function GET() {
  try {
    const stats = await getTrainingPipelineStats();

    return NextResponse.json({
      canStart: stats.readyToProcess > 0,
      readyToProcess: stats.readyToProcess,
      currentTrainingData: stats.training.total,
      sourceVideos: stats.source.total
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}























































































