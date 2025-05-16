/**
 * Debug script to check if environment variables are being loaded properly
 */

// Load environment variables using fs to ensure they're loaded correctly
const fs = require('fs');
const path = require('path');

// Parse .env.local file manually
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    // Remove comments and trim whitespace
    const trimmedLine = line.split('#')[0].trim();
    if (!trimmedLine) return;
    
    // Split by first = (to handle values with = in them)
    const equalsIndex = trimmedLine.indexOf('=');
    if (equalsIndex > 0) {
      const key = trimmedLine.substring(0, equalsIndex).trim();
      let value = trimmedLine.substring(equalsIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      
      env[key] = value;
    }
  });
  
  return env;
}

// Get variables from .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
console.log(`Checking .env.local file at: ${envLocalPath}`);
console.log(`File exists: ${fs.existsSync(envLocalPath)}`);

const envLocalVars = parseEnvFile(envLocalPath);

// Log key environment variables
console.log('\nEnvironment Variables from .env.local:');
console.log('===================================');
console.log('NEXT_PUBLIC_SUPABASE_URL:', envLocalVars.NEXT_PUBLIC_SUPABASE_URL || 'Not found');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', envLocalVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', envLocalVars.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing');
console.log('NEXT_PUBLIC_USE_SUPABASE:', envLocalVars.NEXT_PUBLIC_USE_SUPABASE || 'Not found');

// Log process.env variables for comparison
console.log('\nProcess.env Variables:');
console.log('======================');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Not set');

// Log all variables from the parsed file
console.log('\nAll variables from .env.local:');
Object.keys(envLocalVars).forEach(key => {
  const value = key.includes('KEY') ? 'Present' : envLocalVars[key];
  console.log(`- ${key}: ${value}`);
}); 