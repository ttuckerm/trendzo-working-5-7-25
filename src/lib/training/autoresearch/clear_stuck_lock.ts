import { createClient } from '@supabase/supabase-js';
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

(async () => {
  // Clear any locked sandbox row older than 5 minutes OR with result='error' and no metrics
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: stuck } = await db
    .from('training_experiments')
    .select('id, description, locked_at, result, validation_spearman')
    .eq('experiment_mode', 'sandbox')
    .not('locked_at', 'is', null)
    .lt('locked_at', fiveMinAgo);

  if (!stuck || stuck.length === 0) {
    console.log('No stuck locks to clear.');
    return;
  }

  for (const row of stuck) {
    console.log(`Clearing lock: ${row.id} "${row.description}" (locked ${row.locked_at})`);
    // Release lock but keep row as historical error record
    const { error } = await db
      .from('training_experiments')
      .update({ locked_at: null, result: 'error', error_message: 'killed by orchestrator timeout' })
      .eq('id', row.id);
    if (error) console.error(`  failed: ${error.message}`);
    else console.log(`  released.`);
  }
})().catch(e => { console.error(e); process.exit(1); });
