import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export type UpliftMetric = 'completion' | 'shares'

export async function getDb() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

export async function ensureExperimentTables() {
  const db = await getDb()
  const ddl = `
  create table if not exists experiments (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    is_active boolean default true,
    created_at timestamptz not null default now()
  );
  create table if not exists experiment_arms (
    id uuid default gen_random_uuid() primary key,
    experiment_id uuid references experiments(id) on delete cascade,
    name text not null,
    weight double precision not null default 0.5,
    is_control boolean default false,
    edits_json jsonb
  );
  create table if not exists assignments (
    id bigserial primary key,
    created_at timestamptz not null default now(),
    experiment_id uuid references experiments(id) on delete cascade,
    arm_id uuid references experiment_arms(id) on delete cascade,
    subject_id text,
    propensity double precision,
    context jsonb
  );
  create table if not exists outcomes (
    id bigserial primary key,
    created_at timestamptz not null default now(),
    experiment_id uuid references experiments(id) on delete cascade,
    arm_id uuid references experiment_arms(id) on delete cascade,
    subject_id text,
    metric text not null,
    value double precision not null
  );
  create table if not exists treatment_effects (
    id bigserial primary key,
    created_at timestamptz not null default now(),
    experiment_id uuid references experiments(id) on delete cascade,
    arm_id uuid references experiment_arms(id) on delete cascade,
    metric text not null,
    method text not null,
    effect double precision not null,
    ci_low double precision,
    ci_high double precision,
    n_t int,
    n_c int,
    computed_at timestamptz not null default now()
  );`
  try { await (db as any).rpc?.('exec_sql', { query: ddl }) } catch {}
}

export async function assignArm(experimentId: string, subjectId: string | null, context: any = {}) {
  await ensureExperimentTables()
  const db = await getDb()
  const { data: arms } = await db.from('experiment_arms').select('id,name,weight,edits_json').eq('experiment_id', experimentId)
  if (!arms || arms.length === 0) throw new Error('no_arms')
  const weights = arms.map(a => Number(a.weight || 0))
  const total = weights.reduce((s,v)=>s+v,0) || arms.length
  const probs = weights.map(w => (w>0?w:1/arms.length) / total)
  let r = Math.random(), idx = 0
  for (let i=0;i<probs.length;i++){ r -= probs[i]; if (r<=0){ idx=i; break } }
  const chosen = arms[Math.min(idx, arms.length-1)]
  const propensity = probs[Math.min(idx, probs.length-1)]
  try { await db.from('assignments').insert({ experiment_id: experimentId, arm_id: chosen.id, subject_id: subjectId, propensity, context } as any) } catch {}
  return { experiment_id: experimentId, arm_id: chosen.id, edits_json: chosen.edits_json || {} }
}

function weightedMean(values: number[], weights: number[]) {
  const sw = weights.reduce((a,b)=>a+b,0)
  if (sw === 0) return { mean: 0, sw: 0 }
  const m = values.reduce((s,v,i)=> s + v*weights[i], 0) / sw
  return { mean: m, sw }
}

function weightedVariance(values: number[], weights: number[], mean: number) {
  const sw = weights.reduce((a,b)=>a+b,0)
  if (sw === 0) return 0
  const varNum = values.reduce((s,v,i)=> s + weights[i] * Math.pow(v-mean,2), 0)
  return varNum / sw
}

export async function computeUpliftIPW(experimentId: string, metrics: UpliftMetric[] = ['completion','shares']) {
  await ensureExperimentTables()
  const db = await getDb()
  // arms and control
  const { data: arms } = await db.from('experiment_arms').select('id,is_control,weight').eq('experiment_id', experimentId)
  if (!arms || arms.length === 0) return { ok: false, effects: 0 }
  const control = arms.find(a => (a as any).is_control) || arms[0]
  let effectsWritten = 0
  for (const metric of metrics) {
    // fetch assignments and outcomes joined (best-effort via two selects)
    const { data: asg } = await db.from('assignments').select('subject_id,arm_id,propensity').eq('experiment_id', experimentId).limit(10000)
    const { data: out } = await db.from('outcomes').select('subject_id,arm_id,value,metric').eq('experiment_id', experimentId).eq('metric', metric).limit(10000)
    if (!asg || !out) continue
    const byArm: Record<string, { values: number[]; weights: number[]; n: number }> = {}
    const ctrlVals: number[] = []
    const ctrlW: number[] = []
    let nCtrl = 0
    for (const o of out as any[]) {
      const a = (asg as any[]).find(x => x.subject_id === o.subject_id && x.arm_id === o.arm_id)
      if (!a) continue
      const armId = String(o.arm_id)
      const isCtrl = armId === String((control as any).id)
      const p = Math.max(1e-6, Number(a.propensity || 0.5))
      const w = isCtrl ? 1 / Math.max(1e-6, Number((arms.find(ar=> String((ar as any).id)===armId) as any)?.weight || p)) : 1 / p
      if (isCtrl) { ctrlVals.push(Number(o.value)); ctrlW.push(w); nCtrl++ }
      if (!byArm[armId]) byArm[armId] = { values: [], weights: [], n: 0 }
      byArm[armId].values.push(Number(o.value)); byArm[armId].weights.push(w); byArm[armId].n++
    }
    const { mean: meanC } = weightedMean(ctrlVals, ctrlW)
    const varC = weightedVariance(ctrlVals, ctrlW, meanC)
    for (const [armId, bucket] of Object.entries(byArm)) {
      if (armId === String((control as any).id)) continue
      const { mean: meanT } = weightedMean(bucket.values, bucket.weights)
      const varT = weightedVariance(bucket.values, bucket.weights, meanT)
      const effect = meanT - meanC
      // approximate standard error
      const seT = Math.sqrt(varT / Math.max(1, bucket.weights.reduce((a,b)=>a+b,0)))
      const seC = Math.sqrt(varC / Math.max(1, ctrlW.reduce((a,b)=>a+b,0)))
      const se = Math.sqrt(seT*seT + seC*seC)
      const ciLow = effect - 1.96 * se
      const ciHigh = effect + 1.96 * se
      try {
        await db.from('treatment_effects').insert({
          experiment_id: experimentId,
          arm_id: armId,
          metric,
          method: 'IPW',
          effect,
          ci_low: ciLow,
          ci_high: ciHigh,
          n_t: bucket.n || 0,
          n_c: nCtrl || 0,
          computed_at: new Date().toISOString()
        } as any)
        effectsWritten++
      } catch {}
    }
  }
  // update status marker
  try {
    await (await getDb()).from('integration_job_runs').upsert({ job: 'uplift_compute', last_run: new Date().toISOString() } as any)
  } catch {}
  return { ok: true, effects: effectsWritten }
}








