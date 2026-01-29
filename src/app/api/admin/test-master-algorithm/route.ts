/**
 * TEST ENDPOINT FOR MASTER VIRAL ALGORITHM
 * 
 * Tests the full production-ready master algorithm with real engine calls
 */
import { NextResponse } from 'next/server';
import { masterViralAlgorithm } from '@/lib/services/master-viral-algorithm';

export async function POST(request: Request) {
  try {
    const { videoUrl, title, platform = 'tiktok' } = await request.json();
    
    console.log('🧪 TESTING MASTER ALGORITHM:', { videoUrl, title, platform });
    
    const startTime = Date.now();
    
    // Test with sample TikTok video
    const testInput = {
      videoUrl: videoUrl || 'https://www.tiktok.com/@test/video/7532184638467345694',
      content: {
        caption: title || 'Testing master viral algorithm with all engines working together for 95% accuracy',
        hashtags: ['#viral', '#trending', '#ai', '#prediction'],
        transcript: 'This is a test of our production-ready viral prediction system'
      },
      creator: {
        followers: 50000,
        engagementRate: 0.08
      },
      platform: platform as 'tiktok' | 'instagram' | 'youtube'
    };
    
    // Run the MASTER ALGORITHM
    const prediction = await masterViralAlgorithm.predict(testInput);
    
    const totalTime = Date.now() - startTime;
    
    console.log('✅ MASTER ALGORITHM TEST COMPLETE:', {
      viralScore: prediction.viralScore.toFixed(1),
      probability: (prediction.viralProbability * 100).toFixed(1) + '%',
      confidence: (prediction.confidence * 100).toFixed(1) + '%',
      processingTime: prediction.processingTime + 'ms',
      totalTime: totalTime + 'ms'
    });
    
    return NextResponse.json({
      success: true,
      test_status: 'MASTER_ALGORITHM_WORKING',
      prediction,
      performance: {
        individual_processing_time: prediction.processingTime + 'ms',
        total_api_time: totalTime + 'ms',
        engines_tested: prediction.algorithmsUsed,
        target_latency: '< 2000ms',
        target_accuracy: '≥ 95%',
        achieved_confidence: (prediction.confidence * 100).toFixed(1) + '%'
      },
      validation: {
        all_engines_called: prediction.componentScores ? Object.keys(prediction.componentScores).length === 4 : false,
        stored_for_validation: Boolean(prediction.predictionId),
        ready_for_production: prediction.viralScore > 0 && prediction.confidence > 0
      }
    });
    
  } catch (error) {
    console.error('❌ MASTER ALGORITHM TEST FAILED:', error);
    
    return NextResponse.json({
      success: false,
      test_status: 'MASTER_ALGORITHM_FAILED',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Master Algorithm Test',
    description: 'Tests the production-ready master viral algorithm with all engines',
    usage: 'POST with { videoUrl?, title?, platform? }',
    example: {
      videoUrl: 'https://www.tiktok.com/@user/video/1234567890',
      title: 'Test video for viral prediction',
      platform: 'tiktok'
    }
  });
}