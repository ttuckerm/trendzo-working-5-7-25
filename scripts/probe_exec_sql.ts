import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  // Try a trivially safe exec_sql — select 1
  const { data, error } = await (db as any).rpc('exec_sql', { query: 'select 1 as probe' });
  console.log('exec_sql({query: "select 1"}):', { data, error: error?.message, code: error?.code });

  // Also test the 'sql' param variant
  const r2 = await (db as any).rpc('exec_sql', { sql: 'select 1 as probe' });
  console.log('exec_sql({sql: ...}):', { data: r2.data, error: r2.error?.message, code: r2.error?.code });

  // Also test a pg_version probe — do we have Postgres 15+?
  // Can't use exec_sql if not available; skip if failed.
  if (!error) {
    const v = await (db as any).rpc('exec_sql', { query: 'select current_setting(\'server_version\') as v' });
    console.log('pg version:', v);
  }

  // Probe source_meta sample
  const { data: rowWithNiche } = await db
    .from('prediction_runs')
    .select('id, source_meta, predicted_dps_7d, prediction_error')
    .not('actual_dps', 'is', null)
    .not('predicted_dps_7d', 'is', null)
    .limit(3);
  console.log('sample labeled rows:', rowWithNiche);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
