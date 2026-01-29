/**
 * Firebase client utilities
 * SCRIPT DISABLED: Firebase is being removed.
 */
const SCRIPT_DISABLED_MSG = "firebase/client.js: Firebase is being removed. This client script is now disabled.";
console.warn(SCRIPT_DISABLED_MSG);

// const { initializeApp, getApps } = require('firebase/app');
// const { getAuth: getFirebaseAuth, signInWithEmailAndPassword, signOut: firebaseSignOut } = require('firebase/auth');
// const { getFirestore: getFirebaseFirestore } = require('firebase/firestore');

// Firebase configuration - typically these would be environment variables
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
// ... existing code ...
// };

/**
 * Initialize Firebase if it hasn't been initialized yet
 * @returns {Object} Firebase app instance (now null)
 */
function getFirebaseApp() {
  console.warn(SCRIPT_DISABLED_MSG, "getFirebaseApp called, returning null.");
  // if (!getApps().length) {
  //   return initializeApp(firebaseConfig);
  // }
  // return getApps()[0];
  return null;
}

/**
 * Get Firebase Auth instance (now null)
 * @returns {Object} Firebase Auth instance
 */
function getAuth() {
  console.warn(SCRIPT_DISABLED_MSG, "getAuth called, returning null.");
  // getFirebaseApp(); 
  // return getFirebaseAuth();
  return null;
}

/**
 * Get Firestore instance (now null)
 * @returns {Object} Firestore instance
 */
function getFirestore() {
  console.warn(SCRIPT_DISABLED_MSG, "getFirestore called, returning null.");
  // getFirebaseApp();
  // return getFirebaseFirestore();
  return null;
}

/**
 * Check if a user is currently signed in (now always false)
 * @returns {boolean} Whether a user is signed in
 */
function isUserSignedIn() {
  console.warn(SCRIPT_DISABLED_MSG, "isUserSignedIn called, returning false.");
  // const auth = getAuth();
  // return !!auth.currentUser;
  return false;
}

/**
 * Get the current user (now always null)
 * @returns {Object|null} Current user or null if not signed in
 */
function getCurrentUser() {
  console.warn(SCRIPT_DISABLED_MSG, "getCurrentUser called, returning null.");
  // const auth = getAuth();
  // return auth.currentUser;
  return null;
}

async function signInWithEmailAndPassword_disabled(auth, email, password) {
  console.warn(SCRIPT_DISABLED_MSG, "signInWithEmailAndPassword called, Firebase disabled.");
  // Simulate a Firebase AuthError for more robust testing of callers
  const error = new Error("Firebase: Error (auth/operation-not-allowed). This operation is not allowed. You must enable this service in the console.");
  // error.code = "auth/operation-not-allowed"; // Standard Firebase error codes
  return Promise.reject(error);
}

async function signOut_disabled(auth) {
  console.warn(SCRIPT_DISABLED_MSG, "signOut called, Firebase disabled.");
  return Promise.resolve();
}

module.exports = {
  getFirebaseApp,
  getAuth,
  getFirestore,
  isUserSignedIn,
  getCurrentUser,
  signInWithEmailAndPassword: signInWithEmailAndPassword_disabled,
  signOut: signOut_disabled // Was firebaseSignOut from import
}; 