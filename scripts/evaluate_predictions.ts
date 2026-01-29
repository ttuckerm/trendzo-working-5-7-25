import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, logSupabaseRuntimeEnv } from '../src/lib/env';
import { promises as fs } from 'fs';
import * as path from 'path';
import { makeTimeSplit, assertNoCreatorOverlap, nearDuplicateHash, assertNoNearDupes, forbidFutureFeatures } from '../src/lib/validation/anti_leakage'

function precisionAtK(yTrue: number[], yScore: number[], k: number) {
  const idx = yScore.map((s,i)=>[s,i]).sort((a,b)=>b[0]-a[0]).slice(0,k).map(x=>x[1]);
  const hits = idx.reduce((acc,i)=>acc + (yTrue[i]===1 ? 1 : 0), 0);
  return hits / Math.max(1,k);
}

function expectedCalibrationError(yTrue: number[], yProb: number[], bins = 10) {
  const bucket = Array.from({length: bins},()=>({n:0, p:0, y:0}));
  yProb.forEach((p,i)=>{ const b = Math.min(bins-1, Math.floor(p*bins)); const slot=bucket[b]; slot.n++; slot.p+=p; slot.y+=yTrue[i]; });
  let ece = 0, total = 0;
  bucket.forEach(b => { if (b.n>0){ const avgP=b.p/b.n, avgY=b.y/b.n; ece += b.n*Math.abs(avgP-avgY); total += b.n; } });
  return total ? ece/total : 0;
}

(async () => {
  logSupabaseRuntimeEnv();
  const MOCK_DB = process.env.MOCK_DB === 'true' || !SUPABASE_URL || !SUPABASE_SERVICE_KEY;
  let allRows: any[] = [];

  if (!MOCK_DB) {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const sinceIso = new Date(Date.now()-30*24*3600*1000).toISOString()
    const { data, error } = await db
      .from('prediction_validation')
      .select('video_id,predicted_viral_probability,label_viral,created_at,model_version,cohort_week,heated_flag,creator_id,caption,frame_hash,feature_ts_24h,feature_ts_48h,feature_ts_72h')
      .eq('validation_status','validated')
      .gte('created_at', sinceIso);
    if (error) throw error;
    allRows = data || [];
    // Fetch quality-flagged video_ids to exclude from eval
    let flaggedVideoIds = new Set<string>()
    try {
      const { data: qf } = await db.from('quality_flags').select('video_id').gte('ts', sinceIso)
      if (Array.isArray(qf)) {
        for (const r of qf as any[]) { if (r.video_id) flaggedVideoIds.add(String(r.video_id)) }
      }
    } catch {}
    ;(allRows as any).forEach((r:any)=>{ if (flaggedVideoIds.has(String(r.video_id))) (r as any).quality_flagged = true })
  } else {
    // Read from local seed file if provided
    const seedPath = process.env.PREDICTION_VALIDATION_PATH || path.join(process.cwd(), 'tmp', 'prediction_validation.json');
    try {
      const buf = await fs.readFile(seedPath, 'utf-8');
      allRows = JSON.parse(buf);
    } catch {
      allRows = [];
    }
  }
  const heatedExcludedCount = allRows.filter(r => (r as any).heated_flag).length;
  const qualityExcludedCount = allRows.filter(r => (r as any).quality_flagged).length
  // Exclude rows with quality flags (anti-gaming)
  const rows = allRows.filter(r => !(r as any).heated_flag).filter(r => !(r as any).quality_flagged);
  if (!rows.length) { console.log(JSON.stringify({n:0})); return; }

  // === Anti‑leakage guards ===
  const cutoffISO = new Date(Date.now() - 48*3600*1000).toISOString()
  const withinWindow = makeTimeSplit(cutoffISO)
  const timeFiltered = rows.filter(r => withinWindow({ event_time: r.created_at }))
  if (!timeFiltered.length) { console.error('LEAKAGE CHECK: no rows within 48h window'); process.exit(2) }

  // Optional: derive cohorts if train/val/test available; otherwise treat whole set as eval
  const evalRows = timeFiltered
  // Creator overlap guard (if historical train creators available, this would compare; here we self-check duplicates as a proxy)
  try {
    const creators = evalRows.map(r => String(r.creator_id||''))
    // Compare first half vs second half as a simple split proxy when no explicit cohorts
    const mid = Math.floor(creators.length/2)
    assertNoCreatorOverlap(creators.slice(0, mid), creators.slice(mid))
  } catch (e:any) {
    console.error(String(e?.message||e))
    process.exit(2)
  }

  // Near-duplicate guard using caption+frameHash if available
  try {
    const hashes = evalRows.map(r => nearDuplicateHash({ caption: r.caption, frameHash: r.frame_hash }))
    const mid = Math.floor(hashes.length/2)
    assertNoNearDupes(hashes.slice(0, mid), hashes.slice(mid))
  } catch (e:any) {
    console.error(String(e?.message||e))
    process.exit(2)
  }

  // Future feature guard: for each row, ensure no 72h features are used for 48h evaluation
  let futureFeatureViolations = 0
  for (const r of evalRows) {
    try {
      forbidFutureFeatures({
        event_time: r.created_at,
        feature_ts_24h: r.feature_ts_24h,
        feature_ts_48h: r.feature_ts_48h,
        feature_ts_72h: r.feature_ts_72h
      }, 48)
    } catch {
      futureFeatureViolations++
    }
  }
  if (futureFeatureViolations > 0) {
    console.error(`LEAKAGE: future features detected in ${futureFeatureViolations} rows (beyond 48h horizon)`)
    process.exit(2)
  }

  // Remove simulation from evaluation: count only rows that have real actuals
  // If label_viral is null/undefined, treat as missing actual; exclude from metrics but compute coverage.
  const coverageDenom = evalRows.length
  const available = evalRows.filter(r => r.label_viral === 1 || r.label_viral === 0)
  const coverage_of_real_actuals = coverageDenom ? (available.length / coverageDenom) : 0
  if (coverage_of_real_actuals < 0.6) {
    console.warn(`WARNING: coverage_of_real_actuals below 0.60 (${(coverage_of_real_actuals*100).toFixed(1)}%)`)
  }
  const rowsForEval = available
  const yTrue = rowsForEval.map(r => r.label_viral ? 1 : 0);
  const yScore = rowsForEval.map(r => r.predicted_viral_probability);

  // AUROC via Mann–Whitney
  const pos = yScore.filter((_,i)=>yTrue[i]===1), neg = yScore.filter((_,i)=>yTrue[i]===0);
  let conc=0, pairs=pos.length*neg.length;
  pos.forEach(p=>neg.forEach(n=>{ if (p>n) conc++; else if (p===n) conc+=0.5; }));
  const auroc = pairs ? conc/pairs : 0.5;

  const pAt100 = precisionAtK(yTrue, yScore, 100);
  const ece = expectedCalibrationError(yTrue, yScore, 10);

  if (!MOCK_DB) {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    try {
      await (db as any).rpc?.('exec_sql', { query: "create table if not exists accuracy_metrics (id bigserial primary key, computed_at timestamptz not null, model_version text not null, n int not null, auroc double precision not null, precision_at_100 double precision not null, ece double precision not null, heated_excluded_count int default 0, quality_excluded_count int default 0, feature_quality_excluded_count int default 0, coverage_of_real_actuals double precision default 0, leakage_checks jsonb default '{}'::jsonb);" });
    } catch {}
    try { await (db as any).rpc?.('exec_sql', { query: "alter table if exists accuracy_metrics add column if not exists quality_excluded_count int default 0;" }) } catch {}
    try { await (db as any).rpc?.('exec_sql', { query: "alter table if exists accuracy_metrics add column if not exists feature_quality_excluded_count int default 0;" }) } catch {}
    try { await (db as any).rpc?.('exec_sql', { query: "alter table if exists accuracy_metrics add column if not exists coverage_of_real_actuals double precision default 0;" }) } catch {}
    try { await (db as any).rpc?.('exec_sql', { query: "alter table if exists accuracy_metrics add column if not exists leakage_checks jsonb default '{}'::jsonb;" }) } catch {}
    await db.from('accuracy_metrics').insert({
      n: rowsForEval.length, auroc, precision_at_100: pAt100, ece,
      model_version: rowsForEval[0]?.model_version || 'unknown', computed_at: new Date().toISOString(),
      heated_excluded_count: heatedExcludedCount,
      quality_excluded_count: qualityExcludedCount,
      feature_quality_excluded_count: 0,
      coverage_of_real_actuals,
      leakage_checks: { creatorOverlap: 0, futureFeatures: 0, nearDupes: 0 }
    });
  }

  console.log(JSON.stringify({ n: rowsForEval.length, auroc, precision_at_100: pAt100, ece, heated_excluded_count: heatedExcludedCount, quality_excluded_count: qualityExcludedCount, coverage_of_real_actuals, leakage_checks: { creatorOverlap: 0, futureFeatures: 0, nearDupes: 0 } }, null, 2));
})();


