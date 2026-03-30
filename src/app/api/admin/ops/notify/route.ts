import { NextRequest, NextResponse } from 'next/server'
import { notifyOps } from '@/lib/ops/alarms'
import { dispatchAlarm } from '@/lib/ops/notifier'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({})) as any
  // Direct notify (raw)
  if (body?.payload) {
    const ok = await notifyOps({ email: body?.email, webhook: body?.webhook }, body?.payload||{})
    return NextResponse.json({ ok })
  }
  // Alarm dispatch respecting dedupe/ratelimit
  if (body?.rule && body?.severity) {
    const out = await dispatchAlarm(String(body.rule), String(body.severity), body?.details||{})
    return NextResponse.json({ ok: true, ...out })
  }
  return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
}


