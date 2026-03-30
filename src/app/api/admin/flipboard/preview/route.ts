import { NextRequest, NextResponse } from 'next/server'
import { checkPrereqs } from '@/lib/admin/flipboard_prereq'
import { createHmac } from 'crypto'

function signToken(payload: object): string {
  const key = process.env.NEXTAUTH_SECRET || 'local-dev'
  const body = JSON.stringify(payload)
  return createHmac('sha256', key).update(body).digest('hex')
}

export async function POST(req: NextRequest) {
  const { switch: sw, target } = await req.json().catch(()=>({})) as any
  if (!sw || !target) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  const prereq = await checkPrereqs(sw)
  const plan = buildPlan(sw as any, target as any)
  const ts = Date.now()
  const payload = { sw, target, ts }
  const confirm_token = signToken(payload)
  const res: any = { ok: prereq.ok, confirm_token, plan, missing: prereq.missing, warnings: prereq.warnings }
  if (!prereq.ok) res.blocked_reasons = prereq.missing
  return NextResponse.json(res)
}

function buildPlan(sw: 'ingestion'|'validation'|'telemetry'|'billing'|'alarms', target: 'live'|'mock') {
  const common = target === 'live' ? 'Enable live pipelines and unlock guarded endpoints.' : 'Disable pipelines and route to mock/no-op.'
  const map: Record<string,string[]> = {
    ingestion: [ target==='live'? 'Start scheduler ingestion jobs':'Stop scheduler ingestion jobs', 'Apify client config → '+(target==='live'?'live':'noop') ],
    validation: [ target==='live'? 'Register nightly accuracy evaluation':'Unregister nightly evaluation' ],
    telemetry: [ target==='live'? 'Accept and persist /api/telemetry/first_hour':'Accept 202 no-op' ],
    billing: [ target==='live'? 'Provider=stripe; bind webhook':'Provider=mock; unbind webhook' ],
    alarms: [ target==='live'? 'Enable Slack/SMTP dispatch':'Disable dispatch (log only)' ],
  }
  return { summary: common, actions: map[sw] }
}







