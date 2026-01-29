/**
 * Test Environment Setup
 * 
 * This script checks for the necessary environment variables for testing
 * and creates a .env.local file if it doesn't exist.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Path to .env.local file
const envFilePath = path.join(process.cwd(), '.env.local');

// Check if .env.local exists and load it
let existingEnv = {};
if (fs.existsSync(envFilePath)) {
  console.log('.env.local file exists, loading existing variables...');
  existingEnv = dotenv.parse(fs.readFileSync(envFilePath));
} else {
  console.log('.env.local file does not exist, will create a new one...');
}

// Define required environment variables with default fallbacks
const requiredVars = {
  NEXT_PUBLIC_SUPABASE_URL: existingEnv.NEXT_PUBLIC_SUPABASE_URL || 'https://vyeiyccrageckeehyhj.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: existingEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlY2tlZWh5aGoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNjI0NzUyMCwiZXhwIjoyMDMxODIzNTIwfQ.YNgDgRya_1fvWOmO6j59aSuPLt6QVe0AAoVZkJ0iJx0',
  SUPABASE_SERVICE_KEY: existingEnv.SUPABASE_SERVICE_KEY || 'your-service-key-here',
  APIFY_API_TOKEN: existingEnv.APIFY_API_TOKEN || 'your-apify-api-token-here',
  NEXT_PUBLIC_USE_SUPABASE: existingEnv.NEXT_PUBLIC_USE_SUPABASE || 'true',
  TZ: existingEnv.TZ || 'UTC',
};

// Write environment variables to .env.local file
const envContent = Object.entries(requiredVars)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync(envFilePath, envContent);

console.log('.env.local file has been created or updated with required variables.');
console.log('Make sure to replace any placeholder values with your actual credentials.');

// List the environment variables that require manual updates
const varsNeedingUpdate = [];
if (requiredVars.SUPABASE_SERVICE_KEY === 'your-service-key-here') {
  varsNeedingUpdate.push('SUPABASE_SERVICE_KEY');
}
if (requiredVars.APIFY_API_TOKEN === 'your-apify-api-token-here') {
  varsNeedingUpdate.push('APIFY_API_TOKEN');
}

if (varsNeedingUpdate.length > 0) {
  console.log('\nWARNING: The following variables have placeholder values and need to be updated:');
  varsNeedingUpdate.forEach(varName => {
    console.log(`  - ${varName}`);
  });
  console.log('\nUpdate these values in .env.local before running tests.');
} else {
  console.log('\nAll environment variables have non-placeholder values.');
}

// Display the current environment setup
console.log('\nCurrent environment setup:');
console.log(`  - NEXT_PUBLIC_SUPABASE_URL: ${requiredVars.NEXT_PUBLIC_SUPABASE_URL.substring(0, 25)}...`);
console.log(`  - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${requiredVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 15)}...`);
console.log(`  - SUPABASE_SERVICE_KEY: ${requiredVars.SUPABASE_SERVICE_KEY === 'your-service-key-here' ? 'Not set (placeholder)' : 'Set (hidden)'}`);
console.log(`  - APIFY_API_TOKEN: ${requiredVars.APIFY_API_TOKEN === 'your-apify-api-token-here' ? 'Not set (placeholder)' : 'Set (hidden)'}`);
console.log(`  - NEXT_PUBLIC_USE_SUPABASE: ${requiredVars.NEXT_PUBLIC_USE_SUPABASE}`);
console.log(`  - TZ: ${requiredVars.TZ}`);

console.log('\nEnvironment setup complete! ✅'); 