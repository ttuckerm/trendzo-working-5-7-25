const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function applyMigration() {
  console.log('🔧 Applying predictions table migration...\n');

  // Step 1: Drop old table
  console.log('Step 1: Dropping old predictions table...');
  const { error: dropError } = await supabase.rpc('exec_sql', {
    sql: 'DROP TABLE IF EXISTS predictions CASCADE;'
  });

  if (dropError) {
    console.error('❌ Failed to drop table:', dropError);
    console.log('Trying alternative method...');

    // Alternative: Use supabase SQL editor or direct approach
    console.log('\n⚠️  Cannot drop table via RPC. You need to run this SQL manually:');
    console.log('\nIn Supabase SQL Editor, run:');
    console.log('```sql');
    console.log('DROP TABLE IF EXISTS predictions CASCADE;');
    console.log('```\n');

    console.log('Then run the migration file:');
    console.log('supabase/migrations/20251008_predictions_table.sql\n');
    return;
  }

  console.log('✅ Old table dropped');

  // Step 2: Create new table
  console.log('\nStep 2: Creating new predictions table...');
  const migrationSQL = fs.readFileSync('supabase/migrations/20251008_predictions_table.sql', 'utf8');

  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: migrationSQL
  });

  if (createError) {
    console.error('❌ Failed to create table:', createError);
    console.log('\n⚠️  You need to apply this migration manually.');
    console.log('Run this in Supabase SQL Editor:');
    console.log('\n' + migrationSQL);
    return;
  }

  console.log('✅ New table created');

  // Step 3: Verify
  console.log('\nStep 3: Verifying new schema...');
  const { data, error: verifyError } = await supabase
    .from('predictions')
    .select('*')
    .limit(1);

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError);
    return;
  }

  console.log('✅ Migration successful!\n');
  console.log('Expected columns: script, platform, niche, predicted_dps, predicted_classification, confidence, extraction_insights, top_pattern_matches, recommendations');
}

applyMigration();
