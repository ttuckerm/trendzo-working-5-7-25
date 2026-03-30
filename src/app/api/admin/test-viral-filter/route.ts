import { NextRequest, NextResponse } from 'next/server';
import { testViralFilter } from '@/lib/services/viralFilter';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting ViralFilter test...');
    const startTime = Date.now();

    // Run comprehensive test
    const testResult = await testViralFilter();

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    return NextResponse.json({
      success: testResult.success,
      message: testResult.success ? 'ViralFilter test completed successfully' : 'ViralFilter test failed',
      viralCount: testResult.viralCount,
      negativeCount: testResult.negativeCount,
      duration: totalDuration,
      processingTime: testResult.duration,
      timestamp: new Date().toISOString(),
      testDetails: {
        syntheticVideos: 105, // 100 regular + 5 viral
        expectedViral: 5,
        actualViral: testResult.viralCount,
        testPassed: testResult.success && testResult.viralCount >= 3 // Allow some variance
      }
    });

  } catch (error) {
    console.error('ViralFilter test error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'ViralFilter test failed',
        success: false,
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}