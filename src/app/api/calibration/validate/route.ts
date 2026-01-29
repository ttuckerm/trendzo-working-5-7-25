import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import crypto from 'crypto';

/**
 * Store validation results for learning loop
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      videoId,
      predictedDPS, 
      actualDPS,
      componentScores,
      calibratedScores,
      negativeSignals,
      transcript,
      niche,
      metadata
    } = await request.json();

    if (predictedDPS === undefined || actualDPS === undefined) {
      return NextResponse.json(
        { success: false, error: 'predictedDPS and actualDPS are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    const error = predictedDPS - actualDPS;
    const errorPercentage = actualDPS !== 0 ? (error / actualDPS) * 100 : 0;
    const withinTarget = Math.abs(error) <= 10;

    // Store in prediction_accuracy table
    const { data, error: dbError } = await supabase
      .from('prediction_accuracy')
      .insert({
        video_id: videoId || `manual_${Date.now()}`,
        predicted_dps: predictedDPS,
        actual_dps: actualDPS,
        error: error,
        error_percentage: errorPercentage,
        component_scores: componentScores || {},
        calibrated_scores: calibratedScores || {},
        negative_signals: negativeSignals || [],
        transcript_hash: transcript ? hashTranscript(transcript) : null,
        niche: niche || 'unknown',
        metadata: metadata || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB error storing validation:', dbError);
      // Continue even if DB fails - return success but note the DB issue
      return NextResponse.json({
        success: true,
        validationId: null,
        error: error,
        errorPercentage,
        withinTarget,
        dbWarning: dbError.message
      });
    }

    // Trigger learning loop update
    await triggerLearningUpdate({
      validationId: data.id,
      predictedDPS,
      actualDPS,
      error,
      componentScores,
      calibratedScores,
      niche
    });

    return NextResponse.json({
      success: true,
      validationId: data.id,
      error,
      errorPercentage,
      withinTarget,
      analysis: {
        overPredicted: error > 0,
        underPredicted: error < 0,
        severity: Math.abs(error) > 20 ? 'high' : Math.abs(error) > 10 ? 'medium' : 'low'
      }
    });

  } catch (error: any) {
    console.error('Validation storage error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to store validation', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get validation history and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const niche = searchParams.get('niche');
    
    const supabase = createRouteHandlerClient({ cookies });
    
    let query = supabase
      .from('prediction_accuracy')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (niche) {
      query = query.eq('niche', niche);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('DB error fetching validations:', error);
      return NextResponse.json({
        success: true,
        validations: [],
        stats: null,
        warning: error.message
      });
    }
    
    // Calculate statistics
    const stats = calculateValidationStats(data || []);
    
    return NextResponse.json({
      success: true,
      validations: data || [],
      stats
    });
  } catch (error: any) {
    console.error('Error fetching validations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch validations', message: error.message },
      { status: 500 }
    );
  }
}

function hashTranscript(transcript: string): string {
  return crypto.createHash('md5').update(transcript).digest('hex');
}

function calculateValidationStats(validations: any[]) {
  if (validations.length === 0) {
    return {
      count: 0,
      avgError: 0,
      avgAbsError: 0,
      withinTargetRate: 0,
      systematicBias: 0
    };
  }
  
  const errors = validations.map(v => v.error);
  const absErrors = errors.map(e => Math.abs(e));
  const withinTarget = errors.filter(e => Math.abs(e) <= 10).length;
  
  return {
    count: validations.length,
    avgError: errors.reduce((a, b) => a + b, 0) / errors.length,
    avgAbsError: absErrors.reduce((a, b) => a + b, 0) / absErrors.length,
    withinTargetRate: (withinTarget / validations.length) * 100,
    systematicBias: errors.reduce((a, b) => a + b, 0) / errors.length
  };
}

async function triggerLearningUpdate(data: any): Promise<void> {
  try {
    // This would call your learning loop API
    // For now, we'll just log it
    console.log('Learning update triggered:', {
      validationId: data.validationId,
      error: data.error,
      niche: data.niche
    });
    
    // In production:
    // await fetch('/api/learning/update', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     type: 'prediction_validation',
    //     data
    //   })
    // });
  } catch (error) {
    console.error('Learning loop update failed:', error);
  }
}




























































































