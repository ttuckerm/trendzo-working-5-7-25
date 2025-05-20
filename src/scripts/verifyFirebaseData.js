/**
 * Firebase Data Integrity Verification
 * 
 * This script connects directly to Firebase and verifies the data integrity
 * of the sounds collection.
 * SCRIPT DISABLED: Firebase is being removed.
 */

const SCRIPT_DISABLED_MSG = "verifyFirebaseData.js: Firebase is being removed. This data verification script is now disabled.";
console.warn(SCRIPT_DISABLED_MSG);

// Use CommonJS require for Node.js script
const fs = require('fs');
const path = require('path');
// const { initializeApp } = require('firebase/app');
// const { 
//   getFirestore, 
//   collection, 
//   getDocs, 
//   query, 
//   where,
//   limit 
// } = require('firebase/firestore');

// Load environment variables from .env.local if dotenv is available
try {
  require('dotenv').config({ path: '.env.local' });
  console.log('Loaded environment variables from .env.local');
} catch (error) {
  console.warn('Could not load dotenv, will use fallback values:', error.message);
}

// Configuration
const TEST_RESULTS_DIR = path.join(process.cwd(), 'test-results');
const TEST_RESULTS_FILE = path.join(TEST_RESULTS_DIR, 'firebase-integrity-results.json');
const SOUNDS_COLLECTION = 'sounds';
const SOUND_TREND_REPORTS_COLLECTION = 'soundTrendReports';

// Create test results directory if it doesn't exist
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

// Firebase configuration - check both formats of environment variables with fallbacks
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDKH4Ku4nnYHxx1eh_peemEaMPSfB2fGDc",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "trenzo-3.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "trenzo-3",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "trenzo-3.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "178132579252",
  appId: process.env.FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:178132579252:web:a48e9be636ff17a196f8e1"
};

// Log Firebase configuration for debugging (hiding sensitive values)
console.log('Using Firebase configuration:');
console.log('- apiKey:', firebaseConfig.apiKey ? '*****' : 'Not set');
console.log('- projectId:', firebaseConfig.projectId);
console.log('- authDomain:', firebaseConfig.authDomain);

// Initialize Firebase
// try {
//   const app = initializeApp(firebaseConfig);
//   const db = getFirestore(app);
  
//   console.log('Firebase initialized successfully');

// Test status tracking
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
  }
};

// Test helper function
function recordTestResult(name, passed, details = {}) {
  const result = {
    name,
    passed,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (passed) {
    testResults.summary.passed++;
    console.log(`✅ PASSED: ${name}`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ FAILED: ${name}`);
    if (details.error) {
      console.error(`   Error: ${details.error}`);
    }
  }
  
  return passed;
}

// Validate a sound document
function validateSoundDocument(sound) {
  // Required fields
  const requiredFields = [
    'id', 
    'title', 
    'authorName', 
    'duration', 
    'usageCount', 
    'creationDate',
    'stats',
    'lifecycle'
  ];
  
  const missingFields = requiredFields.filter(field => !sound.hasOwnProperty(field));
  
  // Check stats object
  const statsFields = ['usageCount', 'usageChange7d', 'usageChange14d', 'usageChange30d'];
  let missingStatsFields = [];
  
  if (sound.stats) {
    missingStatsFields = statsFields.filter(field => !sound.stats.hasOwnProperty(field));
  } else {
    missingStatsFields = statsFields;
  }
  
  // Check lifecycle object
  const lifecycleFields = ['stage', 'discoveryDate', 'lastDetectedDate'];
  let missingLifecycleFields = [];
  
  if (sound.lifecycle) {
    missingLifecycleFields = lifecycleFields.filter(field => !sound.lifecycle.hasOwnProperty(field));
  } else {
    missingLifecycleFields = lifecycleFields;
  }
  
  // Return validation result
  return {
    isValid: missingFields.length === 0 && missingStatsFields.length === 0 && missingLifecycleFields.length === 0,
    missingFields,
    missingStatsFields,
    missingLifecycleFields
  };
}

// Main verification function
async function verifyFirebaseData() {
  console.warn(SCRIPT_DISABLED_MSG);
  console.warn("verifyFirebaseData: Function not executing as Firebase is being removed.");
  
  // Store empty/default results
  testResults.summary.total = 0;
  testResults.summary.passed = 0;
  testResults.summary.failed = 0;
  fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
  console.log(`Test results (script disabled) written to ${TEST_RESULTS_FILE}`);
  return;

  /* Original Script Logic Below */
  // console.log('Starting Firebase Data Integrity Verification...');
  // console.log('==============================================');
  
  try {
    // Test 1: Verify sounds collection exists and has documents
    try {
      console.log('\nTest 1: Verifying sounds collection...');
      
      const soundsQuery = query(collection(db, SOUNDS_COLLECTION), limit(10));
      const soundsSnapshot = await getDocs(soundsQuery);
      const soundsCount = soundsSnapshot.size;
      
      recordTestResult('Sounds Collection',
        soundsCount > 0,
        {
          collection: SOUNDS_COLLECTION,
          documentCount: soundsCount
        }
      );
      
      // If we have sounds, validate their structure
      if (soundsCount > 0) {
        let validSounds = 0;
        let invalidSounds = 0;
        const invalidSoundDetails = [];
        
        soundsSnapshot.forEach(doc => {
          const sound = doc.data();
          const validation = validateSoundDocument(sound);
          
          if (validation.isValid) {
            validSounds++;
          } else {
            invalidSounds++;
            invalidSoundDetails.push({
              id: doc.id,
              ...validation
            });
          }
        });
        
        // Test 2: Verify sound document structure
        console.log('\nTest 2: Verifying sound document structure...');
        recordTestResult('Sound Document Structure',
          invalidSounds === 0,
          {
            validSounds,
            invalidSounds,
            invalidSoundDetails: invalidSoundDetails.length > 0 ? invalidSoundDetails : undefined
          }
        );
      }
    } catch (error) {
      recordTestResult('Sounds Collection Access', false, { 
        error: error.message,
        collection: SOUNDS_COLLECTION
      });
    }
    
    // Test 3: Verify sound documents have correct lifecycle stages
    try {
      console.log('\nTest 3: Verifying sound lifecycle stages...');
      
      // Valid lifecycle stages
      const validStages = ['emerging', 'growing', 'peaking', 'declining', 'stable'];
      
      const soundsQuery = query(collection(db, SOUNDS_COLLECTION), limit(10));
      const soundsSnapshot = await getDocs(soundsQuery);
      
      let soundsWithValidStage = 0;
      let soundsWithInvalidStage = 0;
      const invalidStageDetails = [];
      
      soundsSnapshot.forEach(doc => {
        const sound = doc.data();
        
        if (sound.lifecycle && sound.lifecycle.stage) {
          if (validStages.includes(sound.lifecycle.stage)) {
            soundsWithValidStage++;
          } else {
            soundsWithInvalidStage++;
            invalidStageDetails.push({
              id: doc.id,
              invalidStage: sound.lifecycle.stage
            });
          }
        } else {
          soundsWithInvalidStage++;
          invalidStageDetails.push({
            id: doc.id,
            error: 'Missing lifecycle.stage'
          });
        }
      });
      
      recordTestResult('Sound Lifecycle Stages',
        soundsWithInvalidStage === 0,
        {
          validStageCount: soundsWithValidStage,
          invalidStageCount: soundsWithInvalidStage,
          invalidStageDetails: invalidStageDetails.length > 0 ? invalidStageDetails : undefined,
          validStages
        }
      );
    } catch (error) {
      recordTestResult('Sound Lifecycle Verification', false, { 
        error: error.message
      });
    }
    
    // Test 4: Verify trend reports collection exists
    try {
      console.log('\nTest 4: Verifying trend reports collection...');
      
      const reportsQuery = query(collection(db, SOUND_TREND_REPORTS_COLLECTION), limit(5));
      const reportsSnapshot = await getDocs(reportsQuery);
      const reportsCount = reportsSnapshot.size;
      
      recordTestResult('Trend Reports Collection',
        reportsCount > 0,
        {
          collection: SOUND_TREND_REPORTS_COLLECTION,
          documentCount: reportsCount
        }
      );
    } catch (error) {
      recordTestResult('Trend Reports Collection Access', false, { 
        error: error.message,
        collection: SOUND_TREND_REPORTS_COLLECTION
      });
    }
    
    // Test 5: Check for sounds with usage history
    try {
      console.log('\nTest 5: Checking for sounds with usage history...');
      
      const soundsQuery = query(collection(db, SOUNDS_COLLECTION), limit(10));
      const soundsSnapshot = await getDocs(soundsQuery);
      
      let soundsWithHistory = 0;
      let soundsWithoutHistory = 0;
      
      soundsSnapshot.forEach(doc => {
        const sound = doc.data();
        
        if (sound.usageHistory && Object.keys(sound.usageHistory).length > 0) {
          soundsWithHistory++;
        } else {
          soundsWithoutHistory++;
        }
      });
      
      // We want at least some sounds to have usage history
      recordTestResult('Sound Usage History',
        soundsWithHistory > 0,
        {
          soundsWithHistory,
          soundsWithoutHistory,
          totalSounds: soundsSnapshot.size
        }
      );
    } catch (error) {
      recordTestResult('Sound Usage History Check', false, { 
        error: error.message
      });
    }
    
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    // Print test summary
    console.log('\n==============================================');
    console.log('Test Summary:');
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log('==============================================');
    
    // Save test results to file
    fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
    console.log(`\nTest results saved to: ${TEST_RESULTS_FILE}`);
  }
}

// Run verification
verifyFirebaseData();
// } catch (error) {
//   console.error('Failed to initialize Firebase or run script:', error);
//   recordTestResult('Firebase Initialization', false, { error: error.message });
//   fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
//   console.log(`Test results (with initialization error) written to ${TEST_RESULTS_FILE}`);
//   process.exit(1);
// } 