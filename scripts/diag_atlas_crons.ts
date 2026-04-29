import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  console.log('=== ATLAS CRON DIAGNOSTIC — read-only ===');
  console.log('Run time:', new Date().toISOString());
  console.log();

  // --- 1. integration_job_runs — has the scheduler ever fired? ---
  console.log('--- 1. integration_job_runs (most recent per job_name) ---');
  const { data: runs, error: runsErr } = await db
    .from('integration_job_runs')
    .select('*')
    .order('last_run', { ascending: false })
    .limit(200);

  if (runsErr) {
    console.log('ERROR reading integration_job_runs:', runsErr.message);
  } else if (!runs || runs.length === 0) {
    console.log('NO ROWS. Scheduler has never logged a run.');
  } else {
    // Group by job_name, keep most recent
    const byJob = new Map<string, any>();
    for (const r of runs) {
      if (!byJob.has(r.job_name)) byJob.set(r.job_name, r);
    }
    console.log(`Total log rows (last 200): ${runs.length}`);
    console.log(`Distinct jobs seen: ${byJob.size}`);
    console.log();
    const rows = Array.from(byJob.values()).sort((a, b) => String(a.job_name).localeCompare(String(b.job_name)));
    for (const r of rows) {
      console.log(`  ${String(r.job_name).padEnd(32)} last_run=${r.last_run}  status=${r.status ?? '?'}  ${r.error ? 'ERROR: ' + String(r.error).slice(0, 120) : ''}`);
    }
  }
  console.log();

  // --- 2. cultural_scan_results — did scanner actually fetch? ---
  console.log('--- 2. cultural_scan_results ---');
  const { count: scanCount, error: scanCountErr } = await db
    .from('cultural_scan_results')
    .select('*', { count: 'exact', head: true });
  if (scanCountErr) {
    console.log('ERROR:', scanCountErr.message);
  } else {
    console.log(`Total rows: ${scanCount}`);
    const { data: scanLatest } = await db
      .from('cultural_scan_results')
      .select('id,niche,source,scan_date,post_count,created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    console.log('Most recent 5:');
    for (const r of scanLatest ?? []) {
      console.log(`  id=${r.id} niche=${r.niche} source=${r.source} scan_date=${r.scan_date} posts=${r.post_count} created_at=${r.created_at}`);
    }
    const { data: scanOldest } = await db
      .from('cultural_scan_results')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1);
    if (scanOldest?.[0]) console.log('Oldest created_at:', scanOldest[0].created_at);
  }
  console.log();

  // --- 3. detected_trends — did scanner synthesis write? ---
  console.log('--- 3. detected_trends ---');
  const { count: trendCount, error: trendCountErr } = await db
    .from('detected_trends')
    .select('*', { count: 'exact', head: true });
  if (trendCountErr) {
    console.log('ERROR:', trendCountErr.message);
  } else {
    console.log(`Total rows: ${trendCount}`);
    const { data: trendLatest } = await db
      .from('detected_trends')
      .select('id,niche,trend_summary,velocity_score,confidence,source_count,created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    console.log('Most recent 5:');
    for (const r of trendLatest ?? []) {
      console.log(`  id=${r.id} niche=${r.niche} vel=${r.velocity_score} conf=${r.confidence} srcN=${r.source_count} created_at=${r.created_at}`);
      console.log(`    summary: ${String(r.trend_summary).slice(0, 140)}`);
    }
  }
  console.log();

  // --- 4. cultural_events — classifier output (user said 7 rows) ---
  console.log('--- 4. cultural_events ---');
  const { count: eventCount, error: eventCountErr } = await db
    .from('cultural_events')
    .select('*', { count: 'exact', head: true });
  if (eventCountErr) {
    console.log('ERROR:', eventCountErr.message);
  } else {
    console.log(`Total rows: ${eventCount}`);
    const { data: evLatest } = await db
      .from('cultural_events')
      .select('id,niche,event_title,status,confidence,velocity_score,auto_approved,created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    console.log('Most recent 10:');
    for (const r of evLatest ?? []) {
      console.log(`  id=${r.id} niche=${r.niche} status=${r.status} auto=${r.auto_approved} conf=${r.confidence} vel=${r.velocity_score} at=${r.created_at}`);
      console.log(`    title: ${String(r.event_title).slice(0, 140)}`);
    }
  }
  console.log();

  // --- 5. atlas_accuracy_summary — feedback collector output ---
  console.log('--- 5. atlas_accuracy_summary (feedback collector summaries) ---');
  const { count: accCount, error: accCountErr } = await db
    .from('atlas_accuracy_summary')
    .select('*', { count: 'exact', head: true });
  if (accCountErr) {
    console.log('ERROR:', accCountErr.message);
  } else {
    console.log(`Total rows: ${accCount}`);
    const { data: accLatest } = await db
      .from('atlas_accuracy_summary')
      .select('id,period_start,period_end,niche,total_predictions,avg_delta,spearman_correlation,created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    for (const r of accLatest ?? []) {
      console.log(`  ${r.period_start}→${r.period_end} niche=${r.niche ?? '*'} N=${r.total_predictions} avgΔ=${r.avg_delta} ρ=${r.spearman_correlation} at=${r.created_at}`);
    }
  }
  console.log();

  // --- 6. prediction_log — feedback collector input pool ---
  console.log('--- 6. prediction_log feedback state ---');
  const { count: predTotal } = await db
    .from('prediction_log')
    .select('*', { count: 'exact', head: true });
  const { count: predCollected } = await db
    .from('prediction_log')
    .select('*', { count: 'exact', head: true })
    .eq('feedback_collected', true);
  const { count: predEligible } = await db
    .from('prediction_log')
    .select('*', { count: 'exact', head: true })
    .eq('feedback_collected', false)
    .lt('predicted_at', new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString());
  console.log(`prediction_log total: ${predTotal}`);
  console.log(`  feedback_collected=true: ${predCollected}`);
  console.log(`  eligible for collection (uncollected AND >7d old): ${predEligible}`);
  console.log();

  // --- 7. API key presence (local env on this machine) ---
  console.log('--- 7. env vars seen by this process ---');
  const envs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'GOOGLE_GEMINI_AI_API_KEY',
    'GOOGLE_AI_API_KEY',
    'CRON_SECRET',
  ];
  for (const e of envs) {
    const v = process.env[e];
    console.log(`  ${e.padEnd(30)} ${v ? `SET (len=${v.length})` : 'MISSING'}`);
  }
  console.log();
  console.log('=== DONE ===');
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
