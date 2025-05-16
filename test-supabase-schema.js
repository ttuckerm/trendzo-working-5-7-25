/**
 * Test script for checking Supabase schema issues
 */

// Load environment variables
require('dotenv').config({
  path: '.env.local'
});

const { createClient } = require('@supabase/supabase-js');
const { getEnvVariable } = require('./src/lib/utils/env');

/**
 * Simple test to check if the users table has an email column
 */
async function testSupabaseSchema() {
  console.log('Testing Supabase Schema');
  console.log('======================');
  console.log('');
  
  try {
    // Get Supabase credentials
    const supabaseUrl = getEnvVariable('NEXT_PUBLIC_SUPABASE_URL', '');
    const supabaseKey = getEnvVariable('SUPABASE_SERVICE_ROLE_KEY', '');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials in .env.local');
      console.log('Required environment variables:');
      console.log('- NEXT_PUBLIC_SUPABASE_URL');
      console.log('- SUPABASE_SERVICE_ROLE_KEY');
      return;
    }
    
    // Initialize Supabase client
    console.log('Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Check the auth.users table
    console.log('Checking auth.users table schema...');
    
    // Try to get information about the auth setup
    try {
      // Get user info using the auth API instead of direct table query
      const { data: users, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });
      
      if (error) {
        console.log('❌ Error accessing Supabase auth:', error.message);
      } else if (users && users.length > 0) {
        console.log('✅ Supabase auth is accessible');
        console.log('Sample user properties:', Object.keys(users[0] || {}).join(', '));
      } else {
        console.log('✅ Supabase auth is accessible but no users found');
      }
    } catch (authError) {
      console.log('❌ Error accessing Supabase auth API:', authError.message);
      console.log('This suggests the auth.admin.* methods may not be available with your current API key');
    }
    
    // Check if we can use the correct auth approach from our migration code
    console.log('');
    console.log('Testing auth.admin.getUserByEmail method (used in our fix)...');
    try {
      const { data, error } = await supabase.auth.admin.getUserByEmail('test@example.com');
      if (error) {
        if (error.message.includes('User not found')) {
          console.log('✅ auth.admin.getUserByEmail is working (returned "User not found" as expected)');
        } else {
          console.log('❌ Error with auth.admin.getUserByEmail:', error.message);
        }
      } else {
        console.log('✅ auth.admin.getUserByEmail is working');
      }
    } catch (authError) {
      console.log('❌ Error with auth.admin.getUserByEmail method:', authError.message);
    }
    
    // Try to get tables list instead of column information
    console.log('');
    console.log('Getting available tables from Supabase:');
    try {
      const { data, error } = await supabase.rpc('get_tables');
      
      if (error) {
        console.log('❌ Error fetching tables:', error.message);
      } else if (data && data.length > 0) {
        console.log('✅ Available tables:');
        data.forEach(table => {
          console.log(`- ${table}`);
        });
      } else {
        console.log('❌ No tables found or method not available');
      }
    } catch (tableError) {
      console.log('❌ Error fetching tables via RPC:', tableError.message);
      console.log('This is not critical for our migration since we use the auth API directly');
    }
    
    // Also check profiles table since that's often used in Supabase auth setups
    console.log('');
    console.log('Checking profiles table schema...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select()
      .columns();
    
    if (profilesError) {
      console.log('❌ Error checking profiles table:', profilesError.message);
    } else if (profiles && profiles.length > 0) {
      console.log('✅ profiles table exists with columns:');
      profiles.forEach(col => {
        console.log(`- ${col.name} (${col.type})`);
      });
    } else {
      console.log('❌ profiles table does not exist or has no columns');
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testSupabaseSchema().catch(error => {
  console.error('Fatal error during test:', error);
}); 