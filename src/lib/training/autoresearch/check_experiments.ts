import { createClient } from '@supabase/supabase-js';
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);
(async () => {
  const { data } = await db
    .from('training_experiments')
    .select('id, experiment_type, experiment_mode, description, training_data_rows, validation_spearman, baseline_spearman, delta, result, error_message, locked_at, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  for (const r of data ?? []) {
    console.log(JSON.stringify(r, null, 2));
    console.log('---');
  }
})().catch(e => { console.error(e); process.exit(1); });
