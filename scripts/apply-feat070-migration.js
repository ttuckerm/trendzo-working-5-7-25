const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function applyMigration() {
  console.log('📦 Applying FEAT-070 predictions table migration...\n');

  const sql = fs.readFileSync(
    'supabase/migrations/20251015_feat070_predictions_table.sql',
    'utf8'
  );

  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let skipCount = 0;

  for (const statement of statements) {
    // Skip comments
    if (statement.startsWith('COMMENT')) {
      console.log('⏭️  Skipping comment statement');
      skipCount++;
      continue;
    }

    const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
    console.log(`Executing: ${preview}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        // Check if error is benign (already exists)
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate')
        ) {
          console.log(`   ⚠️  Already exists (skipping)\n`);
          skipCount++;
        } else {
          console.log(`   ❌ Error: ${error.message}\n`);
        }
      } else {
        console.log(`   ✅ Success\n`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ⚠️  ${err.message}\n`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Migration complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Skipped: ${skipCount}`);
  console.log(`   Total statements: ${statements.length}`);
  console.log('='.repeat(50));

  // Verify table was created
  console.log('\n📊 Verifying predictions table...');
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .limit(1);

  if (error) {
    console.log(`❌ Table verification failed: ${error.message}`);
  } else {
    console.log('✅ Predictions table is ready!');
  }
}

applyMigration().catch(console.error);
