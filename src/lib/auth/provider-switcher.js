/**
 * Authentication Provider Switcher
 * 
 * This module provides utilities to check which authentication provider (Firebase or Supabase)
 * is currently in use, allowing conditional logic in UI and authentication operations.
 */

// Import the environment variable utility
const { getEnvVariable } = require('../utils/env');

/**
 * Check if Supabase authentication is currently enabled
 * @returns {boolean} True if Supabase is the current auth provider, false if Firebase
 */
function useSupabaseAuth() {
  try {
    // Get the NEXT_PUBLIC_USE_SUPABASE environment variable
    const useSupabase = getEnvVariable('NEXT_PUBLIC_USE_SUPABASE', 'false');
    
    // Return true if it's explicitly set to 'true'
    return useSupabase === 'true';
  } catch (error) {
    // Default to Firebase if there's an error reading the environment variable
    console.warn('Error checking auth provider:', error);
    return false;
  }
}

/**
 * Get the name of the current authentication provider
 * @returns {string} Either 'supabase' or 'firebase'
 */
function getAuthProviderName() {
  return useSupabaseAuth() ? 'supabase' : 'firebase';
}

/**
 * Get authentication provider detail (for UI display)
 * @returns {Object} Provider info
 */
function getAuthProviderInfo() {
  const isSupabase = useSupabaseAuth();
  
  return {
    name: isSupabase ? 'Supabase' : 'Firebase',
    shortName: isSupabase ? 'SB' : 'FB',
    color: isSupabase ? '#3ECF8E' : '#FFCA28',
    isSupabase,
    isFirebase: !isSupabase
  };
}

module.exports = {
  useSupabaseAuth,
  getAuthProviderName,
  getAuthProviderInfo
}; 