/**
 * Unified Authentication Service
 * This service provides a consistent interface for authentication,
 * regardless of whether Firebase or Supabase is used as the provider.
 */

import { useSupabaseAuth } from './provider-switcher';
import { getAuth, signInWithEmailAndPassword as firebaseSignIn, signOut as firebaseSignOut } from '../firebase/client';
import { createClient } from '@supabase/supabase-js';
import { getEnvVariable } from '../utils/env';

/**
 * Get a Supabase client for authentication
 * @returns {Object} Supabase client
 */
function getSupabaseClient() {
  const supabaseUrl = getEnvVariable('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = getEnvVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Convert a Firebase or Supabase user to a unified user format
 * @param {Object} user - The user object from either provider
 * @returns {Object} Unified user object
 */
function convertToUnifiedUser(user) {
  if (!user) return null;
  
  // Check if it's a Supabase user (has a UUID property)
  if (user.id || user.uuid) {
    return {
      id: user.id || user.uuid,
      email: user.email || null,
      provider: 'supabase',
      emailVerified: user.email_confirmed_at ? true : false,
      displayName: user.user_metadata?.displayName || null,
      photoURL: user.user_metadata?.avatar_url || null,
    };
  }
  
  // Assume it's a Firebase user
  return {
    id: user.uid,
    email: user.email || null,
    provider: 'firebase',
    emailVerified: user.emailVerified || false,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
  };
}

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Authentication result with unified user object
 */
export async function signInWithEmailAndPassword(email, password) {
  if (useSupabaseAuth()) {
    // Use Supabase
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return {
      user: convertToUnifiedUser(data.user),
      session: data.session,
    };
  } else {
    // Use Firebase
    const auth = getAuth();
    const result = await firebaseSignIn(auth, email, password);
    
    return {
      user: convertToUnifiedUser(result.user),
      // Firebase doesn't have the same session concept, but we can return something similar
      session: {
        access_token: await result.user.getIdToken(),
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      },
    };
  }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function signOut() {
  if (useSupabaseAuth()) {
    // Use Supabase
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  } else {
    // Use Firebase
    const auth = getAuth();
    await firebaseSignOut(auth);
  }
}

/**
 * Get the current authenticated user
 * @returns {Promise<Object|null>} Current unified user or null if not authenticated
 */
export async function getCurrentUser() {
  if (useSupabaseAuth()) {
    // Use Supabase
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getUser();
    return convertToUnifiedUser(data.user);
  } else {
    // Use Firebase
    const auth = getAuth();
    return convertToUnifiedUser(auth.currentUser);
  }
}

/**
 * Get the current auth state (user and session)
 * @returns {Promise<Object>} Auth state with unified user and session
 */
export async function getAuthState() {
  if (useSupabaseAuth()) {
    // Use Supabase
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    
    return {
      user: convertToUnifiedUser(data.session?.user),
      session: data.session,
    };
  } else {
    // Use Firebase
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return { user: null, session: null };
    }
    
    return {
      user: convertToUnifiedUser(user),
      session: {
        access_token: await user.getIdToken(),
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      },
    };
  }
} 