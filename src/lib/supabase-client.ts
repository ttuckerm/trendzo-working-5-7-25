// src/lib/supabase-client.ts - With improved error handling
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Hardcoded values for fallbacks - safe to include in client code for development
// Make sure these are valid and current values
const FALLBACK_URL = 'https://vyeiyccrageckeehyhj.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlY2tlZWh5aGoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNjI0NzUyMCwiZXhwIjoyMDMxODIzNTIwfQ.YNgDgRya_1fvWOmO6j59aSuPLt6QVe0AAoVZkJ0iJx0';

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY;

// Enhanced logging for debugging
console.log('Supabase initialization details:', {
  url: supabaseUrl,
  key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'Not set',
  env: process.env.NODE_ENV
});

// Create Supabase client with additional options for better error handling
export const supabaseClient = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: (...args) => {
        // Log fetch attempts in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Supabase fetch request:', args[0]);
        }
        return fetch(...args);
      }
    }
  }
);

// Test method to check connection with improved error handling
export async function testConnection() {
  try {
    console.log('Testing Supabase connection to:', supabaseUrl);
    
    // First try a simple health check
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Supabase API response not OK: ${response.status} ${response.statusText}`);
    }
    
    // Now try an actual data query
    const { data, error } = await supabaseClient
      .from('feature_flags')
      .select('count')
      .limit(1);
      
    if (error) throw error;
    
    console.log('Supabase connection successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return { 
      success: false, 
      error,
      details: {
        url: supabaseUrl,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

// Singleton instance
const supabase = {
  client: supabaseClient,
  testConnection
};

export default supabase;