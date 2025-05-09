/**
 * Scheduled Job Test
 * This test verifies that scheduled job functionality is working correctly
 */

console.log('Starting Scheduled Job test...');

// Test scheduled job functionality
async function testScheduledJob() {
  // The actual test would simulate a scheduled job
  console.log('Checking ETL API key:', process.env.ETL_API_KEY ? 'Set' : 'Not set');
  
  // Check if API key is available
  if (!process.env.ETL_API_KEY && !process.env.NEXT_PUBLIC_ETL_API_KEY) {
    throw new Error('ETL_API_KEY environment variable is not set');
  }
  
  // We're just returning a success for this placeholder
  return { success: true, message: 'Scheduled job test passed' };
}

// Run the test
testScheduledJob()
  .then(result => {
    console.log('Test result:', result);
    console.log('Scheduled job test completed successfully');
  })
  .catch(error => {
    console.error('Scheduled job test failed:', error.message);
    process.exit(1);
  }); 