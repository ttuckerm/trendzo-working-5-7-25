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
      .from('prediction_validation')
      .select('id,created_at,predicted_viral_probability,actual_viral_probability,prediction_factors')
      .gte('created_at', since30)
      .limit(100000)
    const rows = (data||[])
      .filter((r:any)=> typeof r.predicted_viral_probability==='number' && typeof r.actual_viral_probability==='number')
      .map((r:any)=> ({ id: r.id, created_at: r.created_at, err: Math.abs((r.predicted_viral_probability||0)-(r.actual_viral_probability||0)), factors: r.prediction_factors||{} }))
      .sort((a,b)=> b.err-a.err)
      .slice(0,100)
    return NextResponse.json({ rows })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message||'error' }, { status: 500 })
  }
}


