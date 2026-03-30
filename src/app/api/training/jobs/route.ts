import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { executeTrainingJob } from '@/lib/training/training-executor';
import { TRAINING_V2_ENABLED } from '@/lib/training/feature-availability-matrix';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY!
  );

  const { data, error } = await supabase
    .from('training_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    // If table doesn't exist, return empty array with mock data for testing
    if (error.code === '42P01') {
      return NextResponse.json({ 
        jobs: getMockJobs(),
        note: 'Using mock data - training_jobs table not found'
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: data || [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY!
  );

  // First, get training data stats to include in job config
  const { data: trainingData, error: statsError } = await supabase
    .from('training_data')
    .select('id, data_split')
    .eq('included_in_training', true);

  const trainSamples = trainingData?.filter(d => d.data_split === 'train').length || 0;
  const validationSamples = trainingData?.filter(d => d.data_split === 'validation').length || 0;

  // Create training job record
  const { data: job, error } = await supabase
    .from('training_jobs')
    .insert({
      status: 'queued',
      model_type: body.modelType || 'xgboost',
      config: {
        ...(body.config || {}),
        train_samples: trainSamples,
        validation_samples: validationSamples
      },
      progress: 0
    })
    .select()
    .single();

  if (error) {
    // If table doesn't exist, return mock job
    if (error.code === '42P01') {
      return NextResponse.json({ 
        job: {
          id: crypto.randomUUID(),
          status: 'queued',
          model_type: body.modelType || 'xgboost',
          config: body.config || {},
          progress: 0,
          created_at: new Date().toISOString()
        },
        note: 'Mock job created - training_jobs table not found'
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget: execute training via the v2 executor
  // (handles contamination audit, Python subprocess, model versioning)
  executeTrainingJob(job.id, {
    modelType: body.modelType || 'xgboost',
    ...(body.config || {}),
  }).catch((err) => {
    console.error('[Jobs] Training execution failed:', err);
  });

  return NextResponse.json({ job });
}

function getMockJobs() {
  return [
    {
      id: 'mock-job-1',
      status: 'completed',
      model_type: 'xgboost',
      started_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date(Date.now() - 3000000).toISOString(),
      progress: 100,
      config: {
        n_estimators: 100,
        max_depth: 6,
        learning_rate: 0.1,
        train_samples: 550,
        validation_samples: 120
      },
      results: {
        accuracy: 0.74,
        mae: 9.2,
        rmse: 12.1,
        calibration: 0.97
      },
      error: null,
      created_at: new Date(Date.now() - 3700000).toISOString()
    },
    {
      id: 'mock-job-2',
      status: 'completed',
      model_type: 'xgboost',
      started_at: new Date(Date.now() - 86400000).toISOString(),
      completed_at: new Date(Date.now() - 85800000).toISOString(),
      progress: 100,
      config: {
        n_estimators: 80,
        max_depth: 5,
        learning_rate: 0.15,
        train_samples: 480,
        validation_samples: 100
      },
      results: {
        accuracy: 0.71,
        mae: 10.1,
        rmse: 13.4,
        calibration: 0.94
      },
      error: null,
      created_at: new Date(Date.now() - 86500000).toISOString()
    }
  ];
}
