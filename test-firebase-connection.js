/**
 * Firebase Connection Test
 * 
 * A simple utility to test Firebase connection and configuration
 */

// Import the environment setup utility
require('./src/scripts/setupEnv').setupTestEnvironment();

// const { initializeApp } = require('firebase/app');
// const { getFirestore, collection, getDocs, query, limit } = require('firebase/firestore');

const SCRIPT_DISABLED_MSG = "test-firebase-connection.js: Firebase is being removed. This connection test script is now disabled.";

console.log('Firebase Connection Test');
console.log('==============================================');

// Log all available environment variables related to Firebase
console.log('\nEnvironment Variables:');
const envVars = Object.keys(process.env)
  .filter(key => key.includes('FIREBASE') || key.includes('NEXT_PUBLIC_FIREBASE'))
  .sort();

for (const key of envVars) {
  // Don't print actual API keys, just indicate if they're set
  const value = key.includes('KEY') || key.includes('APP_ID') 
    ? '*****' 
    : process.env[key];
  console.log(`- ${key}: ${value || 'Not set'}`);
}

// Firebase configuration from environment variables with fallbacks
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Log the actual config we're using (obscuring sensitive values)
console.log('\nFirebase Config:');
console.log('- apiKey:', firebaseConfig.apiKey ? '*****' : 'Not set');
console.log('- authDomain:', firebaseConfig.authDomain);
console.log('- projectId:', firebaseConfig.projectId);
console.log('- storageBucket:', firebaseConfig.storageBucket);
console.log('- messagingSenderId:', firebaseConfig.messagingSenderId);
console.log('- appId:', firebaseConfig.appId ? '*****' : 'Not set');

// Test the connection
async function testConnection() {
  try {
    console.warn(SCRIPT_DISABLED_MSG);
    // console.log('\nInitializing Firebase...');
    // const app = initializeApp(firebaseConfig);
    // console.log('Firebase app initialized');
    
    // console.log('Getting Firestore instance...');
    // const db = getFirestore(app);
    // console.log('Firestore instance created');
    
    // // Try to access 'sounds' collection
    // console.log('\nAttempting to access Firestore collections:');
    
    // // Collection names to check
    // const collections = ['sounds', 'soundTrendReports', 'templates'];
    
    // for (const collectionName of collections) {
    //   try {
    //     console.log(`\nChecking collection: ${collectionName}`);
    //     const q = query(collection(db, collectionName), limit(1));
    //     const querySnapshot = await getDocs(q);
        
    //     if (querySnapshot.empty) {
    //       console.log(`✓ Collection '${collectionName}' exists but is empty`);
    //     } else {
    //       console.log(`✓ Collection '${collectionName}' exists with ${querySnapshot.size} document(s)`);
          
    //       // Print first document structure (keys only, not values)
    //       const doc = querySnapshot.docs[0];
    //       const data = doc.data();
    //       console.log(`  Document ID: ${doc.id}`);
    //       console.log(`  Fields: ${Object.keys(data).join(', ')}`);
    //     }
    //   } catch (error) {
    //     console.error(`✗ Error accessing collection '${collectionName}':`, error.message);
    //   }
    // }
    
    console.log('\nFirebase connection test complete (simulated as disabled).');
    
  } catch (error) {
    // This catch block might still be relevant if setupTestEnvironment() or other non-Firebase parts fail
    console.error('\n✗ Script error during execution:', error);
    process.exit(1);
  }
}

// Run the test
testConnection(); 