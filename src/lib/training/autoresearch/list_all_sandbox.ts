import { createClient } from '@supabase/supabase-js';
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);
(async () => {
  const { data } = await db
    .from('training_experiments')
    .select('id, description, training_data_rows, validation_spearman, baseline_spearman, delta, result, error_message, locked_at, created_at')
    .eq('experiment_mode', 'sandbox')
    .like('description', '[autoresearch]%')
    .order('created_at', { ascending: true });
  for (const r of data ?? []) {
    console.log(`${r.created_at}  ${r.id}  result=${r.result}  locked=${r.locked_at ? 'YES' : '--'}  delta=${r.delta ?? '--'}  rows=${r.training_data_rows}  desc="${r.description.slice(0, 80)}..."`);
  }
})().catch(e => { console.error(e); process.exit(1); });
