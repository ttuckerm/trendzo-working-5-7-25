/**
 * Command-line script to migrate data from Firebase to Supabase
 * 
 * Usage:
 * node migrate-to-supabase.js
 */

// Load environment variables
require('dotenv').config({
  path: '.env.local'
});

// Import required modules
const { runMigration } = require('./src/lib/utils/migration');

async function main() {
  console.log('Trendzo: Firebase to Supabase Migration Tool');
  console.log('============================================');
  console.log('');
  
  try {
    console.log('Starting migration process...');
    console.log('This will transfer your single test user from Firebase to Supabase.');
    console.log('');
    
    const result = await runMigration();
    
    if (result.success) {
      console.log('');
      console.log('✅ Migration completed successfully!');
      
      if (result.userResults && result.userResults.length) {
        console.log('');
        console.log(`Migrated ${result.userResults.length} users:`);
        result.userResults.forEach(user => {
          console.log(`- ${user.email}: Firebase UID ${user.firebaseUid} → Supabase ID ${user.supabaseUserId}`);
        });
      }
      
      console.log('');
      console.log('Next steps:');
      console.log('1. Test logging in with the migrated user in Supabase');
      console.log('2. Set the environment variable NEXT_PUBLIC_USE_SUPABASE=true in your .env.local file');
      console.log('3. Restart your Next.js server to apply the changes');
    } else {
      console.error('');
      console.error('❌ Migration failed:');
      
      if (result.error) {
        console.error(result.error);
      }
      
      if (result.userResults && result.userResults.length) {
        const failures = result.userResults.filter(r => !r.success);
        if (failures.length) {
          console.error('');
          console.error(`${failures.length} user migration failures:`);
          failures.forEach(user => {
            console.error(`- ${user.email}: ${user.error}`);
          });
        }
      }
      
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