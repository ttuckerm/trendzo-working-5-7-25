/**
 * Firebase initialization utilities for test environments
 */

const { initializeApp, getApp } = require('firebase/app');
const { getEnvVariable } = require('./env');

/**
 * Initialize Firebase specifically for test environments
 * This function ensures Firebase is properly initialized with test configurations
 * 
 * @param {Object} options - Optional configuration options
 * @param {boolean} options.debug - Whether to print detailed debug information
 * @param {Object} options.testConfig - Optional test configuration to use instead of env vars
 * @returns {Object} Result object with success status, app instance, and error details if any
 */
function initializeTestFirebase(options = {}) {
  const { debug = false, testConfig = null } = options;
  
  try {
    // Print debug info if requested
    if (debug) {
      console.log('DEBUG: Firebase initialization options:', options);
      
      // Check for key environment variables
      const envVars = [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NEXT_PUBLIC_FIREBASE_APP_ID'
      ];
      
      console.log('DEBUG: Checking for environment variables:');
      envVars.forEach(key => {
        const value = process.env[key];
        console.log(`- ${key}: ${value ? 'Present' : 'Missing'}`);
      });
    }
    
    // Check if app is already initialized
    try {
      const app = getApp();
      if (debug) console.log('DEBUG: Firebase app found:', app.name);
      return {
        success: true,
        app,
        message: 'Using existing Firebase app instance'
      };
    } catch (e) {
      if (debug) console.log('DEBUG: No existing Firebase app found, initializing new app');
      // App not initialized, continue to initialization
    }
    
    // Build Firebase config from environment variables or use provided test config
    const firebaseConfig = testConfig || {
      apiKey: getEnvVariable('NEXT_PUBLIC_FIREBASE_API_KEY', ''),
      authDomain: getEnvVariable('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', ''),
      projectId: getEnvVariable('NEXT_PUBLIC_FIREBASE_PROJECT_ID', ''),
      storageBucket: getEnvVariable('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', ''),
      messagingSenderId: getEnvVariable('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', ''),
      appId: getEnvVariable('NEXT_PUBLIC_FIREBASE_APP_ID', ''),
    };
    
    if (debug) {
      console.log('DEBUG: Firebase configuration:');
      console.log(JSON.stringify({
        ...firebaseConfig,
        // Mask sensitive values for security in logs
        apiKey: firebaseConfig.apiKey ? '****' : '',
        appId: firebaseConfig.appId ? '****' : ''
      }, null, 2));
    }
    
    // Validate required Firebase config values
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      return {
        success: false,
        error: 'Required Firebase configuration missing. Please check your test environment variables.',
        missingFields: [
          !firebaseConfig.apiKey ? 'NEXT_PUBLIC_FIREBASE_API_KEY' : null, 
          !firebaseConfig.projectId ? 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' : null
        ].filter(Boolean),
        config: {
          ...firebaseConfig,
          // Mask sensitive values for security in error reports
          apiKey: firebaseConfig.apiKey ? '[PRESENT]' : '[MISSING]',
          appId: firebaseConfig.appId ? '[PRESENT]' : '[MISSING]'
        }
      };
    }
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    if (debug) console.log('DEBUG: Firebase app initialized successfully:', app.name);
    
    return {
      success: true,
      app,
      message: 'Firebase initialized successfully for tests'
    };
  } catch (error) {
    console.error('Error initializing Firebase for tests:', error);
    return {
      success: false,
      error: error.message || 'Unknown error during Firebase initialization',
      details: error
    };
  }
}

/**
 * Initialize Firebase with mock configuration for unit tests
 * This provides a consistent test environment without requiring real credentials
 * 
 * @returns {Object} Result of the initialization
 */
function initializeTestFirebaseWithMockConfig() {
  const mockConfig = {
    apiKey: 'test-firebase-key',
    authDomain: 'test-domain.firebaseapp.com',
    projectId: 'test-project',
    storageBucket: 'test-bucket.appspot.com',
    messagingSenderId: '123456789',
    appId: 'test-app-id'
  };
  
  return initializeTestFirebase({ testConfig: mockConfig });
}

module.exports = {
  initializeTestFirebase,
  initializeTestFirebaseWithMockConfig
}; 