// import { createSupabaseClient } from './supabase';
// import { createFirebaseClient } from './firebase'; // Remove this import
// import { DatabaseClient } from './types';

// // This abstraction layer allows gradual migration from Firebase to Supabase
// export const db: DatabaseClient = true  
//   ? createSupabaseClient() 
//   : createFirebaseClient();

// // Export types for use throughout the app
// export * from './types';

import { createSupabaseClient } from './supabase';
// REMOVED: import { createFirebaseClient } from './firebase';
import { DatabaseClient } from './types';

// This abstraction layer now directly uses Supabase
export const db: DatabaseClient = createSupabaseClient();

// Export types for use throughout the app
export * from './types';