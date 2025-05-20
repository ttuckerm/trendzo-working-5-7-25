"use client";

import React, { createContext, useEffect, useState } from "react";
// import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, signInAnonymously } from "firebase/auth"; // Firebase SDK call
// import { User } from "firebase/auth"; // Firebase User type
// import type { User as FirebaseUserType } from "firebase/auth";
// import { auth } from "../firebase/firebase"; // This is now null
import { useRouter } from 'next/navigation';
import { getCookie, deleteCookie } from 'cookies-next';

const AUTH_DISABLED_MSG = "Firebase Auth is disabled.";

// Placeholder for the FirebaseUserType, as the direct import is being removed.
// This should ideally match the structure of firebase.User if specific fields are accessed.
export interface FirebaseUserType {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  // Add other properties that are actually used from the original Firebase User type
  // For example, if your mock user or other parts of the code expect these:
  // phoneNumber: string | null;
  // providerId: string;
  // metadata: any; // Or a more specific type like UserMetadata
  // providerData: any[]; // Or a more specific type like UserInfo[]
  // refreshToken: string;
  // tenantId: string | null;
  // delete: () => Promise<void>;
  // getIdToken: (forceRefresh?: boolean) => Promise<string>;
  // getIdTokenResult: (forceRefresh?: boolean) => Promise<any>; // IdTokenResult
  // reload: () => Promise<void>;
  // toJSON: () => object;
  [key: string]: any; // Allow other properties to exist
}

interface AuthContextType {
  user: FirebaseUserType | null;
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
  signInWithGoogle: async () => { console.warn(`signInWithGoogle: ${AUTH_DISABLED_MSG}`); throw new Error(AUTH_DISABLED_MSG); },
  signInAnonymously: async () => { console.warn(`signInAnonymously: ${AUTH_DISABLED_MSG}`); throw new Error(AUTH_DISABLED_MSG); },
  signOut: async () => { console.warn(`signOut: ${AUTH_DISABLED_MSG}`); },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const router = useRouter();

  // Create a mock user for development
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    const devBypassEnabled = typeof window !== 'undefined' ? 
      localStorage.getItem('trendzo_dev_bypass') === 'true' || true : false;
    
    if (isDev && devBypassEnabled && !user) {
      console.log('🧪 DEV MODE: Creating mock user for development');
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
        delete: async () => { console.log("Mock user delete called"); },
        getIdToken: async () => 'mock-id-token',
        getIdTokenResult: async () => ({ token: 'mock-token' } as any),
        reload: async () => { console.log("Mock user reload called"); },
        toJSON: () => ({ uid: 'dev-user-123' })
      } as unknown as FirebaseUserType; // Cast to FirebaseUserType, ensure structure is compatible enough
      
      setUser(mockUser);
      setIsAdmin(true); 
      setLoading(false);
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
    
    // try {
      // Since auth from ../firebase/firebase is null, this block will effectively be skipped.
      // The original code had checks for auth and auth.onAuthStateChanged.
      // We will simplify this to reflect that Firebase auth is disabled.
      // if (auth && typeof auth.onAuthStateChanged === 'function') { ... }

      console.warn(`AuthContext Effect: Firebase auth listener setup skipped as Firebase is disabled.`);
      // If not in dev bypass mode and relying on this for user state, user will remain null.
      if (!(process.env.NODE_ENV === 'development' && localStorage.getItem('trendzo_dev_bypass') === 'true')) {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
      setAuthError(new Error(AUTH_DISABLED_MSG + " Listener not attached."));
    // } catch (error) { ... } // Error handling for listener setup can be simplified

    return () => {
      // try {
      //   unsubscribe(); // Original unsubscribe call
      // } catch (error) { ... }
    };
  }, [router]); // router dependency might still be relevant for handlePendingTemplateRedirect if it was called within onAuthStateChanged

  const signInWithGoogle = async () => {
    // if (!auth) { ... } // auth is known to be null or non-functional
    console.warn(`signInWithGoogle: ${AUTH_DISABLED_MSG}`);
    setAuthError(new Error(AUTH_DISABLED_MSG));
    throw new Error(AUTH_DISABLED_MSG); // Or handle UI by not throwing
    // Original: const provider = new GoogleAuthProvider(); await signInWithPopup(auth, provider);
  };

  const anonymousSignIn = async () => {
    // if (!auth) { ... }
    console.warn(`anonymousSignIn: ${AUTH_DISABLED_MSG}`);
    setAuthError(new Error(AUTH_DISABLED_MSG));
    throw new Error(AUTH_DISABLED_MSG);
    // Original: await signInAnonymously(auth);
  };

  const signOutUser = async () => {
    // if (!auth) { ... }
    console.warn(`signOut: ${AUTH_DISABLED_MSG}`);
    setUser(null);
    setIsAdmin(false);
    setAuthError(null);
    // Original: await firebaseSignOut(auth);
    // Clear dev bypass if you want sign out to fully clear mock user
    // if (typeof window !== 'undefined') localStorage.removeItem('trendzo_dev_bypass');
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
