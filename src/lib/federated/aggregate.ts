import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { putJson } from '@/lib/storage/object_store'

function l2Clip(delta: Record<string, number>, clipNorm: number): Record<string, number> {
  const vals = Object.values(delta)
  const norm = Math.sqrt(vals.reduce((a,b)=> a + b*b, 0))
  if (norm <= clipNorm) return delta
  const scale = clipNorm / (norm || 1)
  const out: Record<string, number> = {}
  for (const [k,v] of Object.entries(delta)) out[k] = v * scale
  return out
}

function addNoise(delta: Record<string, number>, sigma: number): Record<string, number> {
  if (!sigma || sigma<=0) return delta
  const out: Record<string, number> = {}
  for (const [k,v] of Object.entries(delta)) out[k] = v + gaussian(0, sigma)
  return out
}

function gaussian(mu: number, sigma: number): number { // Box-Muller
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return sigma * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) + mu
}

export async function aggregateRound(roundId: string): Promise<{ participants: number; artifact_url?: string; model_version?: string }> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: roundRows } = await db.from('federated_rounds').select('*').eq('round_id', roundId).limit(1)
  const round:any = (roundRows||[])[0]
  if (!round) throw new Error('round_not_found')
  const { data: updates } = await db.from('federated_updates').select('*').eq('round_id', roundId).eq('accepted', true)
  const ups: any[] = updates || []
  if (ups.length < Number(round.min_participants||5)) throw new Error('min_participants')
  // Weighted average of clipped deltas
  const keys = new Set<string>()
  ups.forEach(u=> Object.keys(u.weights_delta||{}).forEach((k:string)=> keys.add(k)))
  const sum: Record<string, number> = {}
  let nTot = 0
  for (const u of ups) {
    const clipped = l2Clip(u.weights_delta||{}, Number(round.clip_norm||1))
    const w = Math.max(1, Number(u.n_examples||1))
    nTot += w
    for (const k of keys) sum[k] = (sum[k]||0) + w * Number(clipped[k]||0)
  }
  const avg: Record<string, number> = {}
  for (const k of keys) avg[k] = (sum[k]||0) / Math.max(1, nTot)
  const noisy = addNoise(avg, Number(round.dp_sigma||0))
  // Load previous model
  let base: Record<string, number> = {}
  try { const { data } = await db.from('global_personalization_models').select('weights').eq('model_version', round.model_version).limit(1); base = (data||[])[0]?.weights || {} } catch {}
  const updated: Record<string, number> = { ...base }
  for (const [k,v] of Object.entries(noisy)) updated[k] = (updated[k]||0) + v
  const checksum = String(Object.values(updated).slice(0,100).reduce((a,b)=> a + Number(b), 0))
  const newVersion = bumpVersion(round.model_version)
  await db.from('global_personalization_models').upsert({ model_version: newVersion, weights: updated, baseline_version: round.model_version, checksum } as any)
  const stored = await putJson('evidence', { round: roundId, newVersion, weights_delta: noisy, participants: ups.length })
  await db.from('federated_rounds').update({ status: 'finalized', finalized_at: new Date().toISOString(), artifact_url: stored.url, model_version: newVersion } as any).eq('round_id', roundId)
  return { participants: ups.length, artifact_url: stored.url || null, model_version: newVersion }
}

function bumpVersion(v: string): string { const m = v.match(/(.*_r)(\d+)$/); if (m) return `${m[1]}${Number(m[2])+1}`; return v + '_r2' }


