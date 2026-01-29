import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

  // Trigger training (in real implementation, this would call Python ML service)
  triggerTrainingJob(job.id);

  return NextResponse.json({ job });
}

async function triggerTrainingJob(jobId: string) {
  // This would call your Python ML service
  // POST /api/ml/train with jobId
  // The Python service updates job progress and results
  
  console.log(`Training job ${jobId} queued - trigger Python ML service`);
  
  // For demo purposes, simulate job progress updates
  // In production, the Python ML service would update these
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY!
  );

  // Update to running
  await supabase
    .from('training_jobs')
    .update({ 
      status: 'running', 
      started_at: new Date().toISOString(),
      progress: 0 
    })
    .eq('id', jobId);

  // Simulate progress updates (remove this in production)
  const progressUpdates = [10, 25, 40, 55, 70, 85, 95, 100];
  for (let i = 0; i < progressUpdates.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    await supabase
      .from('training_jobs')
      .update({ progress: progressUpdates[i] })
      .eq('id', jobId);
  }

  // Complete with mock results
  await supabase
    .from('training_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      progress: 100,
      results: {
        accuracy: 0.72 + Math.random() * 0.1,
        mae: 8.5 + Math.random() * 2,
        rmse: 11.2 + Math.random() * 3,
        calibration: 0.95 + Math.random() * 0.05
      }
    })
    .eq('id', jobId);

  // Create model version
  const versionNumber = `v1.${Date.now() % 1000}`;
  const accuracy = 0.72 + Math.random() * 0.1;
  const mae = 8.5 + Math.random() * 2;
  const rmse = 11.2 + Math.random() * 3;
  const calibration = 0.95 + Math.random() * 0.05;
  
  const { error: modelError } = await supabase
    .from('model_versions')
    .insert({
      version: versionNumber,
      status: 'testing',
      training_job_id: jobId,
      accuracy: accuracy,
      mae: mae,
      rmse: rmse,
      calibration: calibration,
      config: {
        model_type: 'xgboost',
        hyperparameters: { n_estimators: 100, max_depth: 6 }
      },
      hyperparameters: { n_estimators: 100, max_depth: 6 },
      train_samples: 500,
      feature_importance: {
        'engagement_rate': 0.15,
        'views_count': 0.12,
        'creator_followers_count': 0.11,
        'likes_count': 0.10
      },
      feature_count: 4
    });

  if (modelError) {
    console.error('[Jobs] Failed to create model_version:', modelError);
  } else {
    console.log('[Jobs] Created model_version:', versionNumber);
  }
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
