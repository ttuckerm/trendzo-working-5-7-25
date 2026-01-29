import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function ensureCreatorTables(): Promise<void> {
  const sql = `
    create table if not exists creator_profiles (
      creator_id text primary key,
      niche text,
      follower_band text,
      style_embedding double precision[],
      baseline_completion numeric,
      baseline_share_rate numeric,
      updated_at timestamptz
    );
    create table if not exists creator_token_coeffs (
      creator_id text,
      token text,
      coeff numeric,
      support int,
      updated_at timestamptz,
      primary key(creator_id, token)
    );
  `
  try { await (db as any).rpc('exec_sql', { query: sql }) } catch {}
}

function textToEmbedding32(texts: string[]): number[] {
  const size = 32
  const vec = new Array(size).fill(0)
  const all = texts.join(' ').toLowerCase()
  for (let i=0; i<all.length; i++) {
    const code = all.charCodeAt(i)
    const idx = (code * 2654435761 >>> 0) % size
    vec[idx] += 1
  }
  const norm = Math.sqrt(vec.reduce((a,b)=>a + b*b, 0)) || 1
  return vec.map(v=> Number((v / norm).toFixed(6)))
}

function bandFollowers(n: number): string {
  if (n < 1_000) return '<1k'
  if (n < 10_000) return '1k-10k'
  if (n < 100_000) return '10k-100k'
  if (n < 1_000_000) return '100k-1M'
  return '1M+'
}

export async function rebuildCreatorProfile(creatorId: string): Promise<{ ok: boolean }> {
  await ensureCreatorTables()
  // Pull creator metadata
  let niche = 'general'
  let follower_band = '10k-100k'
  try {
    const { data } = await db.from('videos').select('creator_followers,niche').eq('creator_id', creatorId).order('created_at', { ascending: false }).limit(1)
    if (data && data.length) {
      const f = Number((data[0] as any).creator_followers || 50000)
      follower_band = bandFollowers(f)
      if ((data[0] as any).niche) niche = (data[0] as any).niche
    }
  } catch {}

  // Gather recent captions/tokens for embedding
  let texts: string[] = []
  try {
    const { data } = await db.from('videos').select('caption,hashtags').eq('creator_id', creatorId).gte('created_at', new Date(Date.now()-90*24*3600*1000).toISOString()).limit(200)
    texts = (data||[]).flatMap((r:any)=> [r.caption||'', ...(r.hashtags||[])])
  } catch {}
  const embedding = textToEmbedding32(texts)

  // Estimate baselines from prediction_validation
  let baseline_completion = 0.35
  let baseline_share_rate = 0.06
  try {
    const { data } = await db.from('prediction_validation').select('prediction_factors').gte('created_at', new Date(Date.now()-90*24*3600*1000).toISOString()).limit(1000)
    const vals = (data||[]).map((r:any)=> r.prediction_factors || {})
    const completions = vals.map((v:any)=> Number(v?.completion_rate || 0)).filter((x:number)=> x>0)
    const shares = vals.map((v:any)=> Number(v?.share_rate || 0)).filter((x:number)=> x>0)
    if (completions.length) baseline_completion = completions.reduce((a:number,b:number)=>a+b,0)/completions.length
    if (shares.length) baseline_share_rate = shares.reduce((a:number,b:number)=>a+b,0)/shares.length
  } catch {}

  // Learn per-token coeffs (smoothed lift; shrinkage by support)
  const tokenCounts = new Map<string, { sumLift: number, count: number }>()
  try {
    const { data } = await db.from('viral_predictions').select('prediction_factors').gte('created_at', new Date(Date.now()-90*24*3600*1000).toISOString()).eq('prediction_method','unified_prediction_engine')
    for (const row of (data||[])) {
      const f = (row as any).prediction_factors || {}
      const tokens: string[] = f?.input?.frameworkScores?.tokens || []
      const lift = Number((f?.breakdown?.frameworkContribution || 0))
      for (const t of tokens) {
        const rec = tokenCounts.get(t) || { sumLift: 0, count: 0 }
        rec.sumLift += lift
        rec.count += 1
        tokenCounts.set(t, rec)
      }
    }
  } catch {}
  const coeffRows: any[] = []
  for (const [token, rec] of tokenCounts.entries()) {
    const support = rec.count
    const meanLift = support > 0 ? rec.sumLift / support : 0
    const shrink = Math.min(1, support / 20) // shrinkage toward 0
    const coeff = Number((meanLift * shrink).toFixed(4))
    if (support >= 2) coeffRows.push({ creator_id: creatorId, token, coeff, support, updated_at: new Date().toISOString() })
  }

  // Cold-start: no history
  if (coeffRows.length === 0) {
    // Simple priors: neutral coeffs for common tokens
    for (const t of ['hook','story','before_after','pov']) {
      coeffRows.push({ creator_id: creatorId, token: t, coeff: 0.02, support: 1, updated_at: new Date().toISOString() })
    }
  }

  await db.from('creator_profiles').upsert({ creator_id: creatorId, niche, follower_band, style_embedding: embedding, baseline_completion, baseline_share_rate, updated_at: new Date().toISOString() } as any)
  if (coeffRows.length) await db.from('creator_token_coeffs').upsert(coeffRows as any)
  return { ok: true }
}

export async function getCreatorProfile(creatorId: string): Promise<any> {
  await ensureCreatorTables()
  const { data: prof } = await db.from('creator_profiles').select('*').eq('creator_id', creatorId).limit(1)
  const { data: coeffs } = await db.from('creator_token_coeffs').select('token,coeff,support').eq('creator_id', creatorId).order('coeff', { ascending: false }).limit(20)
  return { profile: prof?.[0] || null, coeffs: coeffs || [] }
}


