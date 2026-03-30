/**
 * Test Supabase Connection
 * 
 * This script tests connectivity to Supabase using both axios and the Supabase client.
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase Connection Test');
console.log('=======================');
console.log(`URL: ${supabaseUrl}`);
console.log(`API Key: ${supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'Not found'}`);
console.log();

// Test using axios
async function testWithAxios() {
  console.log('Testing connection with axios...');
  try {
    // Simple health check endpoint
    const response = await axios.get(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey
      }
    });
    
    console.log('✅ Axios connection successful');
    console.log(`Status: ${response.status}`);
    return true;
  } catch (error) {
    console.error('❌ Axios connection failed');
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('No response received. Network issue?');
    }
    return false;
  }
}

// Test using Supabase client
async function testWithSupabaseClient() {
  console.log('Testing connection with Supabase client...');
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test a simple query
    const { data, error } = await supabase.from('_test_connection').select('*').limit(1).maybeSingle();
    
    if (error) {
      // This error is expected if the table doesn't exist
      if (error.message.includes('does not exist')) {
        console.log('✅ Supabase client connection successful (table not found error is expected)');
        return true;
      } else {
        console.error('❌ Supabase client query failed');
        console.error(`Error: ${error.message}`);
        return false;
      }
    } else {
      console.log('✅ Supabase client connection successful');
      console.log(`Result: ${JSON.stringify(data)}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Supabase client connection failed');
    console.error(`Error: ${error.message}`);
    return false;
  }
}

// DNS lookup test
async function testDnsLookup() {
  console.log('Testing DNS resolution...');
  
  const dns = require('dns');
  const { promisify } = require('util');
  const lookup = promisify(dns.lookup);
  
  try {
    // Extract hostname from URL
    const url = new URL(supabaseUrl);
    const hostname = url.hostname;
    
    console.log(`Hostname: ${hostname}`);
    
    const result = await lookup(hostname);
    console.log('✅ DNS resolution successful');
    console.log(`IP Address: ${result.address}`);
    return true;
  } catch (error) {
    console.error('❌ DNS resolution failed');
    console.error(`Error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('Running connection tests...\n');
  
  // First test DNS
  await testDnsLookup();
  console.log();
  
  // Then test with axios
  await testWithAxios();
  console.log();
  
  // Finally test with Supabase client
  await testWithSupabaseClient();
  console.log();
  
  console.log('All tests completed');
}

runTests().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
}); 