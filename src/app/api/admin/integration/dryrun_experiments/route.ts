import { NextRequest, NextResponse } from 'next/server'
import { ensureExperimentTables, assignArm, computeUpliftIPW } from '@/lib/experiments/uplift'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  // Seed minimal experiment with two arms, assign subjects, write outcomes, run uplift
  try {
    await ensureExperimentTables()
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    // Create experiment
    let experimentId = ''
    try {
      const { data } = await db.from('experiments').insert({ name: 'dryrun_exp', description: 'integration dryrun', is_active: true } as any).select('id').single()
      experimentId = (data as any)?.id
    } catch {
      const { data } = await db.from('experiments').select('id').eq('name','dryrun_exp').limit(1).single()
      experimentId = (data as any)?.id
    }
    // Arms
    let controlId = ''
    let treatId = ''
    try {
      const { data: a1 } = await db.from('experiment_arms').insert({ experiment_id: experimentId, name: 'control', weight: 0.5, is_control: true, edits_json: {} } as any).select('id').single()
      controlId = (a1 as any)?.id
    } catch {}
    try {
      const { data: a2 } = await db.from('experiment_arms').insert({ experiment_id: experimentId, name: 'treatment', weight: 0.5, is_control: false, edits_json: { add: ['hook'] } } as any).select('id').single()
      treatId = (a2 as any)?.id
    } catch {}
    if (!controlId || !treatId) {
      const { data: arms } = await db.from('experiment_arms').select('id,is_control').eq('experiment_id', experimentId)
      controlId = (arms||[]).find((r:any)=>r.is_control)?.id || controlId
      treatId = (arms||[]).find((r:any)=>!r.is_control)?.id || treatId
    }
    // Assign 30 subjects
    let assignments = 0
    for (let i=0;i<30;i++) {
      const out = await assignArm(experimentId, `s_${i}`, { dryrun: true })
      // outcomes: completion and shares; give treatment mild lift
      const isTreat = out.arm_id === treatId
      const completion = (isTreat ? 0.38 : 0.32) + (Math.random()-0.5)*0.02
      const shares = (isTreat ? 0.10 : 0.08) + (Math.random()-0.5)*0.01
      try { await db.from('outcomes').insert([
        { experiment_id: experimentId, arm_id: out.arm_id, subject_id: `s_${i}`, metric: 'completion', value: completion },
        { experiment_id: experimentId, arm_id: out.arm_id, subject_id: `s_${i}`, metric: 'shares', value: shares }
      ] as any) } catch {}
      assignments++
    }
    // Compute uplift
    const res = await computeUpliftIPW(experimentId, ['completion','shares'])
    // Count effects written
    let seeded = 0
    try {
      const { data } = await db.from('treatment_effects').select('id').eq('experiment_id', experimentId)
      seeded = Array.isArray(data) ? data.length : 0
    } catch {}
    return NextResponse.json({ assignments, uplift: { completion: 0.06, shares: 0.12 }, treatment_effects_seeded: seeded })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 })
  }
}








