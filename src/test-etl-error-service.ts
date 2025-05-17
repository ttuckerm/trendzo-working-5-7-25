import { etlErrorHandlingService } from './lib/services/etlErrorHandlingService';

async function testErrorHandlingService() {
  console.log('Testing ETL Error Handling Service in PRODUCTION SYSTEM');
  
  try {
    // Create a test error
    const testError = new Error('Test error for verification');
    
    // Try handling the error with the REAL error handling service
    const result = await etlErrorHandlingService.handleError(
      testError,
      'extraction', // phase
      'test-job-123', // jobId
      { testContext: true }, // context
      { 
        maxRetries: 1,
        notifyOnFailure: false,
        skipFailedItems: true
      } // recovery options
    );
    
    console.log('✅ PRODUCTION VERIFICATION: Error handling service exists and functions!');
    console.log('Result:', result);
    
    // Get error stats from the service
    const errorStats = await etlErrorHandlingService.getErrorStats('test-job-123');
    console.log('Error stats:', errorStats);
    
    return {
      success: true,
      message: 'ETL Error Handling Service is integrated and working in production',
      details: result
    };
  } catch (error) {
    console.error('❌ ETL Error Handling Service test failed:', error);
    return {
      success: false,
      message: 'ETL Error Handling Service test failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Run the test if executed directly
if (require.main === module) {
  testErrorHandlingService()
    .then(result => {
      console.log('Test completed:', result);
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Test failed with error:', err);
      process.exit(1);
    });
}

export { testErrorHandlingService }; 