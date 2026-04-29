import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  console.log('=== integration_job_runs — all rows ===');
  const { data, error } = await db
    .from('integration_job_runs')
    .select('*')
    .order('last_run', { ascending: false });
  if (error) {
    console.log('ERROR:', error.message);
    return;
  }
  console.log(`Total rows: ${data?.length}`);
  for (const r of data ?? []) {
    console.log(`  ${String(r.job).padEnd(32)} last_run=${r.last_run}`);
  }

  console.log();
  console.log('=== prediction_log probe ===');
  // Retry count with different call shape
  const { count, error: err } = await db
    .from('prediction_log')
    .select('id', { count: 'exact', head: true });
  console.log('count(id):', count, 'err:', err?.message);

  const { data: anyRow } = await db.from('prediction_log').select('*').limit(1);
  console.log('first row keys:', anyRow?.[0] ? Object.keys(anyRow[0]).join(',') : '(no rows)');
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
