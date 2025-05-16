// src/contexts/AuthContext.tsx - Simplified to use only Supabase
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabaseClient } from '../lib/supabase-client';
import {
  signInWithEmailAndPassword,
  signOut,
  getCurrentUser,
  getAuthState
} from '@/lib/auth/auth-service';
import { useSupabaseAuth, getAuthProviderName } from '@/lib/auth/provider-switcher';

// Unified user type
type UnifiedUser = {
  id: string;
  email: string | null;
};

type AuthContextType = {
  user: UnifiedUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authProvider: string;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => {},
  logout: async () => {},
  authProvider: 'firebase'
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get the current auth provider
  const authProvider = getAuthProviderName();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Use the unified auth service to get current user
        const authState = await getAuthState();
        // Type cast the user property to UnifiedUser
        setUser(authState.user as UnifiedUser);
      } catch (err: any) {
        console.error('Auth initialization error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // We don't need to set up listeners here as we're using a unified approach
    // Instead, we'll poll for user changes in a real app or use provider-specific hooks
  }, []);

  // Sign in function that uses our unified auth service
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signInWithEmailAndPassword(email, password);
      // Type cast the user property to UnifiedUser
      setUser(result.user as UnifiedUser);
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout function that uses our unified auth service
  const logout = async () => {
    setLoading(true);
    
    try {
      await signOut();
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Add the auth provider to the context value
  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      signIn,
      logout,
      authProvider
    }}>
      {children}
    </AuthContext.Provider>
  );
}