import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { ensureFederatedTables } from '@/lib/federated/ensure'
import { enforceTelemetryQuota } from '@/lib/security/telemetry-keys'
import { validateDeltaPayload } from '@/lib/federated/validator'

export async function POST(req: NextRequest) {
  const quota = await enforceTelemetryQuota(req, '/api/federated/updates/submit', 'federated/submit')
  if (!quota.allowed) return new NextResponse(null, { status: quota.status })
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureFederatedTables()
  let body: any = {}
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }) }
  const val = validateDeltaPayload(body)
  if (!val.ok) {
    try { await db.from('federated_updates').insert({ round_id: body.roundId, client_id: body.clientId||null, weights_delta: null, n_examples: body.nExamples||0, grad_norm: body.gradNorm||0, accepted:false, rejection_reason: val.reason } as any) } catch {}
    return NextResponse.json({ ok: false, error: val.reason }, { status: 400 })
  }
  const d = body.delta || body.weights_delta
  try {
    await db.from('federated_updates').insert({ round_id: body.roundId, client_id: body.clientId||null, weights_delta: d, n_examples: Number(body.nExamples), grad_norm: Number(body.gradNorm), accepted:true } as any)
    return NextResponse.json({ ok: true })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message||'error' }, { status: 500 })
  }
}


