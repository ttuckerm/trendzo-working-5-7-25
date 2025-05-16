/**
 * Test script for Firebase to Supabase migration
 * 
 * Usage:
 * node test-migration.js
 */

// Load environment variables
require('dotenv').config({
  path: '.env.local'
});

const { runMigration, migrateUser } = require('./src/lib/utils/migration');
const { initializeTestFirebase, initializeTestFirebaseWithMockConfig } = require('./src/lib/utils/firebase-init');

async function testMigration() {
  console.log('Testing Firebase to Supabase Migration');
  console.log('=====================================');
  console.log('');
  
  try {
    // First, initialize Firebase for testing
    console.log('Initializing Firebase...');
    let firebaseSetup = initializeTestFirebase({ debug: true });
    
    // If real config fails, use mock config
    if (!firebaseSetup.success) {
      console.log('Real Firebase config not found, using mock configuration...');
      firebaseSetup = initializeTestFirebaseWithMockConfig();
      
      if (!firebaseSetup.success) {
        console.error('❌ Failed to initialize Firebase:', firebaseSetup.error);
        return;
      }
    }
    
    console.log('✅ Firebase initialized successfully');
    console.log('');
    
    console.log('1. Testing with a sample user...');
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const testUser = {
      uid: `test-firebase-uid-${timestamp}-${randomString}`,
      email: `test-${timestamp}-${randomString}@example.com`,
      emailVerified: true,
      displayName: 'Test Migration User',
      photoURL: 'https://example.com/photo.jpg'
    };
    
    const singleResult = await migrateUser(testUser);
    console.log('Single user migration result:', singleResult);
    
    if (singleResult.success) {
      console.log('✅ Single user migration successful');
    } else {
      console.error('❌ Single user migration failed:', singleResult.error);
    }
    
    console.log('');
    console.log('2. Testing full migration process...');
    const result = await runMigration();
    
    console.log('Full migration result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Full migration process successful');
      
      if (result.userResults && result.userResults.length) {
        console.log(`Migrated ${result.userResults.length} users`);
      }
      
      console.log('Next steps:');
      if (result.cleanupResult && result.cleanupResult.nextSteps) {
        result.cleanupResult.nextSteps.forEach((step, i) => {
          console.log(`${i + 1}. ${step}`);
        });
      }
    } else {
      console.error('❌ Migration process failed:', result.error);
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testMigration().catch(error => {
  console.error('Fatal error during test:', error);
  process.exit(1);
}); 