import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'

export async function POST(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const { experiment_id, arm_id, reward } = await req.json().catch(()=>({})) as any
  if (!experiment_id || !arm_id || typeof reward !== 'number') return NextResponse.json({ ok:false, error:'invalid' }, { status: 400 })
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await db.from('metrics').insert({ experiment_id, arm_id, reward } as any)
  // Update arm priors (Beta) online
  const { data: arm } = await db.from('arms').select('prior_alpha,prior_beta').eq('id', arm_id).limit(1)
  const a = (arm?.[0]?.prior_alpha || 1) + (reward > 0 ? 1 : 0)
  const b = (arm?.[0]?.prior_beta || 1) + (reward > 0 ? 0 : 1)
  await db.from('arms').update({ prior_alpha: a, prior_beta: b } as any).eq('id', arm_id)
  return NextResponse.json({ ok:true })
}


