/**
 * ETL Error Handling Test Runner
 * 
 * This script runs the comprehensive error handling tests for the ETL process
 */

import { runEtlErrorHandlingTests } from './etl-error-handling-test';

console.log('Starting ETL Error Handling Test Runner...');

// Run the tests and capture results
runEtlErrorHandlingTests()
  .then(results => {
    console.log('\n=== FINAL RESULTS ===');
    console.log(`Test run completed at: ${new Date().toISOString()}`);
    console.log(`Overall status: ${results.success ? 'PASSED' : 'FAILED'}`);
    
    // Print summary of each test
    const testSummary = Object.entries(results.tests).map(([name, details]) => {
      return {
        name,
        status: (details as any).status,
        message: (details as any).error || ''
      };
    });
    
    console.table(testSummary);
    
    // Exit with appropriate code
    process.exit(results.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed with error:', error);
    process.exit(1);
  }); 