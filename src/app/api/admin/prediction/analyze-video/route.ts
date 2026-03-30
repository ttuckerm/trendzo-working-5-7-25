import { NextRequest, NextResponse } from 'next/server';
import { MainPredictionEngine } from '@/lib/services/viral-prediction/main-prediction-engine';

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Starting real viral prediction analysis...');
    
    const { tiktokUrl, videoId } = await request.json();
    
    if (!tiktokUrl && !videoId) {
      return NextResponse.json({
        success: false,
        error: 'TikTok URL or video ID required'
      }, { status: 400 });
    }

    // Initialize the real prediction engine
    const predictionEngine = new MainPredictionEngine();
    
    let result;
    
    if (tiktokUrl) {
      // Analyze from TikTok URL (scrapes real data)
      console.log(`🔍 Analyzing TikTok URL: ${tiktokUrl}`);
      result = await predictionEngine.analyzeVideoFromUrl(tiktokUrl);
    } else {
      // Analyze existing video by ID
      console.log(`🔍 Analyzing stored video: ${videoId}`);
      result = await predictionEngine.analyzeVideo(videoId);
    }

    console.log('✅ Real prediction analysis completed');
    
    return NextResponse.json({
      success: true,
      result,
      engine: 'MainPredictionEngine',
      timestamp: new Date().toISOString(),
      dataSource: 'REAL_PREDICTION_ENGINE'
    });

  } catch (error) {
    console.error('❌ Prediction analysis failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Prediction analysis failed',
      engine: 'MainPredictionEngine',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Health check for prediction engine
  try {
    const predictionEngine = new MainPredictionEngine();
    
    return NextResponse.json({
      success: true,
      status: 'Prediction engine ready',
      engine: 'MainPredictionEngine',
      timestamp: new Date().toISOString(),
      capabilities: [
        'TikTok URL analysis',
        'Real-time scraping via Apify',
        'Framework-based scoring (40+ frameworks)', 
        'God Mode psychological enhancements',
        'Dynamic percentile system',
        'Script intelligence integration'
      ]
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Engine initialization failed'
    }, { status: 500 });
  }
} 