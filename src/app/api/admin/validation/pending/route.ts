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
  try {
    const { data } = await db
      .from('prediction_validation')
      .select('id,created_at,predicted_viral_probability,prediction_factors')
      .eq('validation_status','pending')
      .order('created_at', { ascending: false })
      .limit(200)
    const out = (data||[]).map((r:any)=>({
      id: r.id,
      created_at: r.created_at,
      age_minutes: Math.round((Date.now()-new Date(r.created_at).getTime())/60000),
      predicted_viral_probability: r.predicted_viral_probability,
      incubation_label: (r.prediction_factors||{}).incubation_label || null
    }))
    return NextResponse.json({ rows: out })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message||'error' }, { status: 500 })
  }
}


