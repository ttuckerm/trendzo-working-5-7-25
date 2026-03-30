import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'

export async function POST(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { experiment_id, user_id } = await req.json().catch(()=>({})) as any
  if (!experiment_id || !user_id) return NextResponse.json({ ok:false, error:'missing_params' }, { status: 400 })
  // Thompson sampling over arms
  const { data: arms } = await db.from('arms').select('id,prior_alpha,prior_beta').eq('experiment_id', experiment_id)
  if (!Array.isArray(arms) || arms.length < 2) return NextResponse.json({ ok:false, error:'no_arms' }, { status: 400 })
  const samples = arms.map(a => ({ id: a.id, draw: betaSample(a.prior_alpha||1, a.prior_beta||1) }))
  samples.sort((a,b)=> b.draw - a.draw)
  const chosen = samples[0]
  await db.from('allocations').insert({ experiment_id, arm_id: chosen.id, user_id } as any)
  return NextResponse.json({ ok:true, arm_id: chosen.id })
}

function betaSample(alpha: number, beta: number): number {
  // Simple approximate via two gamma draws
  const a = gammaSample(alpha, 1)
  const b = gammaSample(beta, 1)
  return a / (a + b)
}
function gammaSample(k: number, theta: number): number {
  // Marsaglia and Tsang method (k>1); fall back for k<=1
  if (k <= 1) {
    const u = Math.random()
    return gammaSample(1 + k, theta) * Math.pow(u, 1 / k)
  }
  const d = k - 1/3, c = 1 / Math.sqrt(9 * d)
  while (true) {
    let x: number, v: number
    do { x = normalSample(); v = 1 + c * x } while (v <= 0)
    v = v * v * v
    const u = Math.random()
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v * theta
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * theta
  }
}
function normalSample(): number { // Box-Muller
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}


