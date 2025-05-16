/**
 * Load environment variables for testing
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load env files in order of precedence
const loadEnv = () => {
  const envFiles = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.development.local',
  ];

  for (const file of envFiles) {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      console.log(`Loading environment from ${file}`);
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      for (const k in envConfig) {
        process.env[k] = envConfig[k];
      }
    } else {
      console.log(`File not found: ${file}`);
    }
  }
};

loadEnv();

// Now check the environment variables
console.log('Environment Variables Test');
console.log('=========================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
console.log('NEXT_PUBLIC_FORCE_EDITOR:', process.env.NEXT_PUBLIC_FORCE_EDITOR);

// Find all NEXT_PUBLIC_ variables
const publicVars = Object.keys(process.env)
  .filter(key => key.startsWith('NEXT_PUBLIC_'))
  .reduce((obj, key) => {
    obj[key] = process.env[key];
    return obj;
  }, {});

console.log('\nAll public vars:', publicVars); 