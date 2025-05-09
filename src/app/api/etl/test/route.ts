import { NextRequest, NextResponse } from 'next/server';
import { runEtlIntegrationTests } from '@/lib/test/etl-integration-test';

/**
 * API route for testing ETL functionality
 * 
 * Triggers a series of tests to verify:
 * 1. Apify scraper functionality
 * 2. Extended Firestore fields
 * 3. ETL error handling and logging
 * 4. Scheduled job alerts
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.ADMIN_API_KEY;
    
    if (!expectedApiKey) {
      return NextResponse.json({ error: 'ADMIN_API_KEY not configured on server' }, { status: 500 });
    }
    
    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request options
    const options = await request.json();
    
    // Run the test suite
    console.log('Starting ETL integration tests...');
    const results = await runEtlIntegrationTests(options);
    
    // Return the results
    return NextResponse.json({
      success: results.success,
      message: results.success ? 'ETL integration tests completed successfully' : 'ETL integration tests failed',
      ...results
    });
  } catch (error) {
    console.error('Error running ETL tests:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
} 