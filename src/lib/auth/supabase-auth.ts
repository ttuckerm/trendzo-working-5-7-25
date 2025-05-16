import { supabaseClient } from '../supabase-client';
import { User, AuthChangeEvent } from '@supabase/supabase-js';

export interface AuthResult {
  user: User | null;
  error: Error | null;
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    
    return {
      user: data?.user || null,
      error: error,
    };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    
    return {
      user: data?.user || null,
      error: error,
    };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabaseClient.auth.signOut();
    return { error };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function resetPassword(email: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function getSession() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    return {
      session: data.session,
      error,
    };
  } catch (error) {
    return {
      session: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function getUser(): Promise<User | null> {
  const { data } = await supabaseClient.auth.getUser();
  return data?.user || null;
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, user: User | null) => void) {
  return supabaseClient.auth.onAuthStateChange(callback);
}