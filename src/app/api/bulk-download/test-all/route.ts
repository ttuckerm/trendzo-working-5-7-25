/**
 * Bulk Prediction Test API
 * 
 * POST /api/bulk-download/test-all - Run predictions on all downloaded videos in a job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

interface TestAllRequest {
  jobId: string;
  niche?: string;
  accountSize?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TestAllRequest = await request.json();

    if (!body.jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId is required' },
        { status: 400 }
      );
    }

    // Get all completed downloads for this job
    const { data: items, error: itemsError } = await supabase
      .from('bulk_download_items')
      .select('*')
      .eq('job_id', body.jobId)
      .eq('status', 'completed');

    if (itemsError || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No completed downloads found for this job' },
        { status: 404 }
      );
    }

    // Create batch test run
    const { data: testRun, error: runError } = await supabase
      .from('batch_test_runs')
      .insert({
        job_id: body.jobId,
        total_videos: items.length,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (runError || !testRun) {
      return NextResponse.json(
        { success: false, error: 'Failed to create test run' },
        { status: 500 }
      );
    }

    // Process predictions in background
    runBatchPredictions(testRun.id, items, {
      niche: body.niche || 'general',
      accountSize: body.accountSize || '10k-50k'
    }).catch(err => {
      console.error('[Batch Test] Background processing error:', err);
    });

    return NextResponse.json({
      success: true,
      data: {
        testRunId: testRun.id,
        totalVideos: items.length,
        status: 'running',
        message: `Started testing ${items.length} videos`
      }
    });

  } catch (error: any) {
    console.error('[Batch Test] POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get test run status and results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testRunId = searchParams.get('testRunId');
    const jobId = searchParams.get('jobId');

    if (testRunId) {
      // Get specific test run
      const { data: testRun, error } = await supabase
        .from('batch_test_runs')
        .select('*')
        .eq('id', testRunId)
        .single();

      if (error || !testRun) {
        return NextResponse.json(
          { success: false, error: 'Test run not found' },
          { status: 404 }
        );
      }

      // Get predicted items
      const { data: items } = await supabase
        .from('bulk_download_items')
        .select('*')
        .eq('job_id', testRun.job_id)
        .not('predicted_dps', 'is', null);

      return NextResponse.json({
        success: true,
        data: {
          testRun,
          predictions: items || []
        }
      });

    } else if (jobId) {
      // Get all test runs for a job
      const { data: runs, error } = await supabase
        .from('batch_test_runs')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        success: true,
        data: { runs: runs || [] }
      });
    }

    return NextResponse.json(
      { success: false, error: 'testRunId or jobId required' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Batch Test] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Background processor for batch predictions
 */
async function runBatchPredictions(
  testRunId: string,
  items: any[],
  context: { niche: string; accountSize: string }
) {
  console.log(`[Batch Test] Starting test run ${testRunId} with ${items.length} videos`);

  let testedCount = 0;
  let totalDps = 0;
  let totalConfidence = 0;
  const distribution: Record<string, number> = {
    '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0
  };
  const potentials = { mega: 0, viral: 0, good: 0, average: 0, low: 0 };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  for (const item of items) {
    try {
      console.log(`[Batch Test] Testing video ${item.video_id}`);

      // Create form data for prediction
      const formData = new FormData();
      formData.append('niche', context.niche);
      formData.append('goal', 'engagement');
      formData.append('accountSize', context.accountSize);
      
      // If we have transcript from metadata, use it
      if (item.description) {
        formData.append('transcript', item.description);
      }
      
      // Add TikTok URL for reference
      formData.append('tiktokUrl', item.tiktok_url);

      // Call Kai prediction API
      const predictionResponse = await fetch(`${baseUrl}/api/kai/predict`, {
        method: 'POST',
        body: formData
      });

      if (predictionResponse.ok) {
        const prediction = await predictionResponse.json();

        if (prediction.success) {
          const dps = prediction.predicted_dps;
          const confidence = prediction.confidence;

          // Update item with prediction
          await supabase
            .from('bulk_download_items')
            .update({
              prediction_id: prediction.prediction_id,
              predicted_dps: dps
            })
            .eq('id', item.id);

          // Aggregate stats
          testedCount++;
          totalDps += dps;
          totalConfidence += confidence;

          // Update distribution
          if (dps <= 20) distribution['0-20']++;
          else if (dps <= 40) distribution['21-40']++;
          else if (dps <= 60) distribution['41-60']++;
          else if (dps <= 80) distribution['61-80']++;
          else distribution['81-100']++;

          // Update potential counts
          const potential = prediction.viral_potential;
          if (potential === 'mega-viral') potentials.mega++;
          else if (potential === 'viral') potentials.viral++;
          else if (potential === 'good') potentials.good++;
          else if (potential === 'average') potentials.average++;
          else potentials.low++;

          console.log(`[Batch Test] ✓ ${item.video_id}: ${dps.toFixed(1)} DPS (${potential})`);
        }
      }

      // Update progress
      await supabase
        .from('batch_test_runs')
        .update({ tested_count: testedCount })
        .eq('id', testRunId);

      // Small delay to avoid overwhelming the prediction system
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error: any) {
      console.error(`[Batch Test] Error testing ${item.video_id}:`, error.message);
    }
  }

  // Calculate final averages
  const avgDps = testedCount > 0 ? totalDps / testedCount : 0;
  const avgConfidence = testedCount > 0 ? totalConfidence / testedCount : 0;

  // Update test run with results
  await supabase
    .from('batch_test_runs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      tested_count: testedCount,
      avg_predicted_dps: avgDps,
      avg_confidence: avgConfidence,
      results_summary: {
        distribution,
        potentials,
        mega_viral_count: potentials.mega,
        viral_count: potentials.viral,
        good_count: potentials.good,
        average_count: potentials.average,
        low_count: potentials.low
      }
    })
    .eq('id', testRunId);

  console.log(`[Batch Test] Completed: ${testedCount}/${items.length} tested, avg DPS: ${avgDps.toFixed(1)}`);
}














