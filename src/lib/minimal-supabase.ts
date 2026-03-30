// src/lib/minimal-supabase.ts - A minimal Supabase client implementation
import { createClient } from '@supabase/supabase-js';

// Get the Supabase URL and key from the environment
// with fallback values (safe to include in client-side code for testing)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vyeiyccrageckeehyhj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlY2tlZWh5aGoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNjI0NzUyMCwiZXhwIjoyMDMxODIzNTIwfQ.YNgDgRya_1fvWOmO6j59aSuPLt6QVe0AAoVZkJ0iJx0';

// Client-side logging for debugging
console.log('Minimal Supabase client initialization:');
console.log('- URL:', supabaseUrl);
console.log('- Key set:', !!supabaseAnonKey);

// Custom fetch implementation with detailed logging
const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const startTime = performance.now();
  console.log(`🔄 Fetch request to: ${url instanceof URL ? url.toString() : url}`);
  
  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    console.log(`✅ Response received in ${Math.round(endTime - startTime)}ms, status: ${response.status}`);
    return response;
  } catch (error) {
    console.error('❌ Fetch error:', error);
    throw error;
  }
};

// Create a Supabase client with minimal settings and debug-focused options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false, // For testing simplicity
    persistSession: false,   // Don't persist the session for testing
    detectSessionInUrl: false // Disable default auth redirect handling
  },
  global: {
    fetch: customFetch
  }
});

// Test function for direct verification
export const testMinimalConnection = async () => {
  try {
    // Try a simple query to test connection
    const { data, error } = await supabase
      .from('feature_flags')
      .select('count')
      .limit(1);
      
    if (error) throw error;
    
    return { 
      success: true, 
      message: 'Connection successful!',
      data 
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: `Connection failed: ${error.message}`,
      error
    };
  }
};

export default { 
  client: supabase,
  testConnection: testMinimalConnection,
  details: {
    url: supabaseUrl,
    keyPresent: !!supabaseAnonKey
  }
}; 