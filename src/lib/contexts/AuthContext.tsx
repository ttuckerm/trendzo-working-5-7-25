"use client";

import React, { createContext, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { getCookie, deleteCookie } from 'cookies-next';
import { getSupabaseClient } from '../supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Use the SSR-compatible browser client (syncs session to cookies)
const supabaseClient = getSupabaseClient();

// User type that matches legacy interface for backwards compatibility
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  [key: string]: any;
}

// Keep FirebaseUserType as alias for backwards compatibility
export type FirebaseUserType = AuthUser;

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  authError: Error | null;
  signInWithGoogle: (nextUrl?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Helper to convert Supabase user to our AuthUser format
function toAuthUser(supabaseUser: SupabaseUser): AuthUser {
  return {
    uid: supabaseUser.id,
    email: supabaseUser.email || null,
    displayName: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
    photoURL: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null,
    emailVerified: supabaseUser.email_confirmed_at != null,
    isAnonymous: supabaseUser.is_anonymous || false,
  };
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  authError: null,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInAnonymously: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const router = useRouter();

  // Handle post-authentication redirect for newsletter templates
  const handlePendingTemplateRedirect = () => {
    try {
      const pendingTemplateId = getCookie('pending_template_id');
      const localStorageTemplateId = typeof window !== 'undefined' ? localStorage.getItem('pendingTemplateId') : null;
      const newsletterSource = getCookie('newsletter_source') ||
        (typeof window !== 'undefined' ? localStorage.getItem('templateSource') : null);
      const newsletterCampaign = getCookie('newsletter_campaign') ||
        (typeof window !== 'undefined' ? localStorage.getItem('templateCampaign') : null);

      const templateId = pendingTemplateId || localStorageTemplateId;

      if (templateId) {
        console.log('Found pending template ID:', templateId);

        deleteCookie('pending_template_id');
        deleteCookie('newsletter_source');
        deleteCookie('newsletter_campaign');

        if (typeof window !== 'undefined') {
          localStorage.removeItem('pendingTemplateId');
          localStorage.removeItem('templateSource');
          localStorage.removeItem('templateCampaign');
        }

        let redirectUrl = `/editor?id=${templateId}`;
        if (newsletterSource) redirectUrl += `&source=${newsletterSource}`;
        if (newsletterCampaign) redirectUrl += `&campaign=${newsletterCampaign}`;

        if (newsletterSource === 'newsletter') {
          fetch('/api/analytics/track-template-usage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              templateId,
              source: newsletterSource,
              campaign: newsletterCampaign || 'none',
              action: 'newsletter_auth_complete',
              userId: user?.uid || 'anonymous'
            }),
          }).catch(console.error);
        }

        router.push(redirectUrl);
        return true;
      }
    } catch (error) {
      console.error('Error handling pending template redirect:', error);
    }
    return false;
  };

  // Set up Supabase auth state listener
  useEffect(() => {
    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const authUser = toAuthUser(session.user);
        setUser(authUser);
        // Check if user is admin by matching against configured admin email
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        setIsAdmin(adminEmail ? session.user.email === adminEmail : false);
        handlePendingTemplateRedirect();
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Supabase auth state change:', event);

        if (session?.user) {
          const authUser = toAuthUser(session.user);
          setUser(authUser);
          // Check if user is admin by matching against configured admin email
          const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
          setIsAdmin(adminEmail ? session.user.email === adminEmail : false);
          setAuthError(null);

          if (event === 'SIGNED_IN') {
            handlePendingTemplateRedirect();
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const signInWithGoogle = async (nextUrl?: string) => {
    setAuthError(null);
    console.log('=== GOOGLE SIGN IN START ===');
    console.log('Next URL param:', nextUrl);

    try {
      // Build callback URL with optional next parameter for post-auth redirect
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      if (nextUrl) {
        callbackUrl.searchParams.set('next', nextUrl);
      }
      console.log('Callback URL:', callbackUrl.toString());

      const result = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      console.log('OAuth result:', result);

      if (result.error) {
        console.error('OAuth error:', result.error);
        setAuthError(result.error);
        throw result.error;
      }

      if (result.data?.url) {
        console.log('Redirecting to:', result.data.url);
        window.location.href = result.data.url;
      } else {
        throw new Error('No redirect URL received from Supabase');
      }
    } catch (error) {
      console.error('=== GOOGLE SIGN IN ERROR ===', error);
      const err = error instanceof Error ? error : new Error('Google sign-in failed');
      setAuthError(err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setAuthError(error);
        throw error;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Sign-in failed');
      setAuthError(err);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setAuthError(error);
        throw error;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Sign-up failed');
      setAuthError(err);
      throw err;
    }
  };

  const anonymousSignIn = async () => {
    setAuthError(null);
    try {
      const { error } = await supabaseClient.auth.signInAnonymously();
      if (error) {
        setAuthError(error);
        throw error;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Anonymous sign-in failed');
      setAuthError(err);
      throw err;
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        setAuthError(error);
        throw error;
      }
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Sign-out failed');
      setAuthError(err);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setAuthError(error);
        throw error;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Password reset failed');
      setAuthError(err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        authError,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAnonymously: anonymousSignIn,
        signOut: signOutUser,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
