/**
 * Test environment variable loading
 */

console.log('Environment variables test');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);

// Find all NEXT_PUBLIC_ variables
const publicVars = Object.keys(process.env)
  .filter(key => key.startsWith('NEXT_PUBLIC_'))
  .reduce((obj, key) => {
    obj[key] = process.env[key];
    return obj;
  }, {});

console.log('All public vars:', publicVars); 