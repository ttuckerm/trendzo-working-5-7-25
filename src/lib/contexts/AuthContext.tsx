"use client";

import React, { createContext, useEffect, useState } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, signInAnonymously } from "firebase/auth";
import { User } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useRouter } from 'next/navigation';
import { getCookie, deleteCookie } from 'cookies-next';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  authError: Error | null;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  authError: null,
  signInWithGoogle: async () => {},
  signInAnonymously: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const router = useRouter();

  // Create a mock user for development
  useEffect(() => {
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    const devBypassEnabled = typeof window !== 'undefined' ? 
      localStorage.getItem('trendzo_dev_bypass') === 'true' || true : false;
    
    if (isDev && devBypassEnabled && !user) {
      console.log('🧪 DEV MODE: Creating mock user for development');
      
      // Create a mock user for development testing
      const mockUser = {
        uid: 'dev-user-123',
        email: 'dev@example.com',
        displayName: 'Dev User',
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        phoneNumber: null,
        providerId: 'password',
        metadata: {},
        providerData: [],
        refreshToken: 'mock-refresh-token',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'mock-id-token',
        getIdTokenResult: async () => ({ token: 'mock-token' } as any),
        reload: async () => {},
        toJSON: () => ({})
      };
      
      // Cast to any to bypass TypeScript strict checks for development
      setUser(mockUser as any);
      setIsAdmin(true); // Make the dev user an admin for testing all features
      setLoading(false);
      
      // Store in localStorage for persistence
      localStorage.setItem('trendzo_dev_bypass', 'true');
    }
  }, [user]);

  // Handle post-authentication redirect for newsletter templates
  const handlePendingTemplateRedirect = () => {
    try {
      // Check if there's a pending template ID stored in cookies
      const pendingTemplateId = getCookie('pending_template_id');
      
      // Also check localStorage as a fallback (template preview page uses this)
      const localStorageTemplateId = typeof window !== 'undefined' ? localStorage.getItem('pendingTemplateId') : null;
      
      // Get source and campaign from cookies or localStorage
      const newsletterSource = getCookie('newsletter_source') || 
        (typeof window !== 'undefined' ? localStorage.getItem('templateSource') : null);
      const newsletterCampaign = getCookie('newsletter_campaign') || 
        (typeof window !== 'undefined' ? localStorage.getItem('templateCampaign') : null);
      
      const templateId = pendingTemplateId || localStorageTemplateId;
      
      if (templateId) {
        console.log('Found pending template ID:', templateId);
        
        // Clear cookies and localStorage
        deleteCookie('pending_template_id');
        deleteCookie('newsletter_source');
        deleteCookie('newsletter_campaign');
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pendingTemplateId');
          localStorage.removeItem('templateSource');
          localStorage.removeItem('templateCampaign');
        }
        
        // Construct the URL with tracking parameters
        let redirectUrl = `/editor?id=${templateId}`;
        
        // Add source and campaign if available
        if (newsletterSource) {
          redirectUrl += `&source=${newsletterSource}`;
        }
        
        if (newsletterCampaign) {
          redirectUrl += `&campaign=${newsletterCampaign}`;
        }
        
        // Track this as an authentication event in analytics
        if (newsletterSource === 'newsletter') {
          try {
            fetch('/api/analytics/track-template-usage', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                templateId,
                source: newsletterSource,
                campaign: newsletterCampaign || 'none',
                action: 'newsletter_auth_complete',
                userId: user?.uid || 'anonymous'
              }),
            });
          } catch (analyticsError) {
            console.error('Error tracking newsletter auth completion:', analyticsError);
          }
        }
        
        // Redirect to the editor with the template
        router.push(redirectUrl);
        return true; // Indicates a redirect was performed
      }
    } catch (error) {
      console.error('Error handling pending template redirect:', error);
    }
    
    return false; // No redirect was performed
  };

  useEffect(() => {
    let unsubscribe = () => {};
    
    try {
      // Only set up auth listener if auth is available
      if (auth && typeof auth.onAuthStateChanged === 'function') {
        unsubscribe = auth.onAuthStateChanged((user) => {
          setUser(user);
          // Check if user is admin
          if (user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
          setLoading(false);
          setAuthError(null); // Clear any previous errors
          
          // If user signed in, check for pending template redirect
          if (user) {
            handlePendingTemplateRedirect();
          }
        }, (error) => {
          console.error("Auth state change error:", error);
          setLoading(false);
          setAuthError(error instanceof Error ? error : new Error(String(error)));
        });
      } else {
        // If auth is not available, just set loading to false
        console.warn("Firebase auth not available, proceeding in development mode");
        setLoading(false);
        if (!auth) {
          setAuthError(new Error("Firebase auth not initialized"));
        }
      }
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      setLoading(false);
      setAuthError(error instanceof Error ? error : new Error(String(error)));
    }

    return () => {
      try {
        unsubscribe();
      } catch (error) {
        console.error("Error unsubscribing from auth listener:", error);
      }
    };
  }, [router]);

  const signInWithGoogle = async () => {
    if (!auth) {
      console.error("Auth service not available");
      return;
    }
    
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error signing in with Google", error);
      // Re-throw the error so it can be caught and handled by the UI
      throw error;
    }
  };

  const anonymousSignIn = async () => {
    if (!auth) {
      console.error("Auth service not available");
      return;
    }
    
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error("Error signing in anonymously", error);
      throw error;
    }
  };

  const signOutUser = async () => {
    if (!auth) {
      console.error("Auth service not available");
      return;
    }
    
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error("Error signing out", error);
      throw error;
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
        signInAnonymously: anonymousSignIn, 
        signOut: signOutUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
