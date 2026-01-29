// Create this file: scripts/verify-env.js
const fs = require('fs');
const path = require('path');

// Read .env.local if it exists
const envLocalPath = path.join(process.cwd(), '.env.local');
const envLocalExists = fs.existsSync(envLocalPath);

console.log(`\n=== ENVIRONMENT VARIABLE VERIFICATION ===`);
console.log(`.env.local exists: ${envLocalExists}`);

if (envLocalExists) {
  const envContents = fs.readFileSync(envLocalPath, 'utf8');
  const lines = envContents.split('\n').filter(line => line.trim() !== '');
  
  console.log(`\nFound ${lines.length} variables in .env.local:`);
  
  // Check for Supabase variables
  const supabaseUrlLine = lines.find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_URL='));
  const supabaseKeyLine = lines.find(line => line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY='));
  
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrlLine ? 'Present' : 'MISSING'}`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKeyLine ? 'Present' : 'MISSING'}`);
  
  // Look for common formatting issues
  if (supabaseUrlLine) {
    const value = supabaseUrlLine.split('=')[1];
    if (value.startsWith('"') || value.startsWith("'")) {
      console.log('WARNING: NEXT_PUBLIC_SUPABASE_URL has quotes - remove them');
    }
  }
  
  if (supabaseKeyLine) {
    const value = supabaseKeyLine.split('=')[1];
    if (value.startsWith('"') || value.startsWith("'")) {
      console.log('WARNING: NEXT_PUBLIC_SUPABASE_ANON_KEY has quotes - remove them');
    }
  }
}

// Check Next.js config for environment handling
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
const nextConfigExists = fs.existsSync(nextConfigPath);

console.log(`\nnext.config.js exists: ${nextConfigExists}`);
if (nextConfigExists) {
  const configContents = fs.readFileSync(nextConfigPath, 'utf8');
  console.log(`next.config.js ${configContents.includes('env:') ? 'contains' : 'does NOT contain'} env configuration`);
}

console.log(`\nRun this in your terminal: node scripts/verify-env.js`);