/**
 * Debug utility to understand how Next.js loads environment variables
 */

export function debugServerEnv() {
  console.log('SERVER ENV DEBUG - START');
  
  if (typeof window !== 'undefined') {
    console.log('WARNING: This function should only be called from server components');
    return {};
  }
  
  // Check for crucial Next.js environment vars
  const nextVars = ['NODE_ENV', 'NEXT_PUBLIC_BASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'];
  nextVars.forEach(key => {
    console.log(`${key}: ${process.env[key] ? 'Available' : 'Not available'}`);
  });
  
  // Print all env vars that start with NEXT_PUBLIC_
  console.log('\nAll public variables:');
  const publicEnvVars = Object.keys(process.env)
    .filter(key => key.startsWith('NEXT_PUBLIC_'))
    .reduce((obj, key) => {
      obj[key] = process.env[key];
      return obj;
    }, {});
  
  console.log(publicEnvVars);
  
  // List detected environment files
  console.log('\nEnvironment files loaded (based on variables):');
  if (process.env.NEXT_PUBLIC_ENV_TEST) {
    console.log('- .env file detected');
  }
  if (process.env.NEXT_PUBLIC_ENV_LOCAL_TEST) {
    console.log('- .env.local file detected');
  }
  if (process.env.NEXT_PUBLIC_ENV_DEVELOPMENT_TEST) {
    console.log('- .env.development file detected');
  }
  
  console.log('SERVER ENV DEBUG - END');
  
  return publicEnvVars;
} 