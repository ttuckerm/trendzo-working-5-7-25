import { createClient } from '@supabase/supabase-js';

const BASE = 'http://127.0.0.1:3000';
const NICHE = 'fitness';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

async function countRows(table: string): Promise<number | null> {
  const { count, error } = await db.from(table).select('*', { count: 'exact', head: true });
  if (error) {
    console.log(`  [count ${table}] ERROR: ${error.message}`);
    return null;
  }
  return count ?? 0;
}

async function snapshot(label: string) {
  const tables = ['cultural_scan_results', 'detected_trends', 'cultural_events', 'atlas_accuracy_summary', 'prediction_log'];
  const out: Record<string, number | null> = {};
  for (const t of tables) out[t] = await countRows(t);
  console.log(`  [${label}] ${JSON.stringify(out)}`);
  return out;
}

function delta(before: Record<string, number | null>, after: Record<string, number | null>) {
  const d: Record<string, string> = {};
  for (const k of Object.keys(before)) {
    const b = before[k];
    const a = after[k];
    const diff = (a ?? 0) - (b ?? 0);
    d[k] = `${b}→${a} (Δ${diff >= 0 ? '+' : ''}${diff})`;
  }
  return d;
}

async function timedFetch(url: string, init?: RequestInit): Promise<{ ms: number; status: number; body: any }> {
  const t0 = Date.now();
  const res = await fetch(url, init);
  const ms = Date.now() - t0;
  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch {}
  return { ms, status: res.status, body };
}

async function main() {
  console.log('=== ATLAS CRON DRY RUN — niche=fitness ===');
  console.log('Start time:', new Date().toISOString());
  console.log();

  // ───────────────────────────────────────────────────────────
  // DRY RUN 1: Cultural Scanner
  // ───────────────────────────────────────────────────────────
  console.log('─── DRY RUN 1: Cultural Scanner ───');
  console.log(`GET ${BASE}/api/cron/cultural-scan?niche=${NICHE}`);
  const snap1Before = await snapshot('before');
  let r1: any;
  try {
    r1 = await timedFetch(`${BASE}/api/cron/cultural-scan?niche=${NICHE}`);
    console.log(`  HTTP ${r1.status}  ${r1.ms}ms`);
    console.log(`  Response body:`);
    console.log('  ' + JSON.stringify(r1.body, null, 2).split('\n').join('\n  '));
  } catch (e: any) {
    console.log(`  FETCH ERROR: ${e.message}`);
  }
  const snap1After = await snapshot('after');
  console.log('  Table deltas:', JSON.stringify(delta(snap1Before, snap1After), null, 2));
  console.log();

  // ───────────────────────────────────────────────────────────
  // DRY RUN 2: Event Classifier
  // ───────────────────────────────────────────────────────────
  console.log('─── DRY RUN 2: Event Classifier ───');
  console.log(`GET ${BASE}/api/cron/classify-events?niche=${NICHE}`);
  const snap2Before = await snapshot('before');
  let r2: any;
  try {
    r2 = await timedFetch(`${BASE}/api/cron/classify-events?niche=${NICHE}`);
    console.log(`  HTTP ${r2.status}  ${r2.ms}ms`);
    console.log(`  Response body:`);
    console.log('  ' + JSON.stringify(r2.body, null, 2).split('\n').join('\n  '));
  } catch (e: any) {
    console.log(`  FETCH ERROR: ${e.message}`);
  }
  const snap2After = await snapshot('after');
  console.log('  Table deltas:', JSON.stringify(delta(snap2Before, snap2After), null, 2));
  console.log();

  // ───────────────────────────────────────────────────────────
  // DRY RUN 3: Feedback Collector (POST with CRON_SECRET)
  // ───────────────────────────────────────────────────────────
  console.log('─── DRY RUN 3: Feedback Collector ───');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.log('  CRON_SECRET not set — skipping');
  } else {
    console.log(`POST ${BASE}/api/atlas/feedback-collector  (Authorization: Bearer <CRON_SECRET>)`);
    const snap3Before = await snapshot('before');
    let r3: any;
    try {
      r3 = await timedFetch(`${BASE}/api/atlas/feedback-collector`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(`  HTTP ${r3.status}  ${r3.ms}ms`);
      console.log(`  Response body:`);
      console.log('  ' + JSON.stringify(r3.body, null, 2).split('\n').join('\n  '));
    } catch (e: any) {
      console.log(`  FETCH ERROR: ${e.message}`);
    }
    const snap3After = await snapshot('after');
    console.log('  Table deltas:', JSON.stringify(delta(snap3Before, snap3After), null, 2));
  }
  console.log();

  // ───────────────────────────────────────────────────────────
  // Post-run: most recent rows in each output table
  // ───────────────────────────────────────────────────────────
  console.log('─── Post-run: most recent 3 rows per table ───');

  console.log('cultural_scan_results:');
  const { data: scanRows } = await db
    .from('cultural_scan_results')
    .select('id,niche,source,scan_date,post_count,created_at')
    .order('created_at', { ascending: false })
    .limit(3);
  for (const r of scanRows ?? []) console.log(`  id=${r.id} niche=${r.niche} source=${r.source} posts=${r.post_count} at=${r.created_at}`);

  console.log('detected_trends:');
  const { data: trendRows } = await db
    .from('detected_trends')
    .select('id,niche,velocity_score,confidence,source_count,trend_summary,created_at')
    .order('created_at', { ascending: false })
    .limit(3);
  for (const r of trendRows ?? []) {
    console.log(`  id=${r.id} niche=${r.niche} vel=${r.velocity_score} conf=${r.confidence} srcN=${r.source_count} at=${r.created_at}`);
    console.log(`    ${String(r.trend_summary).slice(0, 160)}`);
  }

  console.log('cultural_events:');
  const { data: eventRows } = await db
    .from('cultural_events')
    .select('id,niche,event_title,status,auto_approved,confidence,velocity_score,created_at')
    .order('created_at', { ascending: false })
    .limit(3);
  for (const r of eventRows ?? []) console.log(`  id=${r.id} niche=${r.niche} status=${r.status} auto=${r.auto_approved} conf=${r.confidence} vel=${r.velocity_score} at=${r.created_at}`);

  console.log();
  console.log('End time:', new Date().toISOString());
  console.log('=== DONE ===');
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
