/**
 * Environment Setup Utility
 * 
 * This script loads environment variables from .env.local for testing scripts
 * and ensures that Firebase configuration is properly available.
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

function setupTestEnvironment() {
  console.log('Setting up test environment...');
  
  // Paths to check for env files
  const envPaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env.development'),
    path.resolve(process.cwd(), '.env')
  ];
  
  let loaded = false;
  
  // Try to load from each path
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const result = dotenv.config({ path: envPath });
      
      if (result.error) {
        console.warn(`Warning: Error loading ${envPath}: ${result.error.message}`);
      } else {
        console.log(`Loaded environment variables from ${envPath}`);
        loaded = true;
      }
    }
  }
  
  if (!loaded) {
    console.warn('Warning: No environment files found. Using default fallback values.');
  }
  
  // Add NEXT_PUBLIC versions of Firebase env vars if only FIREBASE_ versions exist
  const firebaseVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN', 
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
  ];
  
  firebaseVars.forEach(varName => {
    const nextPublicVar = `NEXT_PUBLIC_${varName}`;
    
    // If FIREBASE_X exists but NEXT_PUBLIC_FIREBASE_X doesn't, copy the value
    if (process.env[varName] && !process.env[nextPublicVar]) {
      process.env[nextPublicVar] = process.env[varName];
      console.log(`Set ${nextPublicVar} from ${varName}`);
    }
    
    // And vice versa
    if (!process.env[varName] && process.env[nextPublicVar]) {
      process.env[varName] = process.env[nextPublicVar];
      console.log(`Set ${varName} from ${nextPublicVar}`);
    }
  });
  
  // Check for Firebase variables and set fallbacks if needed
  const fallbacks = {
    FIREBASE_API_KEY: 'AIzaSyDKH4Ku4nnYHxx1eh_peemEaMPSfB2fGDc',
    FIREBASE_AUTH_DOMAIN: 'trenzo-3.firebaseapp.com',
    FIREBASE_PROJECT_ID: 'trenzo-3',
    FIREBASE_STORAGE_BUCKET: 'trenzo-3.firebasestorage.app',
    FIREBASE_MESSAGING_SENDER_ID: '178132579252',
    FIREBASE_APP_ID: '1:178132579252:web:a48e9be636ff17a196f8e1'
  };
  
  // Set fallback values if not present
  Object.entries(fallbacks).forEach(([key, value]) => {
    const nextPublicKey = `NEXT_PUBLIC_${key}`;
    
    if (!process.env[key]) {
      process.env[key] = value;
      console.log(`Set fallback for ${key}`);
    }
    
    if (!process.env[nextPublicKey]) {
      process.env[nextPublicKey] = value;
      console.log(`Set fallback for ${nextPublicKey}`);
    }
  });
  
  console.log('Environment setup complete.');
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupTestEnvironment();
}

module.exports = { setupTestEnvironment }; 