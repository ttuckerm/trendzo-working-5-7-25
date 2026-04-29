import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  console.log('=== prediction_runs schema probe ===');
  const { data, error } = await db
    .from('prediction_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) {
    console.log('ERROR:', error.message);
    return;
  }
  if (!data || data.length === 0) {
    console.log('No rows.');
    return;
  }
  const cols = Object.keys(data[0]).sort();
  console.log(`Total columns: ${cols.length}`);
  console.log('Columns relevant to collector:');
  for (const c of cols) {
    if (/vps|dps|predicted|actual|niche|creator|content_id|created|video_id|score|delta/i.test(c)) {
      const v = (data[0] as any)[c];
      const vStr = typeof v === 'object' ? JSON.stringify(v)?.slice(0, 60) : String(v);
      console.log(`  ${c.padEnd(36)} = ${vStr}`);
    }
  }
  console.log();
  console.log('Full column list:');
  console.log('  ' + cols.join(', '));

  console.log();
  console.log('=== count with actual_dps set ===');
  const { count: total } = await db.from('prediction_runs').select('*', { count: 'exact', head: true });
  const { count: labeled } = await db.from('prediction_runs').select('*', { count: 'exact', head: true }).not('actual_dps', 'is', null);
  console.log(`prediction_runs total: ${total}`);
  console.log(`prediction_runs with actual_dps NOT NULL: ${labeled}`);

  const thirty = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  const { count: labeled30d } = await db
    .from('prediction_runs')
    .select('*', { count: 'exact', head: true })
    .not('actual_dps', 'is', null)
    .gte('created_at', thirty);
  console.log(`prediction_runs labeled in last 30d: ${labeled30d}`);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
