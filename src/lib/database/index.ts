import { createSupabaseClient } from './supabase';
import { createFirebaseClient } from './firebase';
import { DatabaseClient } from './types';

// This abstraction layer allows gradual migration from Firebase to Supabase
export const db: DatabaseClient = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true' 
  ? createSupabaseClient() 
  : createFirebaseClient();

// Export types for use throughout the app
export * from './types';