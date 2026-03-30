import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { ensureCalibrationTables } from '@/lib/calibration/calibration'

export async function GET(_req: NextRequest) {
  await ensureCalibrationTables()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data, error } = await db.from('active_label_queue').select('*').eq('status','pending').order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, items: data || [] })
}

export async function POST(req: NextRequest) {
  await ensureCalibrationTables()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const body = await req.json().catch(()=>({})) as any
  if (body?.action === 'label' && Array.isArray(body.items)) {
    const updates = body.items.slice(0,100).map((it:any)=> ({ id: it.id, status: 'labeled', outcome: !!it.outcome }))
    const { error } = await db.from('active_label_queue').upsert(updates as any)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, updated: updates.length })
  }
  return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 })
}


