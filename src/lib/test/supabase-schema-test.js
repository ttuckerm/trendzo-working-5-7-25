/**
 * Supabase Schema Test
 * 
 * This test validates that our Supabase database schema correctly implements
 * the requirements outlined in the development plan.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const dns = require('dns');
const { promisify } = require('util');
const lookup = promisify(dns.lookup);

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Simple test runner
 */
async function runTests() {
  console.log('Starting Supabase schema tests...');
  
  // First check connectivity
  if (!await checkConnectivity()) {
    console.error('❌ Cannot proceed with tests due to connectivity issues');
    console.log('\nPlease follow the instructions in README-TIKTOK-TEMPLATES.md to set up a valid Supabase project');
    process.exit(1);
  }
  
  let passedTests = 0;
  let failedTests = 0;
  
  // Test: Check if tiktok_templates table exists
  try {
    const { data, error } = await supabase
      .from('tiktok_templates')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ tiktok_templates table does not exist');
        failedTests++;
      } else {
        throw error;
      }
    } else {
      console.log('✅ tiktok_templates table exists');
      passedTests++;
    }
  } catch (error) {
    console.error(`❌ Error checking tiktok_templates table: ${error.message}`);
    failedTests++;
  }
  
  // Test: Check if template_expert_insights table exists
  try {
    const { data, error } = await supabase
      .from('template_expert_insights')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ template_expert_insights table does not exist');
        failedTests++;
      } else {
        throw error;
      }
    } else {
      console.log('✅ template_expert_insights table exists');
      passedTests++;
    }
  } catch (error) {
    console.error(`❌ Error checking template_expert_insights table: ${error.message}`);
    failedTests++;
  }
  
  // Test: Check if template_audit_logs table exists
  try {
    const { data, error } = await supabase
      .from('template_audit_logs')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ template_audit_logs table does not exist');
        failedTests++;
      } else {
        throw error;
      }
    } else {
      console.log('✅ template_audit_logs table exists');
      passedTests++;
    }
  } catch (error) {
    console.error(`❌ Error checking template_audit_logs table: ${error.message}`);
    failedTests++;
  }
  
  // Report results
  console.log('\nTest summary:');
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  
  if (failedTests > 0) {
    console.log('\nTo fix failed tests, run:');
    console.log('npm run setup-supabase-schema');
    console.log('\nOr manually create the schema using the SQL in scripts/create-tables.sql');
    process.exit(1);
  } else {
    console.log('\nAll tests passed! The database schema is set up correctly.');
  }
}

/**
 * Check connectivity to Supabase
 */
async function checkConnectivity() {
  console.log('Checking connectivity to Supabase...');
  
  // Check URL and key
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables');
    console.error('Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
    return false;
  }
  
  // Check DNS resolution
  try {
    // Extract hostname from URL
    const url = new URL(supabaseUrl);
    const hostname = url.hostname;
    
    console.log(`Hostname: ${hostname}`);
    
    const result = await lookup(hostname);
    console.log('✅ DNS resolution successful');
    console.log(`IP Address: ${result.address}`);
  } catch (error) {
    console.error('❌ DNS resolution failed');
    console.error(`Error: ${error.message}`);
    console.error('This suggests the Supabase hostname is invalid or not accessible');
    return false;
  }
  
  // Test connectivity with Supabase
  try {
    // Try a simple query instead of rpc
    const { data, error } = await supabase
      .from('_nonexistent_table_for_test')
      .select('*')
      .limit(1);
    
    // If we get a "relation does not exist" error, that means we connected successfully
    if (error && error.message.includes('does not exist')) {
      console.log('✅ Supabase connection successful');
      return true;
    }
    
    // If no error or different error, still consider it a success
    // since we got some response from Supabase
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed');
    console.error(`Error: ${error.message}`);
    return false;
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Tests failed with an unexpected error:', error);
  process.exit(1);
}); 