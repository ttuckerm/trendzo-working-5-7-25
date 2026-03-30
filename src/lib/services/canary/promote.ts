import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function promoteIfBetter(): Promise<{ decision: 'promote'|'hold'; details: any }>{
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  // Read prod model version from model_registry
  let prodVersion: string | null = null
  try {
    const { data } = await db.from('model_registry').select('version').eq('status','prod').limit(1)
    prodVersion = data?.[0]?.version || null
  } catch {}
  // Read shadow stats
  const { data: sh } = await db.from('shadow_eval').select('*').order('updated_at', { ascending: false }).limit(1)
  const shadow = sh?.[0]
  if (!shadow || !prodVersion) return { decision: 'hold', details: { reason: 'missing_context' } }
  // Read latest accuracy_metrics row for prod
  const { data: am } = await db.from('accuracy_metrics').select('*').order('computed_at', { ascending: false }).limit(1)
  const prod = am?.[0]
  if (!prod) return { decision: 'hold', details: { reason: 'no_prod_metrics' } }
  const aurocDelta = Number(shadow.auroc||0) - Number(prod.auroc||0)
  const pAtDelta = Number(shadow.precision_at_100||0) - Number(prod.precision_at_100||0)
  const n = Number(shadow.n||0)
  const promote = n >= 500 && aurocDelta >= 0.02 && pAtDelta >= 0.05
  if (promote) {
    try {
      await db.from('model_registry').upsert({ version: shadow.version, status: 'prod', notes: 'promoted by canary' } as any)
      await db.from('model_registry').upsert({ version: prodVersion, status: 'shadow' } as any)
      await (db as any).rpc?.('exec_sql', { query: "create table if not exists promotions_log (ts timestamptz default now(), from_version text, to_version text);" })
      await db.from('promotions_log').insert({ from_version: prodVersion, to_version: shadow.version } as any)
    } catch {}
    return { decision: 'promote', details: { aurocDelta, pAtDelta, n } }
  }
  return { decision: 'hold', details: { aurocDelta, pAtDelta, n } }
}












