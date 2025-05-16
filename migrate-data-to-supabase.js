/**
 * Command-line script to migrate data from Firebase to Supabase
 * 
 * Usage:
 * node migrate-data-to-supabase.js [collection] [table]
 * node migrate-data-to-supabase.js --all
 * 
 * Examples:
 * node migrate-data-to-supabase.js users profiles
 * node migrate-data-to-supabase.js --all
 */

// Load environment variables
require('dotenv').config({
  path: '.env.local'
});

// Import required modules
const { migrateCollection, migrateCollections, initializeFirebaseIfNeeded } = require('./src/lib/utils/data-migration');

// Default collection mappings
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
 * Display tool usage instructions
 */
function displayUsage() {
  console.log('Usage:');
  console.log('  node migrate-data-to-supabase.js [collection] [table]');
  console.log('  node migrate-data-to-supabase.js --all');
  console.log('');
  console.log('Examples:');
  console.log('  node migrate-data-to-supabase.js users profiles');
  console.log('  node migrate-data-to-supabase.js --all');
  console.log('');
  console.log('Options:');
  console.log('  --all             Migrate all configured collections');
  console.log('  --help            Display this help message');
  console.log('');
  console.log('Default Collections:');
  DEFAULT_MAPPINGS.forEach(mapping => {
    console.log(`  ${mapping.firebaseCollection} → ${mapping.supabaseTable}`);
  });
}

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
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`  - ${varName}`));
    console.error('');
    console.error('Please set these variables in your .env.local file before continuing.');
    return false;
  }
  
  return true;
}

async function main() {
  console.log('Trendzo: Firebase to Supabase Data Migration Tool');
  console.log('==============================================');
  console.log('');
  
  try {
    const args = process.argv.slice(2);
    
    // If no arguments or help flag, show usage
    if (args.length === 0 || args[0] === '--help') {
      displayUsage();
      process.exit(0);
    }
    
    // Validate environment before proceeding
    if (!validateEnvironment()) {
      process.exit(1);
    }
    
    // Initialize Firebase
    if (!initializeFirebaseIfNeeded()) {
      console.error('❌ Failed to initialize Firebase. Please check your Firebase configuration.');
      process.exit(1);
    }
    
    // Migrate all collections
    if (args[0] === '--all') {
      console.log('Starting migration of all configured collections...');
      console.log('');
      
      const result = await migrateCollections(DEFAULT_MAPPINGS);
      
      if (result.success) {
        console.log('');
        console.log('✅ Migration completed successfully!');
        
        // Print summary
        for (const [collection, details] of Object.entries(result.collectionResults)) {
          console.log('');
          console.log(`Collection ${collection} → ${details.targetTable}:`);
          console.log(`  - ${details.successCount}/${details.totalCount} documents migrated successfully`);
          
          if (details.successCount < details.totalCount) {
            const failures = details.results.filter(r => !r.success);
            console.log('  - Failures:');
            failures.forEach(f => {
              console.log(`    - ${f.id}: ${f.error}`);
            });
          }
        }
        
        console.log('');
        console.log('Next steps:');
        console.log('1. Verify the migrated data in your Supabase dashboard');
        console.log('2. You can now use the complete-migration.js script to finalize the migration');
      } else {
        console.error('');
        console.error('❌ Migration failed:');
        console.error(result.error || 'Unknown error');
        
        if (result.failedCollections && result.failedCollections.length > 0) {
          console.error('');
          console.error('Failed collections:');
          result.failedCollections.forEach(collection => {
            console.error(`  - ${collection}`);
          });
        }
        
        process.exit(1);
      }
    } 
    // Migrate a specific collection
    else if (args.length >= 2) {
      const collection = args[0];
      const table = args[1];
      
      console.log(`Starting migration of collection ${collection} to table ${table}...`);
      console.log('');
      
      // Check if we have a predefined transform for this collection
      const mappingConfig = DEFAULT_MAPPINGS.find(m => m.firebaseCollection === collection);
      const transform = mappingConfig ? mappingConfig.transform : null;
      
      const results = await migrateCollection(collection, table, transform);
      
      if (results.length > 0) {
        const successCount = results.filter(r => r.success).length;
        
        console.log('');
        console.log(`✅ Migrated ${successCount}/${results.length} documents from ${collection} to ${table}`);
        
        if (successCount < results.length) {
          const failures = results.filter(r => !r.success);
          console.log('');
          console.log('Failures:');
          failures.forEach(f => {
            console.log(`- ${f.id}: ${f.error}`);
          });
        }
      } else {
        console.log('');
        console.log(`⚠️ No documents found in collection ${collection}`);
      }
    } else {
      console.error('Invalid arguments. Use --all or provide both collection and table names.');
      displayUsage();
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('❌ Unexpected error during migration:');
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 