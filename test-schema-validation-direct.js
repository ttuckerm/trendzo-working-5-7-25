/**
 * Direct test for schema validation functionality
 * 
 * This test demonstrates schema validation in a simple, direct way without mocks
 * Run with: node test-schema-validation-direct.js
 */

const { validateSchema, correctSchema } = require('./src/lib/utils/schema-validation');

// Create a simple mock Supabase client with in-memory tables for testing
function createMockSupabase() {
  // In-memory storage for our "tables"
  const tables = {
    users: [
      { name: 'id', type: 'uuid' },
      { name: 'email', type: 'text' }
      // Deliberately missing 'created_at'
    ],
    posts: [
      { name: 'id', type: 'uuid' },
      { name: 'title', type: 'text' },
      { name: 'content', type: 'text' },
      { name: 'created_at', type: 'timestamp' }
    ],
    empty_table: []
  };

  // Track what columns were added to which tables
  const addedColumns = [];

  return {
    // The mock client
    client: {
      from: (table) => ({
        select: () => ({
          columns: async () => {
            if (tables[table]) {
              return { data: tables[table], error: null };
            }
            return { data: null, error: 'Table not found' };
          }
        }),
        alter: () => ({
          add: async (column, type) => {
            if (!tables[table]) {
              return { error: 'Table not found' };
            }
            
            // Add the column to our in-memory table
            tables[table].push({ name: column, type });
            addedColumns.push({ table, column, type });
            
            return { data: null, error: null };
          }
        })
      })
    },
    
    // Helper to inspect the state
    getTables: () => ({ ...tables }),
    getAddedColumns: () => [ ...addedColumns ]
  };
}

async function runTest() {
  console.log('Direct Schema Validation Test');
  console.log('============================\n');

  const { client, getTables, getAddedColumns } = createMockSupabase();
  
  console.log('1. Testing schema validation:');
  
  // Test with the users table (missing a column)
  const usersExpectedSchema = [
    { name: 'id', type: 'uuid' },
    { name: 'email', type: 'text' },
    { name: 'created_at', type: 'timestamp' }
  ];
  
  const usersResult = await validateSchema(client, 'users', usersExpectedSchema);
  console.log('- Users table validation:', usersResult.success ? 'Valid' : 'Invalid');
  console.log('- Missing columns:', usersResult.missingColumns.map(c => c.name).join(', ') || 'None');
  
  // Test with the posts table (should be valid)
  const postsExpectedSchema = [
    { name: 'id', type: 'uuid' },
    { name: 'title', type: 'text' },
    { name: 'content', type: 'text' },
    { name: 'created_at', type: 'timestamp' }
  ];
  
  const postsResult = await validateSchema(client, 'posts', postsExpectedSchema);
  console.log('- Posts table validation:', postsResult.success ? 'Valid' : 'Invalid');
  
  // Test with empty table (should be invalid)
  const emptyResult = await validateSchema(client, 'empty_table', [
    { name: 'id', type: 'uuid' }
  ]);
  console.log('- Empty table validation:', emptyResult.success ? 'Valid' : 'Invalid');
  
  console.log('\n2. Testing schema correction:');
  
  // Correct the users table
  const usersCorrectionResult = await correctSchema(client, 'users', usersResult.missingColumns);
  console.log('- Users table correction:', usersCorrectionResult.success ? 'Success' : 'Failed');
  
  // Correct the empty table
  const emptyCorrectionResult = await correctSchema(client, 'empty_table', emptyResult.missingColumns);
  console.log('- Empty table correction:', emptyCorrectionResult.success ? 'Success' : 'Failed');
  
  console.log('\n3. Verification:');
  
  // Validate users table after correction
  const usersVerifyResult = await validateSchema(client, 'users', usersExpectedSchema);
  console.log('- Users table now valid:', usersVerifyResult.success ? 'Yes' : 'No');
  
  // Validate empty table after correction
  const emptyVerifyResult = await validateSchema(client, 'empty_table', [
    { name: 'id', type: 'uuid' }
  ]);
  console.log('- Empty table now valid:', emptyVerifyResult.success ? 'Yes' : 'No');
  
  console.log('\n4. Added columns:');
  const added = getAddedColumns();
  added.forEach(col => {
    console.log(`- Added ${col.column} (${col.type}) to ${col.table}`);
  });
  
  // Final check
  const valid = usersVerifyResult.success && emptyVerifyResult.success;
  console.log('\nTest result:', valid ? '✅ SUCCESS' : '❌ FAILED');
}

// Run the test
runTest().catch(error => {
  console.error('Test error:', error);
}); 