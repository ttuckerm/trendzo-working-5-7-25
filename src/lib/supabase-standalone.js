// Create this file: src/lib/supabase-standalone.js
// This file should be used ONLY for testing the connection

export function createSupabaseClient() {
    // Hard-code values for testing only (remove in production)
    // Replace these with your actual values
    const fallbackUrl = 'https://your-project-id.supabase.co';
    const fallbackKey = 'your-public-anon-key';
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackUrl;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackKey;
    
    console.log('Creating Supabase client with:');
    console.log('URL:', url);
    console.log('Key:', key ? (key.substring(0, 5) + '...') : 'undefined');
    
    // Only import createClient when URL and key are available
    if (url && key) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        return createClient(url, key);
      } catch (error) {
        console.error('Failed to create Supabase client:', error);
        return null;
      }
    }
    
    console.error('Missing Supabase URL or key');
    return null;
  }