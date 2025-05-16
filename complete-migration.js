/**
 * Complete migration script from Firebase to Supabase
 * 
 * This script combines both authentication and data migration in one process
 * 
 * Usage:
 * node complete-migration.js
 */

// Load environment variables
require('dotenv').config({
  path: '.env.local'
});

// Import required modules
const { runMigration } = require('./src/lib/utils/migration');
const { migrateCollections, initializeFirebaseIfNeeded } = require('./src/lib/utils/data-migration');
const fs = require('fs');

// Default collection mappings - same as in migrate-data-to-supabase.js
const DEFAULT_MAPPINGS = [
  {
    firebaseCollection: 'users',
    supabaseTable: 'profiles',
    transform: (data, id) => ({
      id: id, // Use Firebase ID as Supabase ID for profiles
      email: data.email,
      display_name: data.displayName || '',
      avatar_url: data.photoURL || '',
      firebase_uid: id,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
  },
  {
    firebaseCollection: 'templates',
    supabaseTable: 'templates',
    transform: (data, id) => ({
      ...data,
      firebase_id: id,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
  },
  {
    firebaseCollection: 'sounds',
    supabaseTable: 'sounds',
    transform: (data, id) => ({
      ...data,
      firebase_id: id,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
  }
];

/**
 * Validate that required environment variables are set
 * @returns {boolean} True if all required variables are set
 */
function validateEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    console.error('u274c Missing required environment variables:');
    missing.forEach(varName => console.error(`  - ${varName}`));
    console.error('');
    console.error('Please set these variables in your .env.local file before continuing.');
    return false;
  }
  
  return true;
}

/**
 * Enable Supabase in the .env.local file
 * @returns {Promise<boolean>} Whether the update was successful
 */
async function enableSupabaseInEnv() {
  try {
    const envPath = '.env.local';
    let envContent = '';
    
    // Read current .env.local file
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    } else {
      console.error(`u26a0ufe0f ${envPath} file not found. Creating a new one.`);
      envContent = '# Created by migration script\n';
    }
    
    // Check if NEXT_PUBLIC_USE_SUPABASE exists
    if (envContent.includes('NEXT_PUBLIC_USE_SUPABASE=')) {
      // Replace the existing setting
      envContent = envContent.replace(
        /NEXT_PUBLIC_USE_SUPABASE=(true|false)/,
        'NEXT_PUBLIC_USE_SUPABASE=true'
      );
    } else {
      // Add the setting if it doesn't exist
      envContent += '\n# Migration completed, using Supabase as primary auth provider\nNEXT_PUBLIC_USE_SUPABASE=true\n';
    }
    
    // Write updated content back to file
    fs.writeFileSync(envPath, envContent);
    
    console.log('u2705 Successfully enabled Supabase in .env.local file');
    return true;
  } catch (error) {
    console.error('u274c Error updating .env.local file:', error.message);
    return false;
  }
}

async function main() {
  console.log('Trendzo: Complete Firebase to Supabase Migration');
  console.log('==============================================');
  console.log('');
  
  try {
    // Validate environment before proceeding
    if (!validateEnvironment()) {
      process.exit(1);
    }
    
    // Initialize Firebase
    if (!initializeFirebaseIfNeeded()) {
      console.error('u274c Failed to initialize Firebase. Please check your Firebase configuration.');
      process.exit(1);
    }
    
    // Step 1: Migrate authentication users
    console.log('Starting authentication migration...');
    console.log('');
    
    const authResult = await runMigration();
    
    if (authResult.success) {
      console.log('');
      console.log('u2705 Authentication migration completed successfully!');
      
      if (authResult.userResults && authResult.userResults.length) {
        console.log('');
        console.log(`Migrated ${authResult.userResults.length} users:`);
        authResult.userResults.forEach(user => {
          console.log(`- ${user.email}: Firebase UID ${user.firebaseUid} u2192 Supabase ID ${user.supabaseUserId}`);
        });
      }
    } else {
      console.error('');
      console.error('u274c Authentication migration failed:');
      console.error(authResult.error || 'Unknown error');
      
      if (authResult.userResults && authResult.userResults.length) {
        const failures = authResult.userResults.filter(r => !r.success);
        if (failures.length) {
          console.error('');
          console.error(`${failures.length} user migration failures:`);
          failures.forEach(user => {
            console.error(`- ${user.email}: ${user.error}`);
          });
        }
      }
      
      // Ask whether to continue with data migration
      console.log('');
      console.log('Authentication migration failed. Do you want to continue with data migration?');
      console.log('If you continue, users may not have proper access to migrated data.');
      console.log('Press Ctrl+C to abort or wait 10 seconds to continue with data migration...');
      
      // Wait 10 seconds before continuing
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    // Step 2: Migrate data collections
    console.log('');
    console.log('Starting data migration...');
    console.log('');
    
    const dataResult = await migrateCollections(DEFAULT_MAPPINGS);
    
    if (dataResult.success) {
      console.log('');
      console.log('u2705 Data migration completed successfully!');
      
      // Print summary
      for (const [collection, details] of Object.entries(dataResult.collectionResults)) {
        console.log('');
        console.log(`Collection ${collection} u2192 ${details.targetTable}:`);
        console.log(`  - ${details.successCount}/${details.totalCount} documents migrated successfully`);
        
        if (details.successCount < details.totalCount) {
          const failures = details.results.filter(r => !r.success);
          console.log('  - Failures:');
          failures.forEach(f => {
            console.log(`    - ${f.id}: ${f.error}`);
          });
        }
      }
    } else {
      console.error('');
      console.error('u274c Data migration failed:');
      console.error(dataResult.error || 'Unknown error');
      
      if (dataResult.failedCollections && dataResult.failedCollections.length > 0) {
        console.error('');
        console.error('Failed collections:');
        dataResult.failedCollections.forEach(collection => {
          console.error(`  - ${collection}`);
        });
      }
    }
    
    // Step 3: Enable Supabase in .env.local
    console.log('');
    console.log('Enabling Supabase as primary authentication provider...');
    
    const envUpdateResult = await enableSupabaseInEnv();
    
    // Final summary
    console.log('');
    console.log('Migration Summary:');
    console.log('----------------');
    console.log(`Auth Migration: ${authResult.success ? 'u2705 Success' : 'u274c Failed'}`);
    console.log(`Data Migration: ${dataResult.success ? 'u2705 Success' : 'u274c Failed'}`);
    console.log(`Environment Update: ${envUpdateResult ? 'u2705 Success' : 'u274c Failed'}`);
    console.log('');
    
    const overallSuccess = authResult.success && dataResult.success && envUpdateResult;
    
    if (overallSuccess) {
      console.log('u2705 Complete migration successful!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Restart your Next.js server to apply the changes');
      console.log('2. Verify user logins work correctly');
      console.log('3. Verify data access works correctly');
      console.log('4. Verify that the frontend is using Supabase correctly');
    } else {
      console.log('u26a0ufe0f Migration completed with some issues.');
      console.log('');
      console.log('Troubleshooting:');
      console.log('1. If auth migration failed but data migration succeeded:');
      console.log('   - Manually create users in Supabase Admin UI');
      console.log('   - Ensure user IDs match the Firebase IDs for proper access');
      console.log('2. If data migration failed:');
      console.log('   - Run migrate-data-to-supabase.js for specific collections');
      console.log('   - Check error messages for specific issues');
      console.log('3. If environment update failed:');
      console.log('   - Manually set NEXT_PUBLIC_USE_SUPABASE=true in .env.local');
    }
  } catch (error) {
    console.error('');
    console.error('u274c Unexpected error during migration:');
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 