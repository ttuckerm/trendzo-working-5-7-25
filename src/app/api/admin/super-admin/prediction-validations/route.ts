import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}
const supabase = new Proxy({}, { get(_t, p){ return (getDb() as any)[p as any] } }) as any;

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Fetching prediction validation data...');

    // Get validation data from our database
    const { data: validations, error } = await supabase
      .from('prediction_validation')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Transform validation data for dashboard consumption
    const transformedValidations = validations?.map(validation => ({
      id: validation.id,
      prediction_id: validation.prediction_id,
      video_id: validation.video_id,
      predicted_score: validation.predicted_viral_score,
      actual_score: validation.actual_viral_score,
      predicted_views: validation.predicted_views,
      actual_views: validation.actual_views,
      accuracy: validation.accuracy_percentage,
      status: validation.validation_status,
      timestamp: validation.validation_timestamp || validation.created_at,
      created_at: validation.created_at,
      // Calculate accuracy category
      accuracy_category: validation.accuracy_percentage 
        ? validation.accuracy_percentage >= 90 ? 'excellent'
        : validation.accuracy_percentage >= 80 ? 'good'
        : validation.accuracy_percentage >= 70 ? 'fair'
        : 'poor'
        : 'pending'
    })) || [];

    // Calculate summary statistics
    const validatedPredictions = transformedValidations.filter(v => v.status === 'validated');
    const totalValidated = validatedPredictions.length;
    const accuratePredictions = validatedPredictions.filter(v => v.accuracy && v.accuracy >= 80);
    
    const summary = {
      total_validations: transformedValidations.length,
      validated_count: totalValidated,
      pending_count: transformedValidations.filter(v => v.status === 'pending').length,
      average_accuracy: totalValidated > 0 
        ? validatedPredictions.reduce((sum, v) => sum + (v.accuracy || 0), 0) / totalValidated
        : 0,
      accuracy_rate: totalValidated > 0 
        ? (accuratePredictions.length / totalValidated) * 100 
        : 0,
      last_validation: transformedValidations[0]?.timestamp || null
    };

    console.log(`✅ Retrieved ${transformedValidations.length} validation records`);

    return NextResponse.json({
      validations: transformedValidations,
      summary: summary,
      timestamp: new Date().toISOString(),
      dataSource: 'REAL_DATABASE'
    });

  } catch (error) {
    console.error('❌ Prediction validation fetch failed:', error);
    
    // Return empty but valid structure for dashboard compatibility
    return NextResponse.json({
      validations: [],
      summary: {
        total_validations: 0,
        validated_count: 0,
        pending_count: 0,
        average_accuracy: 0,
        accuracy_rate: 0,
        last_validation: null
      },
      error: error instanceof Error ? error.message : 'Validation fetch failed',
      timestamp: new Date().toISOString(),
      dataSource: 'ERROR_FALLBACK'
    }, { status: 500 });
  }
} 