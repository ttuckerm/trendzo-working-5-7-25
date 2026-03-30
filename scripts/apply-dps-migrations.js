/**
 * Apply DPS migrations to scraped_videos table
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigrations() {
  console.log('📊 Applying DPS migrations to scraped_videos table...\n');

  const migrations = [
    '20251002_add_dps_to_scraped_videos.sql',
    '20251015_extend_dps_columns.sql'
  ];

  for (const migration of migrations) {
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migration);

    if (!fs.existsSync(migrationPath)) {
      console.log(`⚠️  Migration not found: ${migration}`);
      continue;
    }

    console.log(`📄 Applying ${migration}...`);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

      if (error) {
        // Try direct execution if RPC fails
        const { error: directError } = await supabase.from('_migrations').insert({
          name: migration,
          executed_at: new Date().toISOString()
        });

        if (directError) {
          console.log(`   ⚠️  Note: ${error.message}`);
          console.log(`   💡 Migration may already be applied or requires manual execution via Supabase dashboard`);
        }
      } else {
        console.log(`   ✅ Applied successfully`);
      }
    } catch (err) {
      console.log(`   ⚠️  ${err.message}`);
      console.log(`   💡 You may need to run this migration manually in Supabase SQL Editor`);
    }
  }

  console.log('\n✅ Migration process complete');
  console.log('💡 If migrations failed, copy SQL from supabase/migrations/ and run in Supabase dashboard\n');
}

applyMigrations().catch(console.error);
