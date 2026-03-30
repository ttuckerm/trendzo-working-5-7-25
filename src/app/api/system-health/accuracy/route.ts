/**
 * System Health - Prediction Accuracy API
 * 
 * FIXED: Now reads from 'video_analysis' and 'training_features' tables
 * (Kai Orchestrator output) instead of returning mock data.
 * 
 * DATA FLOW:
 *   Kai Orchestrator → video_analysis table → This API → Control Center UI
 * 
 * BEFORE: Returned hard-coded mock predictions
 * AFTER:  Reads real predictions from video_analysis
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AccuracyData } from '@/lib/control-center/types';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!
  );
}

export async function GET() {
  try {
    const supabase = getSupabase();

    // =========================================================================
    // 1. Get predictions with actual results from video_analysis + training_features
    // =========================================================================
    
    // video_analysis has: final_dps_prediction
    // training_features has: actual_dps_score
    // We need to join them by video_id
    
    const { data: analysisData, error: analysisError } = await supabase
      .from('video_analysis')
      .select(`
        id,
        video_id,
        final_dps_prediction,
        final_confidence,
        created_at,
        extraction_version
      `)
      .not('final_dps_prediction', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (analysisError) {
      console.error('Error fetching video_analysis:', analysisError);
    }

    // Get actual DPS scores from training_features
    const { data: trainingData, error: trainingError } = await supabase
      .from('training_features')
      .select(`
        video_id,
        actual_dps_score
      `)
      .not('actual_dps_score', 'is', null);

    if (trainingError) {
      console.error('Error fetching training_features:', trainingError);
    }

    // Create lookup for actual DPS
    const actualDpsMap = new Map<string, number>();
    if (trainingData) {
      trainingData.forEach(row => {
        actualDpsMap.set(row.video_id, row.actual_dps_score);
      });
    }

    // =========================================================================
    // 2. Build prediction records with both predicted and actual
    // =========================================================================
    
    const predictions: Array<{
      date: string;
      predicted: number;
      actual: number;
      error: number;
      videoId: string;
    }> = [];

    if (analysisData) {
      analysisData.forEach(row => {
        const actual = actualDpsMap.get(row.video_id);
        if (actual !== undefined && row.final_dps_prediction !== null) {
          const predicted = row.final_dps_prediction;
          const error = predicted - actual;
          
          predictions.push({
            date: new Date(row.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            }),
            predicted: Math.round(predicted * 10) / 10,
            actual: Math.round(actual * 10) / 10,
            error: Math.round(error * 10) / 10,
            videoId: row.video_id
          });
        }
      });
    }

    // =========================================================================
    // 3. Get component-level scores from the most recent prediction
    // =========================================================================
    
    let componentScores: Array<{ name: string; score: number; weight: number }> = [];
    
    if (analysisData && analysisData.length > 0) {
      const latestVideoId = analysisData[0].video_id;
      const latestAnalysisId = analysisData[0].id;
      
      const { data: componentData } = await supabase
        .from('component_results')
        .select('component_id, prediction, confidence')
        .eq('analysis_id', latestAnalysisId)
        .not('prediction', 'is', null);

      if (componentData) {
        const componentWeights: Record<string, number> = {
          'xgboost': 15,
          'gpt4': 12,
          'gemini': 10,
          'claude': 8,
          'feature-extraction': 10,
          '7-legos': 10,
          '9-attributes': 10,
          '24-styles': 5,
          'virality-matrix': 8,
          'hook-scorer': 7,
          'pattern-extraction': 5
        };

        const componentNames: Record<string, string> = {
          'xgboost': 'XGBoost Predictor',
          'gpt4': 'GPT-4 Refinement',
          'gemini': 'Gemini Pro',
          'claude': 'Claude Analyzer',
          'feature-extraction': 'Feature Extraction',
          '7-legos': '7 Idea Legos',
          '9-attributes': '9 Attributes',
          '24-styles': '24 Video Styles',
          'virality-matrix': 'Virality Matrix',
          'hook-scorer': 'Hook Scorer',
          'pattern-extraction': 'Pattern Extraction'
        };

        componentScores = componentData
          .filter(c => componentWeights[c.component_id])
          .map(c => ({
            name: componentNames[c.component_id] || c.component_id,
            score: Math.round(c.prediction * 10) / 10,
            weight: componentWeights[c.component_id] || 5
          }))
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 5);
      }
    }

    // =========================================================================
    // 4. Calculate average accuracy
    // =========================================================================
    
    let avgAccuracy = 0;
    if (predictions.length > 0) {
      const totalError = predictions.reduce((sum, p) => sum + Math.abs(p.error), 0);
      const avgError = totalError / predictions.length;
      // Convert error to accuracy (100 - avg absolute error, capped at 0-100)
      avgAccuracy = Math.max(0, Math.min(100, 100 - avgError));
    }

    // =========================================================================
    // 5. Build response
    // =========================================================================
    
    const accuracyData: AccuracyData & { dataSource: string; recordCount: number } = {
      predictions: predictions.slice(0, 10).map(p => ({
        date: p.date,
        predicted: p.predicted,
        actual: p.actual,
        error: p.error
      })),
      avgAccuracy: Math.round(avgAccuracy * 10) / 10,
      lastPrediction: predictions.length > 0 ? {
        predicted: predictions[0].predicted,
        actual: predictions[0].actual,
        error: predictions[0].error,
        componentScores
      } : null,
      // Metadata for transparency
      dataSource: 'video_analysis + training_features',
      recordCount: predictions.length
    };
    
    return NextResponse.json(accuracyData);

  } catch (error) {
    console.error('Error in accuracy endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch accuracy data',
        dataSource: 'video_analysis + training_features (error)',
        predictions: [],
        avgAccuracy: 0,
        lastPrediction: null
      },
      { status: 500 }
    );
  }
}




























































