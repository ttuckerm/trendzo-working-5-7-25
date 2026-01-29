/**
 * Environment variable utilities for Next.js applications.
 * Handles server-side and client-side environment variables with proper validation.
 */

const PUBLIC_PREFIX = 'NEXT_PUBLIC_';

// Known environment variables that we need to access - this will be used as fallback
// if Next.js doesn't properly expose them
const ENV_DEFAULTS = {
  // Base URLs
  NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: 'https://vyeiyccrageeckeehyhj.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  
  // Feature flags
  NEXT_PUBLIC_USE_SUPABASE: 'true',
  NEXT_PUBLIC_FORCE_EDITOR: 'true',
  
  // Environment
  NODE_ENV: 'development',
};

/**
 * Safely access process.env accounting for browser/server contexts
 * @returns {Object} The environment object
 */
function getEnvObject() {
  // In the browser, Next.js only exposes NEXT_PUBLIC_ variables via process.env
  // On the server, all env variables are available
  if (typeof window !== 'undefined') {
    // We're in the browser
    return process.env || {};
  } else {
    // We're on the server
    return process.env || {};
  }
}

/**
 * Debug function to check if environment variables are being loaded properly
 * @param {string} key - The environment variable key
 * @returns {boolean} - Whether the variable exists
 */
function debugEnvVariable(key) {
  console.log(`Checking env var ${key}: `, process.env[key] ? 'Found' : 'Not found');
  return !!process.env[key];
}

/**
 * Gets an environment variable value, with optional default value.
 * Works for both server-side and client-side variables.
 *
 * @param {string} key - Environment variable name
 * @param {string} [defaultValue] - Optional default value
 * @returns {string} The environment variable value or default
 * @throws {Error} If variable is not defined and no default is provided
 */
function getEnvVariable(key, defaultValue) {
  // Try to get from Next.js process.env
  let value = process.env[key];
  
  // If not found, check our hardcoded defaults for development
  if (value === undefined && ENV_DEFAULTS[key]) {
    value = ENV_DEFAULTS[key];
  }
  
  // If still not found, use provided default or throw error
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }
  
  return value;
}

/**
 * Gets a client-side environment variable value (automatically adds NEXT_PUBLIC_ prefix if needed).
 * Use this in both server and client components for client-accessible variables.
 *
 * @param {string} key - Environment variable name (with or without NEXT_PUBLIC_ prefix)
 * @param {string} [defaultValue] - Optional default value
 * @returns {string} The environment variable value or default
 * @throws {Error} If variable is not defined and no default is provided
 */
function getClientEnvVariable(key, defaultValue) {
  // If key already includes prefix, use it directly
  if (key.startsWith(PUBLIC_PREFIX)) {
    return getEnvVariable(key, defaultValue);
  }
  
  // Add prefix and try to get the value
  const prefixedKey = `${PUBLIC_PREFIX}${key}`;
  
  // If we're on the server, check if a private version exists (this indicates a mistake)
  if (typeof window === 'undefined') {
    // Check if the non-prefixed variable exists but isn't publically accessible
    if (process.env[key] && !process.env[prefixedKey]) {
      throw new Error(
        `Environment variable ${key} exists but must be prefixed with NEXT_PUBLIC_ to be accessible on the client`
      );
    }
  }
  
  // Try to get the prefixed variable
  try {
    return getEnvVariable(prefixedKey, defaultValue);
  } catch (error) {
    // If no default value was provided, we want to clarify that this is a client-side variable issue
    if (defaultValue === undefined) {
      throw new Error(`Client environment variable ${key} must be prefixed with NEXT_PUBLIC_ in your environment files`);
    }
    return defaultValue;
  }
}

/**
 * Returns an object containing all client-side environment variables.
 * Strips the NEXT_PUBLIC_ prefix for cleaner usage.
 * 
 * @param {string[]} [allowedPrivateVars=[]] - Optional list of private vars to include
 * @returns {object} Object with all public environment variables
 */
function getPublicEnvConfig(allowedPrivateVars = []) {
  const config = {};
  
  // First add our hardcoded defaults
  Object.keys(ENV_DEFAULTS)
    .filter(key => key.startsWith(PUBLIC_PREFIX))
    .forEach(key => {
      // Remove the prefix for cleaner usage
      const cleanKey = key.replace(PUBLIC_PREFIX, '');
      config[cleanKey] = ENV_DEFAULTS[key];
    });
  
  // Then add any additional environment variables from Next.js
  // which will override our defaults if they exist
  Object.keys(process.env || {})
    .filter(key => key.startsWith(PUBLIC_PREFIX))
    .forEach(key => {
      // Remove the prefix for cleaner usage
      const cleanKey = key.replace(PUBLIC_PREFIX, '');
      config[cleanKey] = process.env[key];
    });
  
  // Add explicitly allowed private variables
  [...allowedPrivateVars, 'NODE_ENV'].forEach(key => {
    if (process.env[key]) {
      config[key] = process.env[key];
    } else if (ENV_DEFAULTS[key]) {
      config[key] = ENV_DEFAULTS[key];
    }
  });
  
  return config;
}

/**
 * Check if we're in a development environment
 * @returns {boolean}
 */
function isDevelopment() {
  return getEnvVariable('NODE_ENV', 'development') === 'development';
}

/**
 * Check if we're in a production environment
 * @returns {boolean}
 */
function isProduction() {
  return getEnvVariable('NODE_ENV', '') === 'production';
}

/**
 * Check if we're in a test environment
 * @returns {boolean}
 */
function isTest() {
  return getEnvVariable('NODE_ENV', '') === 'test';
}

module.exports = {
  getEnvVariable,
  getClientEnvVariable,
  getPublicEnvConfig,
  isDevelopment,
  isProduction,
  isTest,
  debugEnvVariable
}; 