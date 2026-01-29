#!/usr/bin/env node

/**
 * FEAT-007 Migration Runner
 * Runs the pre_content_predictions table migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('\n🚀 Running FEAT-007 Migration\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251003_feat007_pre_content_predictions.sql');
    console.log('📄 Reading migration file:', migrationPath);

    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    console.log('⚙️  Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql RPC doesn't exist, try direct execution via REST API
      console.log('⚠️  RPC method not available, trying direct execution...');

      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
        body: JSON.stringify({ sql_query: sql }),
      });

      if (!response.ok) {
        throw new Error(`Migration failed: ${response.statusText}`);
      }
    }

    console.log('✅ Migration completed successfully!');

    // Verify table was created
    console.log('\n🔍 Verifying table creation...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('pre_content_predictions')
      .select('count')
      .limit(0);

    if (tableError) {
      console.warn('⚠️  Could not verify table creation:', tableError.message);
      console.log('   Please check manually in Supabase dashboard');
    } else {
      console.log('✅ Table "pre_content_predictions" verified');
    }

    console.log('\n✨ FEAT-007 migration complete!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Manual installation instructions:');
    console.error('   1. Go to Supabase dashboard');
    console.error('   2. Open SQL Editor');
    console.error('   3. Copy contents of: supabase/migrations/20251003_feat007_pre_content_predictions.sql');
    console.error('   4. Run the SQL\n');
    process.exit(1);
  }
}

runMigration();
