import { NextRequest, NextResponse } from 'next/server';
import {
  TestingFramework,
  HistoricalTest,
  LiveTrackingTest
} from '@/lib/donna/testing/testing-framework';

/**
 * Run Testing Framework
 *
 * POST /api/donna/test/run
 *
 * Runs validation tests to verify The Donna's prediction accuracy.
 *
 * Body:
 * {
 *   "testType": "all" | "historical" | "live-tracking",
 *   "config": { ... test-specific config ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType = 'all', config = {} } = body;

    let results;

    switch (testType) {
      case 'all':
        results = await TestingFramework.getInstance().runAllTests();
        break;

      case 'historical':
        results = [await HistoricalTest.getInstance().run(config)];
        break;

      case 'live-tracking':
        results = [await LiveTrackingTest.getInstance().run(config)];
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown test type: ${testType}. Use 'all', 'historical', or 'live-tracking'.`
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      testType,
      results
    });

  } catch (error) {
    console.error('[Test Run] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
