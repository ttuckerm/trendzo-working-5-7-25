/**
 * Data Explorer - Quality API
 * 
 * FIXED: Now cross-references scraped_videos with video_analysis and training_features
 * to show Kai Orchestrator's analysis data alongside raw scraped data.
 * 
 * DATA FLOW:
 *   scraped_videos (raw data)
 *   + video_analysis (Kai predictions)
 *   + training_features (extracted features)
 *   = Complete quality picture
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Disable caching to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!
    );

    // =========================================================================
    // 1. Get raw scraped video data
    // =========================================================================
    
    const { data: videos, error } = await supabase
      .from('scraped_videos')
      .select('video_id, dps_score, dps_classification, transcript_text, source');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch quality data',
        details: error.message 
      }, { status: 500 });
    }

    const total = videos?.length || 0;

    // =========================================================================
    // 2. Get Kai Orchestrator's analysis data from video_analysis
    // =========================================================================
    
    const { data: analysisData, error: analysisError } = await supabase
      .from('video_analysis')
      .select('video_id, final_dps_prediction, final_confidence, components_succeeded, extraction_version');

    if (analysisError) {
      console.error('Error fetching video_analysis:', analysisError);
    }

    // Create lookup map for analysis data
    const analysisMap = new Map<string, any>();
    if (analysisData) {
      analysisData.forEach(row => {
        analysisMap.set(row.video_id, row);
      });
    }

    // =========================================================================
    // 3. Get training features data
    // =========================================================================
    
    const { data: trainingData, error: trainingError } = await supabase
      .from('training_features')
      .select('video_id, feature_count, quality_score, has_text_features, has_ffmpeg_features');

    if (trainingError) {
      console.error('Error fetching training_features:', trainingError);
    }

    // Create lookup map for training features
    const trainingMap = new Map<string, any>();
    if (trainingData) {
      trainingData.forEach(row => {
        trainingMap.set(row.video_id, row);
      });
    }

    // =========================================================================
    // 4. Calculate metrics combining all data sources
    // =========================================================================
    
    // Basic completeness from scraped_videos
    const with_dps = videos?.filter(v => v.dps_score !== null).length || 0;
    const with_transcript = videos?.filter(v => v.transcript_text !== null && v.transcript_text !== '').length || 0;
    const with_classification = videos?.filter(v => v.dps_classification !== null).length || 0;
    const with_dps_and_transcript = videos?.filter(v => 
      v.dps_score !== null && 
      v.transcript_text !== null && 
      v.transcript_text !== ''
    ).length || 0;

    // Kai Orchestrator analysis stats
    const with_kai_analysis = analysisData?.length || 0;
    const with_kai_prediction = analysisData?.filter(a => a.final_dps_prediction !== null).length || 0;
    
    // Training features stats
    const with_training_features = trainingData?.length || 0;
    const avgFeatureCount = trainingData && trainingData.length > 0
      ? Math.round(trainingData.reduce((sum, t) => sum + (t.feature_count || 0), 0) / trainingData.length)
      : 0;
    const with_text_features = trainingData?.filter(t => t.has_text_features).length || 0;
    const with_ffmpeg_features = trainingData?.filter(t => t.has_ffmpeg_features).length || 0;

    // Count by source
    const by_source: Record<string, number> = {};
    videos?.forEach(v => {
      const source = v.source || 'unknown';
      by_source[source] = (by_source[source] || 0) + 1;
    });

    // Count by classification
    const by_classification: Record<string, number> = {
      'mega-viral': 0,
      'viral': 0,
      'normal': 0,
      'unclassified': 0
    };
    videos?.forEach(v => {
      const classification = v.dps_classification || 'unclassified';
      by_classification[classification] = (by_classification[classification] || 0) + 1;
    });

    // DPS statistics from scraped data
    const dps_values = videos
      ?.filter(v => v.dps_score !== null)
      .map(v => v.dps_score as number) || [];

    const avg_dps = dps_values.length > 0 
      ? dps_values.reduce((a, b) => a + b, 0) / dps_values.length 
      : 0;
    const max_dps = dps_values.length > 0 ? Math.max(...dps_values) : 0;
    const min_dps = dps_values.length > 0 ? Math.min(...dps_values) : 0;

    // DPS statistics from Kai predictions
    const kai_predictions = analysisData
      ?.filter(a => a.final_dps_prediction !== null)
      .map(a => a.final_dps_prediction as number) || [];
    
    const avg_predicted_dps = kai_predictions.length > 0
      ? kai_predictions.reduce((a, b) => a + b, 0) / kai_predictions.length
      : 0;

    // Calculate DPS distribution histogram
    const dps_histogram = calculateDPSHistogram(dps_values);

    // Calculate viral percentage
    const viral_count = (by_classification['mega-viral'] || 0) + (by_classification['viral'] || 0);
    const viral_percentage = total > 0 ? (viral_count / total) * 100 : 0;

    // =========================================================================
    // 5. Build comprehensive response
    // =========================================================================
    
    return NextResponse.json({
      success: true,
      
      // Data sources info
      dataSources: {
        scraped_videos: total,
        video_analysis: with_kai_analysis,
        training_features: with_training_features
      },
      
      // Raw scraped data stats
      total,
      with_dps,
      with_transcript,
      with_classification,
      with_dps_and_transcript,
      by_source,
      by_classification,
      missing_dps: total - with_dps,
      missing_transcript: total - with_transcript,
      avg_dps: Math.round(avg_dps * 10) / 10,
      max_dps: Math.round(max_dps * 10) / 10,
      min_dps: Math.round(min_dps * 10) / 10,
      dps_histogram,
      viral_percentage: Math.round(viral_percentage * 10) / 10,
      viral_count,

      // Kai Orchestrator analysis stats
      kaiAnalysis: {
        totalAnalyzed: with_kai_analysis,
        withPrediction: with_kai_prediction,
        avgPredictedDps: Math.round(avg_predicted_dps * 10) / 10,
        coveragePercent: total > 0 ? Math.round((with_kai_analysis / total) * 100 * 10) / 10 : 0
      },

      // Training features stats
      trainingFeatures: {
        totalWithFeatures: with_training_features,
        avgFeatureCount,
        withTextFeatures: with_text_features,
        withFFmpegFeatures: with_ffmpeg_features,
        coveragePercent: total > 0 ? Math.round((with_training_features / total) * 100 * 10) / 10 : 0
      },

      // Integration status
      integrationStatus: {
        kaiConnected: with_kai_analysis > 0,
        trainingConnected: with_training_features > 0,
        gapsIdentified: {
          needsKaiAnalysis: total - with_kai_analysis,
          needsTrainingFeatures: total - with_training_features
        }
      }
    });

  } catch (error) {
    console.error('Quality API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Calculate DPS distribution histogram
 */
function calculateDPSHistogram(dps_values: number[]): Array<{ range: string; count: number; percentage: number }> {
  if (dps_values.length === 0) return [];

  const ranges = [
    { label: '0-10', min: 0, max: 10 },
    { label: '10-20', min: 10, max: 20 },
    { label: '20-30', min: 20, max: 30 },
    { label: '30-40', min: 30, max: 40 },
    { label: '40-50', min: 40, max: 50 },
    { label: '50-60', min: 50, max: 60 },
    { label: '60-70', min: 60, max: 70 },
    { label: '70-80', min: 70, max: 80 },
    { label: '80-90', min: 80, max: 90 },
    { label: '90-100', min: 90, max: 100 },
  ];

  const total = dps_values.length;

  return ranges.map(range => {
    const count = dps_values.filter(v => v >= range.min && v < range.max).length;
    return {
      range: range.label,
      count,
      percentage: Math.round((count / total) * 100 * 10) / 10
    };
  });
}
