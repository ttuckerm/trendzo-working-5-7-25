import { createSupabaseClient } from './supabase';
import { createFirebaseClient } from './firebase';
import { DatabaseClient } from './types';

// This abstraction layer allows gradual migration from Firebase to Supabase
export const db: DatabaseClient = true  
  ? createSupabaseClient() 
  : createFirebaseClient();

// Export types for use throughout the app
export * from './types';