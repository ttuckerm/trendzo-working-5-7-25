import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

async function runSql(label: string, sql: string): Promise<boolean> {
  console.log(`  [${label}]`);
  // Trim trailing semicolon because exec_sql may or may not need one
  const q = sql.trim().replace(/;+$/, '');
  console.log(`    SQL: ${q.slice(0, 200).replace(/\s+/g, ' ')}`);
  const { error } = await (db as any).rpc('exec_sql', { query: q });
  if (error) {
    console.log(`    ERROR: ${error.message} (code=${error.code})`);
    return false;
  }
  console.log(`    OK`);
  return true;
}

async function verify(label: string, check: () => Promise<{ ok: boolean; detail: string }>) {
  const { ok, detail } = await check();
  console.log(`  [verify ${label}] ${ok ? 'PASS' : 'FAIL'}: ${detail}`);
  return ok;
}

async function main() {
  console.log('=== Applying Atlas migrations ===');
  console.log();

  // ── Migration 1: cultural_scan_results unique fix ───────────────────────
  console.log('--- 20260421_fix_cultural_scan_unique.sql ---');
  await runSql('drop old functional index', 'drop index if exists idx_cultural_scan_unique');

  // Check if constraint already exists (idempotency)
  const { data: existing } = await db
    .from('pg_constraint' as any)
    .select('*')
    .limit(0); // this table isn't exposed via PostgREST usually
  // Ignore — just try to create, catch duplicate error
  const addOk = await runSql(
    'add plain unique constraint with NULLS NOT DISTINCT',
    `alter table cultural_scan_results
       add constraint cultural_scan_results_unique_scan
       unique nulls not distinct (niche, source, subreddit, scan_date)`
  );
  if (!addOk) {
    console.log('  (constraint may already exist from a prior run — continuing)');
  }
  console.log();

  // ── Migration 2: prediction_log table ──────────────────────────────────
  console.log('--- 20260405_create_prediction_log.sql ---');
  await runSql(
    'create prediction_log',
    `CREATE TABLE IF NOT EXISTS prediction_log (
       id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
       prediction_id uuid,
       creator_id uuid,
       content_id text,
       predicted_vps numeric NOT NULL,
       predicted_at timestamptz DEFAULT now(),
       niche text,
       content_format text,
       actual_performance numeric,
       actual_measured_at timestamptz,
       delta numeric,
       feedback_collected boolean DEFAULT false
     )`
  );
  await runSql(
    'create index on creator_id',
    `CREATE INDEX IF NOT EXISTS idx_prediction_log_creator ON prediction_log(creator_id)`
  );
  await runSql(
    'create index on feedback_collected',
    `CREATE INDEX IF NOT EXISTS idx_prediction_log_feedback ON prediction_log(feedback_collected)`
  );
  console.log();

  // ── Verify ──────────────────────────────────────────────────────────────
  console.log('--- Verification ---');

  // 1. Can we insert a test row into cultural_scan_results with the same key twice?
  // Use a clearly disposable niche value.
  const probeKey = { niche: '__probe__', source: 'reddit', subreddit: 'probe_sr', scan_date: '2099-01-01' };
  await db.from('cultural_scan_results').delete().match(probeKey);

  const { error: ins1 } = await db.from('cultural_scan_results').insert({ ...probeKey, post_count: 0 });
  console.log(`  probe insert #1:`, ins1?.message ?? 'OK');

  // Now try upsert with onConflict — this is the exact call the scanner makes
  const { error: up2 } = await db
    .from('cultural_scan_results')
    .upsert({ ...probeKey, post_count: 1, top_themes: ['probe'] }, { onConflict: 'niche,source,subreddit,scan_date' });
  console.log(`  probe upsert via onConflict:`, up2?.message ?? 'OK');

  // Also try with subreddit=null (Twitter case)
  const probeTwKey = { niche: '__probe__', source: 'twitter', subreddit: null, scan_date: '2099-01-01' };
  await db.from('cultural_scan_results').delete().match({ niche: '__probe__', source: 'twitter', scan_date: '2099-01-01' });
  const { error: ins3 } = await db.from('cultural_scan_results').insert({ ...probeTwKey, post_count: 0 });
  console.log(`  probe twitter insert #1:`, ins3?.message ?? 'OK');
  const { error: up4 } = await db
    .from('cultural_scan_results')
    .upsert({ ...probeTwKey, post_count: 1 }, { onConflict: 'niche,source,subreddit,scan_date' });
  console.log(`  probe twitter upsert via onConflict:`, up4?.message ?? 'OK');

  // Clean up probe rows
  const { error: delErr } = await db.from('cultural_scan_results').delete().eq('niche', '__probe__');
  console.log(`  probe cleanup:`, delErr?.message ?? 'OK');

  console.log();

  // 2. prediction_log exists and is queryable
  const { error: pqErr } = await db.from('prediction_log').select('*', { count: 'exact', head: true });
  console.log(`  prediction_log queryable:`, pqErr?.message ?? 'OK (table exists)');

  console.log();
  console.log('=== DONE ===');
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
