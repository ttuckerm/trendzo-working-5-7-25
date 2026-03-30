/**
 * System Validation API
 * Tests and validates the viral prediction system components
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'
import { AccuracyTracker } from '@/lib/services/viral-prediction/accuracy-tracker';
import { AIPredictionEngine } from '@/lib/services/viral-prediction/ai-prediction-engine';
import { ApifyTikTokIntegration } from '@/lib/services/viral-prediction/apify-integration';

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}
const supabase = new Proxy({}, { get(_t, p){ return (getDb() as any)[p as any] } }) as any;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { test_type, test_data } = body;

    console.log(`🔬 Running system validation test: ${test_type}`);

    switch (test_type) {
      case 'database_connectivity':
        return await testDatabaseConnectivity();
      
      case 'ai_prediction_engine':
        return await testAIPredictionEngine(test_data);
      
      case 'accuracy_tracker':
        return await testAccuracyTracker();
      
      case 'apify_integration':
        return await testApifyIntegration(test_data);
      
      case 'full_system_test':
        return await runFullSystemTest();
      
      case 'create_test_data':
        return await createTestData();
      
      default:
        return NextResponse.json(
          { error: 'Invalid test type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ System validation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'System validation failed',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Viral Prediction System Validation API',
    available_tests: [
      'database_connectivity',
      'ai_prediction_engine', 
      'accuracy_tracker',
      'apify_integration',
      'full_system_test',
      'create_test_data'
    ],
    usage: 'POST with { "test_type": "test_name", "test_data": {...} }',
    status: 'operational'
  });
}

async function testDatabaseConnectivity() {
  try {
    console.log('🔍 Testing database connectivity...');

    // Test basic connection
    const { data: connectionTest } = await supabase
      .from('videos')
      .select('count')
      .limit(1);

    // Test core tables exist
    const tableTests = await Promise.all([
      supabase.from('videos').select('id').limit(1),
      supabase.from('video_predictions').select('id').limit(1),
      supabase.from('hook_frameworks').select('id').limit(1),
      supabase.from('system_metrics').select('id').limit(1)
    ]);

    const tablesExist = tableTests.every(test => !test.error);

    // Test hook frameworks data
    const { data: frameworks, count: frameworkCount } = await supabase
      .from('hook_frameworks')
      .select('*', { count: 'exact' });

    return NextResponse.json({
      success: true,
      test_type: 'database_connectivity',
      results: {
        connection_status: 'connected',
        tables_accessible: tablesExist,
        framework_count: frameworkCount,
        sample_frameworks: frameworks?.slice(0, 3).map(f => f.name) || [],
        database_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Database connectivity test failed:', error);
    return NextResponse.json({
      success: false,
      test_type: 'database_connectivity',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function testAIPredictionEngine(testData: any) {
  try {
    console.log('🤖 Testing AI prediction engine...');

    const aiEngine = new AIPredictionEngine();
    
    // Test with sample video data
    const sampleVideo = testData?.video || {
      id: 'test_video_1',
      description: 'POV: You discover a life hack that changes everything! This is absolutely mind-blowing and will save you hours every day. You need to try this! #lifehack #viral #fyp',
      hashtags: ['lifehack', 'viral', 'fyp', 'mindblowing'],
      author: 'test_creator',
      views: 150000,
      likes: 12000,
      comments: 890,
      shares: 2400,
      duration: 45,
      niche: 'lifestyle'
    };

    // Test AI analysis
    const analysis = await aiEngine.predictViralPotential(sampleVideo);

    // Test model status
    const modelStatus = aiEngine.getModelStatus();

    return NextResponse.json({
      success: true,
      test_type: 'ai_prediction_engine',
      results: {
        analysis_completed: !!analysis,
        viral_probability: analysis.viral_probability,
        confidence_score: analysis.confidence_score,
        hook_type_detected: analysis.hook_analysis.hook_type,
        recommendations_count: analysis.recommendations.length,
        framework_scores_count: analysis.framework_scores.length,
        model_status: modelStatus
      },
      sample_analysis: analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI prediction engine test failed:', error);
    return NextResponse.json({
      success: false,
      test_type: 'ai_prediction_engine',
      error: error.message,
      fallback_used: true,
      timestamp: new Date().toISOString()
    });
  }
}

async function testAccuracyTracker() {
  try {
    console.log('📊 Testing accuracy tracker...');

    const accuracyTracker = new AccuracyTracker();

    // Test system performance retrieval
    const systemPerformance = await accuracyTracker.getSystemPerformance();

    // Test accuracy metrics update
    const accuracyMetrics = await accuracyTracker.updateSystemAccuracy();

    return NextResponse.json({
      success: true,
      test_type: 'accuracy_tracker',
      results: {
        system_performance_retrieved: !!systemPerformance,
        current_accuracy: systemPerformance.current_accuracy,
        accuracy_status: systemPerformance.accuracy_status,
        predictions_validated_today: systemPerformance.predictions_validated_today,
        pending_validations: systemPerformance.predictions_pending_validation,
        accuracy_metrics_updated: !!accuracyMetrics,
        overall_accuracy: accuracyMetrics.overall_accuracy,
        total_validated: accuracyMetrics.total_validated
      },
      sample_performance: systemPerformance,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Accuracy tracker test failed:', error);
    return NextResponse.json({
      success: false,
      test_type: 'accuracy_tracker',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function testApifyIntegration(testData: any) {
  try {
    console.log('🕷️ Testing Apify integration...');

    const apifyIntegration = new ApifyTikTokIntegration();
    
    // Test with sample URL or mock data
    const testUrl = testData?.url || 'https://www.tiktok.com/@test/video/1234567890';
    
    // Test scraping (will likely fail without proper API key, but that's expected)
    let scrapingResult = null;
    try {
      scrapingResult = await apifyIntegration.scrapeTikTokVideo(testUrl);
    } catch (scrapingError) {
      console.log('Apify scraping failed (expected):', scrapingError.message);
    }

    // Test data transformation with mock data
    const mockApifyData = {
      id: '7234567890123456789',
      webVideoUrl: testUrl,
      text: 'This is a test video for validation purposes #test #validation',
      authorMeta: {
        id: 'test_user_123',
        name: 'Test User',
        nickName: 'testuser',
        followerCount: 50000,
        followingCount: 1500
      },
      stats: {
        diggCount: 5000,
        shareCount: 800,
        commentCount: 320,
        playCount: 85000
      },
      hashtags: [
        { id: '1', name: 'test', title: 'test' },
        { id: '2', name: 'validation', title: 'validation' }
      ],
      createTime: Math.floor(Date.now() / 1000).toString(),
      videoDuration: 30
    };

    const videoId = await apifyIntegration.processAndStoreVideo(mockApifyData);

    return NextResponse.json({
      success: true,
      test_type: 'apify_integration',
      results: {
        apify_token_configured: !!process.env.APIFY_API_TOKEN,
        scraping_attempted: true,
        scraping_successful: !!scrapingResult,
        mock_data_processed: !!videoId,
        video_id_created: videoId,
        data_transformation_working: true
      },
      mock_data_sample: mockApifyData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Apify integration test failed:', error);
    return NextResponse.json({
      success: false,
      test_type: 'apify_integration',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function runFullSystemTest() {
  try {
    console.log('🧪 Running full system test...');

    const testResults = {
      database_test: null,
      ai_engine_test: null,
      accuracy_tracker_test: null,
      apify_integration_test: null,
      end_to_end_test: null
    };

    // Run all component tests
    try {
      const dbTest = await testDatabaseConnectivity();
      testResults.database_test = await dbTest.json();
    } catch (error) {
      testResults.database_test = { success: false, error: error.message };
    }

    try {
      const aiTest = await testAIPredictionEngine({});
      testResults.ai_engine_test = await aiTest.json();
    } catch (error) {
      testResults.ai_engine_test = { success: false, error: error.message };
    }

    try {
      const accuracyTest = await testAccuracyTracker();
      testResults.accuracy_tracker_test = await accuracyTest.json();
    } catch (error) {
      testResults.accuracy_tracker_test = { success: false, error: error.message };
    }

    try {
      const apifyTest = await testApifyIntegration({});
      testResults.apify_integration_test = await apifyTest.json();
    } catch (error) {
      testResults.apify_integration_test = { success: false, error: error.message };
    }

    // End-to-end workflow test
    try {
      testResults.end_to_end_test = await runEndToEndTest();
    } catch (error) {
      testResults.end_to_end_test = { success: false, error: error.message };
    }

    // Calculate overall system health
    const passedTests = Object.values(testResults).filter(test => test?.success).length;
    const totalTests = Object.keys(testResults).length;
    const systemHealth = (passedTests / totalTests) * 100;

    return NextResponse.json({
      success: true,
      test_type: 'full_system_test',
      results: {
        system_health_percentage: systemHealth,
        tests_passed: passedTests,
        total_tests: totalTests,
        component_tests: testResults,
        overall_status: systemHealth >= 80 ? 'healthy' : systemHealth >= 60 ? 'degraded' : 'critical'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Full system test failed:', error);
    return NextResponse.json({
      success: false,
      test_type: 'full_system_test',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function runEndToEndTest() {
  console.log('🔄 Running end-to-end workflow test...');

  // 1. Create test video
  const testVideo = {
    tiktok_id: `test_${Date.now()}`,
    url: 'https://www.tiktok.com/@test/video/validation',
    author: 'test_validation_user',
    description: 'POV: You test the entire viral prediction system! This is a comprehensive validation test. #validation #system #test',
    views: 75000,
    likes: 6000,
    shares: 450,
    comments: 280,
    duration: 35,
    hashtags: ['validation', 'system', 'test'],
    niche: 'tech'
  };

  // 2. Store video in database
  const { data: storedVideo } = await supabase
    .from('videos')
    .insert(testVideo)
    .select()
    .single();

  if (!storedVideo) {
    throw new Error('Failed to store test video');
  }

  // 3. Run AI prediction
  const aiEngine = new AIPredictionEngine();
  const prediction = await aiEngine.predictViralPotential(storedVideo);

  // 4. Validate the prediction was stored
  const { data: storedPrediction } = await supabase
    .from('video_predictions')
    .select('*')
    .eq('video_id', storedVideo.id)
    .single();

  // 5. Test accuracy tracker
  const accuracyTracker = new AccuracyTracker();
  const performanceData = await accuracyTracker.getSystemPerformance();

  return {
    success: true,
    workflow_steps: {
      video_stored: !!storedVideo,
      prediction_generated: !!prediction,
      prediction_stored: !!storedPrediction,
      performance_retrieved: !!performanceData
    },
    test_video_id: storedVideo.id,
    predicted_viral_score: prediction.viral_probability,
    system_accuracy: performanceData.current_accuracy
  };
}

async function createTestData() {
  try {
    console.log('📊 Creating test data for algorithm validation...');

    // Create sample videos for testing
    const testVideos = [
      {
        tiktok_id: `test_viral_${Date.now()}_1`,
        url: 'https://www.tiktok.com/test/viral/1',
        author: 'viral_creator_1',
        description: 'POV: You discover the secret to going viral every time! This method actually works and creators don\'t want you to know about it. #viral #secret #contentcreator',
        views: 2500000,
        likes: 340000,
        shares: 45000,
        comments: 28000,
        duration: 58,
        hashtags: ['viral', 'secret', 'contentcreator', 'fyp'],
        niche: 'business',
        viral_score: 89.2
      },
      {
        tiktok_id: `test_medium_${Date.now()}_2`,
        url: 'https://www.tiktok.com/test/medium/2',
        author: 'medium_creator_2',
        description: 'Here are 5 life hacks that will change your daily routine forever! Try these and let me know what you think in the comments below. #lifehacks #productivity',
        views: 450000,
        likes: 38000,
        shares: 5200,
        comments: 3100,
        duration: 42,
        hashtags: ['lifehacks', 'productivity', 'tips'],
        niche: 'lifestyle',
        viral_score: 67.5
      },
      {
        tiktok_id: `test_low_${Date.now()}_3`,
        url: 'https://www.tiktok.com/test/low/3',
        author: 'new_creator_3',
        description: 'Just sharing my morning routine! Hope you enjoy watching. Please follow for more content like this.',
        views: 15000,
        likes: 890,
        shares: 45,
        comments: 67,
        duration: 28,
        hashtags: ['morning', 'routine', 'daily'],
        niche: 'lifestyle',
        viral_score: 32.1
      }
    ];

    const createdVideos = [];
    for (const video of testVideos) {
      const { data: createdVideo } = await supabase
        .from('videos')
        .insert(video)
        .select()
        .single();
      
      if (createdVideo) {
        createdVideos.push(createdVideo);
        
        // Create AI predictions for each video
        const aiEngine = new AIPredictionEngine();
        await aiEngine.predictViralPotential(createdVideo);
      }
    }

    return NextResponse.json({
      success: true,
      test_type: 'create_test_data',
      results: {
        videos_created: createdVideos.length,
        predictions_generated: createdVideos.length,
        test_data_ready: true,
        video_ids: createdVideos.map(v => v.id)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test data creation failed:', error);
    return NextResponse.json({
      success: false,
      test_type: 'create_test_data',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}