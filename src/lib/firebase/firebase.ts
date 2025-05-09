import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDKH4Ku4nnYHxx1eh_peemEaMPSfB2fGDc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "trenzo-3.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "trenzo-3",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "trenzo-3.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "178132579252",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:178132579252:web:a48e9be636ff17a196f8e1"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize auth conditionally
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Error initializing Firebase services:", error);
  
  // Provide placeholder objects for development
  if (process.env.NODE_ENV === 'development') {
    auth = null;
    db = null;
    storage = null;
  }
}

export { app, auth, db, storage };
