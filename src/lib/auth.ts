import { cookies } from 'next/headers';
// import { db } from '@/lib/firebase/firebase'; // Firebase db is null
// import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; // Firebase SDK

const AUTH_LIB_DISABLED_MSG = "src/lib/auth.ts: Firebase backend for session/user lookup is disabled. TODO: Reimplement with Supabase auth.";

// Firestore collection names (no longer used)
// const USERS_COLLECTION = 'users';
// const SESSIONS_COLLECTION = 'sessions';

/**
 * Simple authentication helper to check if user is logged in.
 * Firebase logic has been removed. This will currently always return null
 * or a mock user if uncommented for development.
 */
export async function auth(): Promise<null> {
  console.warn(AUTH_LIB_DISABLED_MSG);
  
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      // console.log('src/lib/auth.ts: No session cookie found.'); // Optional logging
      return null;
    }
    
    // Firebase Firestore lookup logic has been removed.
    // We cannot validate the session or fetch user data from Firestore anymore.
    console.warn(`src/lib/auth.ts: Session cookie found, but cannot validate (Firebase disabled). Returning null.`);
    return null;

    // // Example of returning a mock user if needed for dev and if this auth() function is critical for UI flow:
    // if (process.env.NODE_ENV === 'development') {
    //   console.warn("src/lib/auth.ts: DEV MODE - Returning mock user as Firebase is disabled.");
    //   return {
    //     user: {
    //       id: 'dev-mock-user-from-lib-auth',
    //       name: 'Dev Mock User',
    //       email: 'devmock@example.com',
    //       image: null,
    //       role: 'admin',
    //       isPremium: true
    //     },
    //     expires: new Date(Date.now() + 3600 * 1000).toISOString() // Mock expires in 1 hour
    //   };
    // }
    // return null;
    
  } catch (error) {
    // This catch is primarily for errors from cookieStore.get(), not Firebase.
    console.error('src/lib/auth.ts: Error (likely cookie access related):', error);
    return null;
  }
} 