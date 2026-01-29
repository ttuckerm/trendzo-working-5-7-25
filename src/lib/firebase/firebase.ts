// src/lib/firebase/firebase.ts
// MIGRATED TO SUPABASE - This file now exports null objects to prevent import errors
// All Firebase functionality has been migrated to Supabase

// Mock interfaces for compatibility with existing imports
interface Auth {
  currentUser?: any;
  signInWithEmailAndPassword?: any;
  signOut?: any;
}

interface Firestore {
  collection?: any;
  doc?: any;
}

interface FirebaseStorage {
  ref?: any;
  getDownloadURL?: any;
}

interface Analytics {
  logEvent?: any;
}

interface Crashlytics {
  setUserId?: (userId: string) => void;
}

interface RemoteConfig {
  defaultConfig?: any;
  settings?: any;
}

// All Firebase services are now null - migrated to Supabase
const app = null;
const auth: Auth | null = null;
const db: Firestore | null = null;
const storage: FirebaseStorage | null = null;
const analytics: Analytics | null = null;
const crashlytics: Crashlytics | null = null;
const remoteConfig: RemoteConfig | null = null;

// Mock helper functions for compatibility
export const setCrashlyticsUserId = (userId: string) => {
    console.warn("setCrashlyticsUserId called, but Firebase is disabled. Migrated to Supabase. UserID:", userId);
};

export const refreshRemoteConfig = async () => {
    console.warn("refreshRemoteConfig called, but Firebase is disabled. Migrated to Supabase.");
};

// Export null objects to maintain compatibility with existing imports
export { app, auth, db, storage, analytics, crashlytics, remoteConfig };