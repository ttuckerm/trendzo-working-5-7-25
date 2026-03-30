import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'
import { commonRateLimiters } from '@/lib/security/rate-limiter'
import { putText } from '@/lib/storage/object_store'

function precisionAtK(yTrue: number[], yScore: number[], k: number): number {
  const idx = yScore.map((s, i) => i).sort((a, b) => yScore[b] - yScore[a])
  const top = idx.slice(0, Math.min(k, yScore.length))
  const hits = top.reduce((s, i) => s + (yTrue[i] ? 1 : 0), 0)
  return yScore.length ? hits / top.length : 0
}

function expectedCalibrationError(yTrue: number[], yProb: number[], bins = 10): number {
  const edges = Array.from({ length: bins + 1 }, (_, i) => i / bins)
  const buckets: { n: number; avgP: number; avgY: number }[] = Array.from({ length: bins }, () => ({ n: 0, avgP: 0, avgY: 0 }))
  for (let i = 0; i < yProb.length; i++) {
    const p = Math.max(0, Math.min(1, yProb[i] || 0))
    const b = Math.min(bins - 1, Math.max(0, edges.findIndex(e => p <= e) - 1))
    const bucket = buckets[b]
    bucket.n += 1
    bucket.avgP += p
    bucket.avgY += yTrue[i] ? 1 : 0
  }
  let ece = 0, total = 0
  buckets.forEach(b => {
    if (!b.n) return
    const ap = b.avgP / b.n
    const ay = b.avgY / b.n
    ece += b.n * Math.abs(ap - ay)
    total += b.n
  })
  return total ? ece / total : 0
}

export async function GET(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const limited = await commonRateLimiters.admin(req)
  if (limited) return limited

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  const wantCsv = new URL(req.url).searchParams.get('csv') === '1'

  try {
    // Pull validated rows in last 48h, excluding heated_flag when present
    const { data } = await db
      .from('prediction_validation')
      .select('platform,niche,predicted_viral_probability,label_viral,heated_flag,created_at')
      .gte('created_at', since)
      .limit(100000)
    const rows = (data || []).filter((r: any) => !r.heated_flag && typeof r.predicted_viral_probability === 'number' && (typeof r.label_viral === 'boolean' || r.label_viral === 0 || r.label_viral === 1))
    const y = rows.map((r: any) => (r.label_viral ? 1 : 0))
    const p = rows.map((r: any) => Number(r.predicted_viral_probability))

    // AUROC via Mann–Whitney U
    const pos = p.filter((_: any, i: number) => y[i] === 1), neg = p.filter((_: any, i: number) => y[i] === 0)
    let conc = 0, pairs = pos.length * neg.length
    pos.forEach((pv: any) => neg.forEach((nv: any) => { if (pv > nv) conc++; else if (pv === nv) conc += 0.5 }))
    const auroc = pairs ? conc / pairs : 0.5
    const pAt100 = precisionAtK(y, p, 100)
    const ece = expectedCalibrationError(y, p, 10)
    const accuracy = rows.length ? rows.reduce((s: number, r: any) => s + ((Number(r.predicted_viral_probability) >= 0.5) === !!r.label_viral ? 1 : 0), 0) / rows.length : 0

    // Groupings
    const by_platform: Record<string, number> = {}
    const by_niche: Record<string, number> = {}
    for (const r of rows) {
      const plat = r.platform || 'tiktok'
      const niche = r.niche || 'general'
      by_platform[plat] = (by_platform[plat] || 0) + 1
      by_niche[niche] = (by_niche[niche] || 0) + 1
    }

    let csv_url: string | null = null
    if (wantCsv) {
      const header = 'created_at,predicted_viral_probability,label_viral,platform,niche\n'
      const csvBody = rows.map((r: any) => [r.created_at, r.predicted_viral_probability, r.label_viral, r.platform || 'tiktok', r.niche || 'general'].join(',')).join('\n')
      const saved = await putText('proof', header + csvBody, { filename: `validation_48h_${Date.now()}.csv`, contentType: 'text/csv' })
      csv_url = saved.url
    }

    // Update status counters best-effort
    try {
      await (db as any).rpc?.('exec_sql', { query: "create table if not exists accuracy_48h_status (id int primary key default 1, last_computed_at timestamptz, n int);" })
      await db.from('accuracy_48h_status').upsert({ id: 1, last_computed_at: new Date().toISOString(), n: rows.length } as any)
    } catch {}

    return NextResponse.json({ n: rows.length, accuracy, auroc, precision_at_100: pAt100, ece, by_platform, by_niche, csv_url })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
  }
}


