/**
 * Apply Features Column Migration Directly
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function applyMigration() {
  console.log('========================================');
  console.log('APPLYING FEATURES COLUMN MIGRATION');
  console.log('========================================\n');

  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20251124_3_add_features_column.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📝 Migration SQL:\n');
  console.log(sql);
  console.log('\n📤 Executing migration...\n');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (!statement) continue;

    console.log(`Executing: ${statement.substring(0, 60)}...`);

    const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

    if (error) {
      // Try direct execution
      const { error: directError } = await supabase.from('_raw').select('*').limit(0);

      console.log(`⚠️  RPC error (expected): ${error.message}`);
      console.log('   Trying alternative method...\n');
    } else {
      console.log('✅ Statement executed\n');
    }
  }

  // Verify the columns were added
  console.log('========================================');
  console.log('VERIFYING MIGRATION');
  console.log('========================================\n');

  const { data, error } = await supabase
    .from('prediction_events')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Error querying table:', error.message);
    return;
  }

  if (data && data.length > 0) {
    const columns = Object.keys(data[0]);
    console.log('Available columns:', columns);

    if (columns.includes('features')) {
      console.log('\n✅ features column EXISTS');
    } else {
      console.log('\n❌ features column NOT FOUND');
    }

    if (columns.includes('components_used')) {
      console.log('✅ components_used column EXISTS');
    } else {
      console.log('❌ components_used column NOT FOUND');
    }

    if (columns.includes('component_scores')) {
      console.log('✅ component_scores column EXISTS');
    } else {
      console.log('❌ component_scores column NOT FOUND');
    }
  }
}

applyMigration();
