import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { verifyAdminAuth } from '@/lib/utils/adminAuth'

export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req)
  if (!auth.success) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const window = searchParams.get('window') || '7d'
  const platform = searchParams.get('platform') || 'TT'
  const niche = searchParams.get('niche') || 'ALL'
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const now = new Date()
  const end = now.toISOString()
  const start = new Date(now.getTime() - (window === '24h' ? 24 : window === '30d' ? 30*24 : 7*24) * 3600 * 1000).toISOString()
  const { data: latest } = await db
    .from('feature_importance_history')
    .select('*')
    .gte('window_start', start)
    .lte('window_end', end)
    .eq('platform', platform)
    .eq('niche', niche)
    .order('window_end', { ascending: false })
    .limit(100)
  const latestByFeature: Record<string, any> = {}
  for (const r of (latest||[])) { const f=(r as any).feature; if (!latestByFeature[f]) latestByFeature[f]=r }
  // Baseline 30d
  const since30 = new Date(now.getTime() - 30*24*3600*1000).toISOString()
  const { data: baselineRows } = await db
    .from('feature_importance_history')
    .select('feature,delta_prob_mean')
    .gte('window_start', since30)
    .lte('window_end', end)
    .eq('platform', platform)
    .eq('niche', niche)
  const groups: Record<string, number[]> = {}
  for (const r of (baselineRows||[])) { const f = (r as any).feature; if (!groups[f]) groups[f]=[]; groups[f].push(Number((r as any).delta_prob_mean||0)) }
  const baselineMean: Record<string, number> = {}
  for (const [f, arr] of Object.entries(groups)) baselineMean[f] = arr.reduce((a,b)=>a+b,0)/Math.max(1, arr.length)

  const features = Object.keys(latestByFeature)
  const latestSorted = features.slice().sort((a,b)=> Number(latestByFeature[b].delta_prob_mean||0) - Number(latestByFeature[a].delta_prob_mean||0))

  const data = features.map(f => {
    const latestRow = latestByFeature[f]
    const latestMean = Number(latestRow?.delta_prob_mean || 0)
    const base = baselineMean[f] || 0
    const abs_change = latestMean - base
    const rel_change = base ? abs_change / base : 0
    const rank_shift = 0 // compute if needed with stored ranks
    return {
      feature: f,
      latest: { delta_prob_mean: latestMean, delta_auroc: latestRow?.delta_auroc ?? null, n_samples: latestRow?.n_samples ?? 0 },
      baseline: { delta_prob_mean: base },
      deltas: { abs_change, rel_change, rank_shift }
    }
  })

  return NextResponse.json({ window, platform, niche, data: data.sort((a,b)=> b.latest.delta_prob_mean - a.latest.delta_prob_mean).slice(0, 20) })
}


