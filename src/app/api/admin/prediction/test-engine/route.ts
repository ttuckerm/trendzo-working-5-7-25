import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing prediction engine basic loading...');
    
    // Try to import the MainPredictionEngine
    const { MainPredictionEngine } = await import('@/lib/services/viral-prediction/main-prediction-engine');
    
    // Test basic instantiation
    const engine = new MainPredictionEngine();
    
    return NextResponse.json({
      success: true,
      status: 'MainPredictionEngine loaded successfully',
      timestamp: new Date().toISOString(),
      test: 'basic_engine_loading',
      engine_ready: true
    });

  } catch (error) {
    console.error('❌ Engine loading test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Engine loading failed',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      test: 'basic_engine_loading'
    }, { status: 500 });
  }
} 