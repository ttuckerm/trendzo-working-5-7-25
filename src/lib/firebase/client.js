/**
 * Firebase client utilities
 */

const { initializeApp, getApps } = require('firebase/app');
const { getAuth: getFirebaseAuth, signInWithEmailAndPassword, signOut: firebaseSignOut } = require('firebase/auth');
const { getFirestore: getFirebaseFirestore } = require('firebase/firestore');

// Firebase configuration - typically these would be environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Initialize Firebase if it hasn't been initialized yet
 * @returns {Object} Firebase app instance
 */
function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  
  return getApps()[0];
}

/**
 * Get Firebase Auth instance
 * @returns {Object} Firebase Auth instance
 */
function getAuth() {
  getFirebaseApp();
  return getFirebaseAuth();
}

/**
 * Get Firestore instance
 * @returns {Object} Firestore instance
 */
function getFirestore() {
  getFirebaseApp();
  return getFirebaseFirestore();
}

/**
 * Check if a user is currently signed in
 * @returns {boolean} Whether a user is signed in
 */
function isUserSignedIn() {
  const auth = getAuth();
  return !!auth.currentUser;
}

/**
 * Get the current user
 * @returns {Object|null} Current user or null if not signed in
 */
function getCurrentUser() {
  const auth = getAuth();
  return auth.currentUser;
}

module.exports = {
  getFirebaseApp,
  getAuth,
  getFirestore,
  isUserSignedIn,
  getCurrentUser,
  signInWithEmailAndPassword,
  signOut: firebaseSignOut
}; 