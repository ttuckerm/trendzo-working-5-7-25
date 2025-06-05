// Re-export the supabase client from the main file
import { supabaseClient } from '../supabase-client';

export { supabaseClient as default, supabaseClient };

// Export a createClient function that returns the existing client
export function createClient() {
  return supabaseClient;
} 