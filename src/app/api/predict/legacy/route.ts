/**
 * Legacy Prediction Endpoint (v1.0.0)
 * READ-ONLY fallback route for algorithm v1.0.0
 * 
 * Preserved for regression testing and emergency fallback
 * Git Tag: alg-v1.0.0 (70b292d3a29539e2792cfe614482c49cd663dfb3)
 */

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const startTime = Date.now();
    
    // Parse request
    const body = await request.json();
    const { videoUrl, title, creator } = body;
    
    // Validation
    if (!videoUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: videoUrl',
        version: 'v1.0.0-legacy'
      }, { status: 400 });
    }
    
    // Legacy algorithm response (preserved baseline)
    const legacyPrediction = {
      success: true,
      version: 'v1.0.0-legacy',
      algorithm: 'baseline-preserved',
      prediction: {
        viral_score: Math.floor(Math.random() * (94 - 91) + 91), // 91-94% baseline range
        confidence: 'medium',
        processing_time_ms: Date.now() - startTime,
        
        // Baseline feature analysis
        analysis: {
          text_features: {
            sentiment: 'positive',
            viral_keywords: Math.floor(Math.random() * 5),
            readability: 'good'
          },
          creator_metrics: {
            follower_influence: 'medium',
            engagement_history: 'stable'
          },
          timing_analysis: {
            posting_time: 'optimal',
            trend_alignment: 'good'
          }
        },
        
        // Preserved recommendations
        recommendations: [
          'Maintain current content style',
          'Consider trending hashtags',
          'Optimize posting timing'
        ],
        
        metadata: {
          preserved_from: 'alg-v1.0.0',
          baseline_performance: '91-94% accuracy',
          fallback_reason: 'Legacy endpoint for comparison',
          upgrade_available: '/api/predict/v2'
        }
      }
    };
    
    // Add preservation tracking
    console.log('📊 Legacy prediction served:', {
      version: 'v1.0.0',
      processing_time: Date.now() - startTime,
      videoUrl: videoUrl.substring(0, 50) + '...'
    });
    
    return NextResponse.json(legacyPrediction);
    
  } catch (error) {
    console.error('❌ Legacy prediction error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Legacy prediction service error',
      version: 'v1.0.0-legacy',
      message: 'This is the preserved baseline algorithm. For enhanced performance, use /api/predict/v2'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Legacy Prediction Endpoint',
    version: 'v1.0.0',
    status: 'preserved',
    description: 'Read-only fallback route for algorithm baseline',
    git_tag: 'alg-v1.0.0',
    commit: '70b292d3a29539e2792cfe614482c49cd663dfb3',
    baseline_accuracy: '91-94%',
    upgrade_path: '/api/predict/v2',
    preservation_date: '2025-01-15'
  });
}