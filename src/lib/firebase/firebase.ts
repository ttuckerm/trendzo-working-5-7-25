// src/lib/firebase/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import { getRemoteConfig, RemoteConfig, fetchAndActivate } from "firebase/remote-config";

// Add a mock Crashlytics interface since it's referenced but not imported
interface Crashlytics {
  setUserId?: (userId: string) => void;
}

// Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDKH4Ku4nnYHxx1eh_peemEaMPSfB2fGDc",
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "trenzo-3.firebaseapp.com",
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "trenzo-3",
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "trenzo-3.firebasestorage.app",
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "178132579252",
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:178132579252:web:a48e9be636ff17a196f8e1"
// };

// Initialize Firebase
// const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const app = null; // Explicitly nullify

// Initialize services conditionally
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;
let crashlytics: Crashlytics | null = null;
let remoteConfig: RemoteConfig | null = null;

// Mock getCrashlytics function since it's not imported but referenced
// const getCrashlytics = (app: any): Crashlytics | null => {
//   // Return a mock implementation
//   console.warn("Crashlytics is not available, using mock implementation");
//   return {
//     setUserId: (userId: string) => {
//       console.log("Mock Crashlytics setUserId called with:", userId);
//     }
//   };
// };

// Mock setUserIdCrashlytics function
// const setUserIdCrashlytics = (crashlytics: Crashlytics, userId: string) => {
//   if (crashlytics && crashlytics.setUserId) {
//     crashlytics.setUserId(userId);
//   }
// };

/*
try {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Initialize Analytics, Crashlytics, and Remote Config (client-side only)
  if (typeof window !== 'undefined') {
    // Check if analytics is supported
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    });
    
    // Initialize Crashlytics
    crashlytics = getCrashlytics(app);
    
    // Initialize Remote Config
    remoteConfig = getRemoteConfig(app);
    
    // Configure Remote Config settings
    if (remoteConfig) {
      remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
      
      // Set default values
      remoteConfig.defaultConfig = {
        'maintenance_mode': false,
        'show_new_feature': false,
        'max_daily_prompts': 10,
        'enable_analytics': true,
      };
    }
  }
} catch (error) {
  console.error("Error initializing Firebase services:", error);
  
  // Provide placeholder objects for development
  if (process.env.NODE_ENV === 'development') {
    auth = null;
    db = null;
    storage = null;
    analytics = null;
    crashlytics = null;
    remoteConfig = null;
  }
}
*/

// Helper function to set user ID for better error tracking
// export const setCrashlyticsUserId = (userId: string) => {
//   if (crashlytics) {
//     setUserIdCrashlytics(crashlytics, userId);
//   }
// };
export const setCrashlyticsUserId = (userId: string) => {
    console.warn("setCrashlyticsUserId called, but Crashlytics is disabled. UserID:", userId);
};


// Helper function to fetch and activate Remote Config
// export const refreshRemoteConfig = async () => {
//   if (!remoteConfig) return;
  
//   try {
//     await fetchAndActivate(remoteConfig);
//     console.log('Remote config fetched and activated');
//   } catch (error) {
//     console.error('Failed to fetch remote config:', error);
//   }
// };
export const refreshRemoteConfig = async () => {
    console.warn("refreshRemoteConfig called, but Remote Config is disabled.");
};

// export { app, auth, db, storage, analytics, crashlytics, remoteConfig };
// Ensure existing exports are explicitly null or non-functional
// to minimize immediate undefined errors in importing files.
// Other files will still import these, but they will be null.
export { app, auth, db, storage, analytics, crashlytics, remoteConfig };