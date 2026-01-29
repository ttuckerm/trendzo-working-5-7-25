import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { getCalibrationVersion } from '@/lib/calibration/calibration'
import { commonRateLimiters, KeyGenerators } from '@/lib/security/rate-limiter'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'

export async function GET(req: NextRequest) {
  // Auth (admin) + rate limit
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const limited = await commonRateLimiters.admin(req)
  if (limited) return limited

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const since30 = new Date(Date.now()-30*24*3600*1000).toISOString()
  let summary: any = { cohort_version: null, last_30d: { n: 0, auroc: 0, precision_at_100: 0, ece: 0 }, heated_excluded_30d: 0, computed_at: null }
  try {
    const ver = await getCalibrationVersion()
    summary.cohort_version = ver
  } catch {}
  try {
    const { data } = await db
      .from('accuracy_metrics')
      .select('n,auroc,precision_at_100,ece,computed_at,heated_excluded_count')
      .gte('computed_at', since30)
      .order('computed_at', { ascending: false })
      .limit(1)
    if (Array.isArray(data) && data.length) {
      const r: any = data[0]
      summary.last_30d = { n: r.n||0, auroc: r.auroc||0, precision_at_100: r.precision_at_100||0, ece: r.ece||0 }
      summary.heated_excluded_30d = r.heated_excluded_count||0
      summary.computed_at = r.computed_at||null
    }
  } catch {}
  return NextResponse.json(summary)
}


