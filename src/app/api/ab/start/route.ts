import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/server-auth'
import { commonRateLimiters } from '@/lib/security/rate-limiter'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function POST(req: NextRequest) {
  const rl = await commonRateLimiters.admin(req)
  if (rl) return rl
  const guard = await requireRole(req, ['chairman', 'sub_admin'])
  if (guard) return guard
  try {
    const body = await req.json().catch(()=>({})) as any
    const id = `ab_${Math.random().toString(36).slice(2,8)}${Date.now()}`
    const now = new Date().toISOString()
    // Audit record
    let audit_id: string | null = null
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const ins = await db.from('pipeline_control_actions').insert({ action: 'ab_start', user_id: req.headers.get('x-user-id') || null, params: { id, input: body } } as any).select('id').limit(1)
      audit_id = (ins.data as any)?.[0]?.id || null
    } catch {}
    return NextResponse.json({ id, audit_id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'ab_start_error' }, { status: 500 })
  }
}


