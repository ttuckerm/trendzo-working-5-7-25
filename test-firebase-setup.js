/**
 * Test script for Firebase initialization in test environments
 * 
 * Usage:
 * node test-firebase-setup.js
 */

// Load environment variables
require('dotenv').config({
  path: '.env.local'
});

// Import the test Firebase initialization function
const { 
  initializeTestFirebase,
  initializeTestFirebaseWithMockConfig
} = require('./src/lib/utils/firebase-init');

async function testFirebaseSetup() {
  console.log('Testing Firebase initialization for test environments');
  console.log('===================================================');
  console.log('');
  
  try {
    // Test Step 1: Try with debugging enabled to see what's happening
    console.log('Test 1: Attempting to initialize Firebase with debugging...');
    const debugResult = initializeTestFirebase({ debug: true });
    
    console.log('');
    console.log(`Debug initialization result: ${debugResult.success ? '✅ Success' : '❌ Failed'}`);
    if (!debugResult.success) {
      console.error(`- Error: ${debugResult.error}`);
    }
    console.log('');
    
    // Test Step 2: Try with mock configuration
    console.log('Test 2: Attempting to initialize Firebase with mock configuration...');
    const mockResult = initializeTestFirebaseWithMockConfig();
    
    console.log('');
    if (mockResult.success) {
      console.log('✅ Firebase mock initialization successful');
      console.log(`- App name: ${mockResult.app?.name || 'default'}`);
      console.log(`- Message: ${mockResult.message}`);
    } else {
      console.error('❌ Firebase mock initialization failed:');
      console.error(`- Error: ${mockResult.error}`);
    }
    
    // Test Step 3: Try with mock configuration again to test reuse behavior
    console.log('');
    console.log('Test 3: Attempting to initialize Firebase again (should reuse existing app)...');
    const secondMockResult = initializeTestFirebaseWithMockConfig();
    
    console.log('');
    if (secondMockResult.success) {
      console.log('✅ Second Firebase initialization successful');
      console.log(`- App name: ${secondMockResult.app?.name || 'default'}`);
      console.log(`- Message: ${secondMockResult.message}`);
    } else {
      console.error('❌ Second Firebase initialization failed:');
      console.error(`- Error: ${secondMockResult.error}`);
    }
    
    console.log('');
    console.log('Test Summary:');
    console.log('--------------');
    console.log(`Using Real Config: ${debugResult.success ? '✅ Passed' : '❌ Failed (expected if no Firebase credentials)'}`);
    console.log(`Using Mock Config: ${mockResult.success ? '✅ Passed' : '❌ Failed'}`);
    console.log(`Firebase App Reuse: ${secondMockResult.success ? '✅ Passed' : '❌ Failed'}`);
    console.log('');
    
    // For overall test success, we care about the mock results only
    // since not everyone will have real Firebase credentials
    process.exit(mockResult.success && secondMockResult.success ? 0 : 1);
  } catch (error) {
    console.error('');
    console.error('❌ Unexpected error during Firebase setup test:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testFirebaseSetup().catch(error => {
  console.error('Fatal error during test:', error);
  process.exit(1);
}); 