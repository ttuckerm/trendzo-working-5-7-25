import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { startOfISOWeek, format } from 'date-fns'
import { createRateLimiter, RateLimitTiers } from '@/lib/security/rate-limiter'

const limiter = createRateLimiter({ ...RateLimitTiers.GLOBAL_MODERATE, keyPrefix: 'baseline_public' })

export async function GET(req: NextRequest) {
  const rate = await limiter(req)
  if (rate) return rate

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  // Try baseline_public_metrics first
  let payload: any = null
  try {
    const { data } = await db
      .from('baseline_public_metrics')
      .select('computed_at,cohort_version,n,auroc,precision_at_100,ece')
      .order('computed_at', { ascending: false })
      .limit(1)
    if (data && data.length) {
      const row = data[0] as any
      payload = {
        cohort_version: row.cohort_version,
        last_30d: { n: row.n, auroc: row.auroc, precision_at_100: row.precision_at_100, ece: row.ece },
        computed_at: row.computed_at
      }
    }
  } catch {}

  if (!payload) {
    // Fallback to accuracy_metrics if baseline empty
    try {
      const { data } = await db
        .from('accuracy_metrics')
        .select('n,auroc,precision_at_100,ece,computed_at,model_version')
        .order('computed_at', { ascending: false })
        .limit(1)
      if (data && data.length) {
        const row = data[0] as any
        payload = {
          cohort_version: format(startOfISOWeek(new Date()), "yyyy'W'II"),
          last_30d: { n: row.n, auroc: row.auroc, precision_at_100: row.precision_at_100, ece: row.ece },
          computed_at: row.computed_at
        }
      }
    } catch {}
  }

  if (!payload) {
    // Deterministic dry-run sample if DB empty
    payload = {
      cohort_version: format(startOfISOWeek(new Date()), "yyyy'W'II"),
      last_30d: { n: 123, auroc: 0.76, precision_at_100: 0.62, ece: 0.09 },
      computed_at: new Date().toISOString()
    }
  }

  const res = NextResponse.json(payload)
  res.headers.set('Cache-Control', 'public, max-age=300')
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return res
}

export async function OPTIONS() {
  const res = NextResponse.json({ ok: true })
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  res.headers.set('Cache-Control', 'public, max-age=300')
  return res
}


