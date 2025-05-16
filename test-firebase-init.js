/**
 * Simple test for Firebase initialization
 * Tests the initialization function to identify issues
 */

// Load environment variables
require('dotenv').config({
  path: '.env.local'
});

const { initializeTestFirebase, initializeTestFirebaseWithMockConfig } = require('./src/lib/utils/firebase-init');

async function testFirebaseInit() {
  console.log('Testing Firebase Initialization');
  console.log('============================');
  console.log('');
  
  // First, try with real config
  console.log('1. Testing with real Firebase config:');
  const realResult = initializeTestFirebase({ debug: true });
  
  console.log(`Result: ${realResult.success ? '✅ Success' : '❌ Failed'}`);
  if (!realResult.success) {
    console.log('Error:', realResult.error);
    console.log('Missing fields:', realResult.missingFields || 'none');
  } else {
    console.log('Message:', realResult.message);
  }
  
  console.log('');
  console.log('2. Testing with mock Firebase config:');
  const mockResult = initializeTestFirebaseWithMockConfig();
  
  console.log(`Result: ${mockResult.success ? '✅ Success' : '❌ Failed'}`);
  if (!mockResult.success) {
    console.log('Error:', mockResult.error);
  } else {
    console.log('Message:', mockResult.message);
  }
}

// Run the test
testFirebaseInit().catch(error => {
  console.error('Fatal error during test:', error);
}); 