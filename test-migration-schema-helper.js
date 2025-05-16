/**
 * Test script for migration schema helper
 * 
 * Usage:
 * node test-migration-schema-helper.js
 */

// Add console.log at the start of the file
console.log('Starting test script...');

// Load environment variables
require('dotenv').config({
  path: '.env.local'
});

console.log('Environment variables loaded');

// Mock Supabase client similar to our other test
const mockSupabaseClient = {
  from: (table) => ({
    select: () => ({
      columns: async () => {
        console.log(`Mock: Getting columns for ${table}`);
        if (table === 'test_profiles') {
          return { data: [
            { name: 'id', type: 'uuid' },
            { name: 'email', type: 'text' },
            { name: 'firebase_uid', type: 'text' }
            // missing display_name
          ]};
        } else if (table === 'test_items') {
          return { data: [
            { name: 'id', type: 'uuid' },
            { name: 'title', type: 'text' },
            { name: 'created_at', type: 'timestamp' },
            { name: 'updated_at', type: 'timestamp' },
            { name: 'firebase_id', type: 'text' }
          ]};
        }
        return { data: [], error: null };
      }
    }),
    alter: () => ({
      add: async (column, type) => {
        console.log(`Mock: Added column ${column} with type ${type} to ${table}`);
        return { data: null, error: null };
      }
    })
  })
};

console.log('Mock Supabase client created');

// Import the helper function
try {
  console.log('Attempting to import module...');
  var { validateAndCorrectSchemas } = require('./src/lib/utils/migration-schema-helper');
  console.log('Module imported successfully');
} catch (error) {
  console.error('Error importing module:', error);
  process.exit(1);
}

// Test data similar to what we use in the migration test
const TEST_MAPPINGS = [
  {
    firebaseCollection: 'test_users',
    supabaseTable: 'test_profiles',
    transform: (data, id) => ({
      id: id,
      email: data.email || 'test@example.com',
      display_name: data.displayName || 'Test User',
      firebase_uid: id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  },
  {
    firebaseCollection: 'test_items',
    supabaseTable: 'test_items',
    transform: (data, id) => ({
      id: id || 'test-id',
      title: data.title || 'Test Item',
      firebase_id: id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
];

console.log('Test mappings defined');

async function runTest() {
  console.log('\nTesting Migration Schema Helper');
  console.log('===============================');
  
  try {
    console.log('\nRunning validateAndCorrectSchemas...');
    
    // Run the helper function
    const results = await validateAndCorrectSchemas(mockSupabaseClient, TEST_MAPPINGS);
    
    console.log('\nTest completed with results:', 
      results ? 'Results object received' : 'No results received');
    
    if (results && results.tables) {
      console.log('Tables processed:', Object.keys(results.tables).join(', '));
      
      if (results.tables['test_profiles']) {
        const profileResult = results.tables['test_profiles'];
        console.log('\ntest_profiles validation:', 
          profileResult.validated ? 'Valid' : 'Invalid');
        console.log('test_profiles correction:', 
          profileResult.corrected ? 'Corrected' : 'Not corrected');
      }
      
      if (results.tables['test_items']) {
        const itemsResult = results.tables['test_items'];
        console.log('\ntest_items validation:', 
          itemsResult.validated ? 'Valid' : 'Invalid');
      }
    } else {
      console.log('No tables data in results');
    }
  } catch (error) {
    console.error('\n❌ Test execution error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
console.log('Starting test execution...');
runTest().catch(error => {
  console.error('Fatal error during test:', error);
}); 