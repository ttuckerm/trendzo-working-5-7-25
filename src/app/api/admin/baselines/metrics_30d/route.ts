import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { commonRateLimiters } from '@/lib/security/rate-limiter'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'

export async function GET(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const limited = await commonRateLimiters.admin(req)
  if (limited) return limited
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const since30 = new Date(Date.now()-30*24*3600*1000).toISOString()
  try {
    const { data } = await db
      .from('accuracy_metrics')
      .select('auroc,precision_at_100,ece,computed_at')
      .gte('computed_at', since30)
      .order('computed_at', { ascending: true })
      .limit(10000)
    const rows = (data||[]).map((r:any)=> ({ date: String(r.computed_at||'').slice(0,10), auroc: r.auroc||0, precision_at_100: r.precision_at_100||0, ece: r.ece||0 }))
    return NextResponse.json({ rows })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message||'error' }, { status: 500 })
  }
}


