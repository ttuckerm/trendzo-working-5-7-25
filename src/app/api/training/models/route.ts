import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  console.log('=== /api/training/models called ===');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    console.log('URL exists:', !!supabaseUrl);
    console.log('Key exists:', !!supabaseKey);
    console.log('URL value:', supabaseUrl?.substring(0, 30) + '...');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({ 
        models: [], 
        error: 'Missing credentials',
        debug: { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey }
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Querying model_versions table...');
    
    const { data, error, count } = await supabase
      .from('model_versions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    console.log('Query complete - data:', JSON.stringify(data));
    console.log('Query complete - count:', count);
    console.log('Query complete - error:', error);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        models: [], 
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details
      }, { status: 500 });
    }

    // Transform flat DB columns to nested structure the UI expects
    const transformedModels = (data || []).map(model => ({
      id: model.id,
      version: model.version,
      created_at: model.created_at,
      status: model.status,
      training_job_id: model.training_job_id,
      metrics: {
        accuracy: model.accuracy || 0,
        mae: model.mae || 0,
        rmse: model.rmse || 0,
        calibration: model.calibration || 0,
        feature_importance: model.feature_importance || {}
      },
      config: {
        model_type: model.config?.model_type || model.model_type || 'xgboost',
        hyperparameters: model.hyperparameters || model.config?.hyperparameters || {},
        train_samples: model.train_samples || model.config?.train_samples || 0
      }
    }));

    console.log('Returning', transformedModels.length, 'models (transformed)');

    return NextResponse.json({ 
      models: transformedModels,
      count: transformedModels.length,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json({ 
      models: [], 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}