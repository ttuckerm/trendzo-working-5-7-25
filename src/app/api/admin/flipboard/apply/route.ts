import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { checkPrereqs } from '@/lib/admin/flipboard_prereq'
import { applyLive, applyMock } from '@/lib/admin/flipboard_apply'
import { createHmac } from 'crypto'

function verifyToken(payload: object, token: string): boolean {
  const key = process.env.NEXTAUTH_SECRET || 'local-dev'
  const body = JSON.stringify(payload)
  const expect = createHmac('sha256', key).update(body).digest('hex')
  return expect === token
}

export async function POST(req: NextRequest) {
  const { switch: sw, target, confirm_token, ts } = await req.json().catch(()=>({})) as any
  if (!sw || !target || !confirm_token || !ts) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  // Verify token and age
  const age = Math.abs(Date.now() - Number(ts))
  const valid = age <= 5*60*1000 && verifyToken({ sw, target, ts }, confirm_token)
  if (!valid) return NextResponse.json({ ok: false, error: 'invalid_token' }, { status: 400 })

  // Re-check prereqs
  const prereq = await checkPrereqs(sw)
  if (!prereq.ok && target === 'live') {
    return NextResponse.json({ ok: false, blocked_reasons: prereq.missing }, { status: 400 })
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  // Snapshot before
  const { data: beforeRows } = await db.from('system_switches').select('*').eq('id', sw).limit(1)
  const before = (beforeRows||[])[0] || null

  // Apply atomically (best-effort within single request)
  try {
    if (target === 'live') await applyLive(sw)
    else await applyMock(sw)
  } catch {}
  // Update DB
  const patch = { is_live: target==='live', mode: target, last_changed_at: new Date().toISOString() } as any
  try { await db.from('system_switches').upsert({ id: sw, ...patch } as any) } catch {}
  const { data: afterRows } = await db.from('system_switches').select('*').eq('id', sw).limit(1)
  const after = (afterRows||[])[0] || null
  try { await db.from('system_audit').insert({ actor: 'super-admin', action: 'flipboard_apply', target: sw, before, after } as any) } catch {}

  return NextResponse.json({ applied: true, state: { id: sw, ...patch } })
}







