import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, guardAdmin } from '../../_lib'

export async function POST(req: NextRequest) {
  const denied = await guardAdmin(req)
  if (denied) return denied
  let db
  try { db = getAdminDb() } catch (e: any) {
    return NextResponse.json({ ok: true })
  }
  const body = await req.json().catch(()=> ({}))
  const id = body.id
  const actor = req.headers.get('x-user-id') || null
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })
  await db.from('pipeline_alerts').update({ resolved_at: new Date().toISOString() } as any).eq('id', id)
  await db.from('pipeline_control_actions').insert({ action: 'alert_resolve', module_id: null, user_id: actor, params: { id } } as any)
  return NextResponse.json({ ok: true })
}


