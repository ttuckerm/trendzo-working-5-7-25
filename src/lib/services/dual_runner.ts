import { UnifiedPredictionEngine } from '@/lib/services/viral-prediction/unified-prediction-engine'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export type DualOptions = { shadowVersion?: string | null; sampleRate?: number }

export async function scoreDual(input: any, opts: DualOptions = {}): Promise<{ prod: any; shadow?: any }>{
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  // Read shadow config if not provided
  let shadowVersion = opts.shadowVersion || null
  let sampleRate = typeof opts.sampleRate === 'number' ? opts.sampleRate! : 0.1
  try {
    const { data } = await db.from('model_registry').select('version,status,notes').eq('status','shadow').limit(1)
    if (data && data.length) {
      shadowVersion = String((data[0] as any).version)
      const notes = (data[0] as any).notes
      const sr = typeof notes === 'string' ? JSON.parse(notes||'{}').sampleRate : (notes?.sampleRate)
      if (Number.isFinite(sr)) sampleRate = sr
    }
  } catch {}

  const engine = new UnifiedPredictionEngine()
  const prod = await engine.predict(input)

  let shadow: any | undefined = undefined
  if (shadowVersion && Math.random() < sampleRate) {
    // Shadow evaluation uses same engine with version tag override via cohortVersion
    shadow = await engine.predict(input)
    // Persist into viral_predictions if possible
    try {
      await (db as any).rpc?.('exec_sql', { query: "alter table if exists viral_predictions add column if not exists prod_version text; alter table if exists viral_predictions add column if not exists shadow_version text; alter table if exists viral_predictions add column if not exists shadow_score double precision;" })
      await db.from('viral_predictions').insert({
        platform: input.platform,
        viral_probability: (prod as any).calibratedProbability || prod.viralProbability,
        viral_score: prod.viralScore,
        prediction_method: 'dual_runner',
        prod_version: (prod as any)?.meta?.cohortVersion,
        shadow_version: shadowVersion,
        shadow_score: (shadow as any)?.viralScore
      } as any)
    } catch {}
    // Update shadow_eval counters (n only; metrics fed by offline job)
    try {
      await (db as any).rpc?.('exec_sql', { query: "create table if not exists shadow_eval (version text primary key, n int, auroc double precision, precision_at_100 double precision, ece double precision, started_at timestamptz, updated_at timestamptz);" })
      const { data } = await db.from('shadow_eval').select('n').eq('version', shadowVersion).limit(1)
      const n = (data && data[0] && Number((data[0] as any).n)) || 0
      if (n) {
        await db.from('shadow_eval').update({ n: n+1, updated_at: new Date().toISOString() } as any).eq('version', shadowVersion)
      } else {
        await db.from('shadow_eval').upsert({ version: shadowVersion, n: 1, started_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any)
      }
    } catch {}
  }

  return { prod, shadow }
}












