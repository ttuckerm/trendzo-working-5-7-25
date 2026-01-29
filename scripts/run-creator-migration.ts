/**
 * Run Creator Personalization Migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } }
);

async function main() {
  console.log('Running creator personalization migration...\n');

  // Read migration file
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20251119_creator_personalization.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s.length > 10);

  console.log(`Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip comments
    if (statement.startsWith('COMMENT')) {
      console.log(`${i + 1}. Skipping comment`);
      continue;
    }

    try {
      // Execute using raw query
      const { error } = await supabase.rpc('exec_sql', { query: statement + ';' });

      if (error) {
        // Table might already exist
        if (error.message.includes('already exists')) {
          console.log(`${i + 1}. Skipped (already exists)`);
        } else {
          console.error(`${i + 1}. Error:`, error.message);
        }
      } else {
        const preview = statement.substring(0, 60).replace(/\n/g, ' ');
        console.log(`${i + 1}. ✓ ${preview}...`);
      }
    } catch (err: any) {
      console.error(`${i + 1}. Exception:`, err.message);
    }
  }

  // Verify tables were created
  console.log('\nVerifying tables...');

  const { data: profiles, error: profilesError } = await supabase
    .from('creator_profiles')
    .select('count');

  const { data: history, error: historyError } = await supabase
    .from('creator_video_history')
    .select('count');

  if (!profilesError && !historyError) {
    console.log('✓ creator_profiles table exists');
    console.log('✓ creator_video_history table exists');
    console.log('\n=== MIGRATION COMPLETE ===');
  } else {
    console.error('❌ Table verification failed');
    if (profilesError) console.error('  creator_profiles:', profilesError.message);
    if (historyError) console.error('  creator_video_history:', historyError.message);
  }
}

main().catch(console.error);
