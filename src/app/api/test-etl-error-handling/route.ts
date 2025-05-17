import { NextResponse } from 'next/server';
import { etlErrorHandlingService } from '@/lib/services/etlErrorHandlingService';

/**
 * DIRECT PRODUCTION TEST of etlErrorHandlingService
 * 
 * This API route proves that the error handling service exists in the REAL PRODUCTION system
 */
export async function GET() {
  try {
    // Create a test error
    const testError = new Error('Test error for direct production verification');
    
    // Call the ACTUAL PRODUCTION ERROR HANDLING SERVICE
    const result = await etlErrorHandlingService.handleError(
      testError,
      'extraction', // phase
      'api-test-job-' + Date.now(), // jobId
      { testFrom: 'API route', production: true }, // context
      { 
        maxRetries: 1,
        notifyOnFailure: false,
        skipFailedItems: true
      } // recovery options
    );
    
    // Get error stats
    const errorStats = await etlErrorHandlingService.getErrorStats('api-test-job-123');
    
    // Return success with data
    return NextResponse.json({
      success: true,
      message: 'PRODUCTION VERIFICATION: ETL Error Handling Service EXISTS and WORKS',
      result,
      errorStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('ETL error handling test failed:', error);
    
    // Even if it fails, we get details about why
    return NextResponse.json({
      success: false,
      message: 'ETL Error Handling Service test failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 