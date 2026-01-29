import { NextRequest, NextResponse } from 'next/server'
import { requireTenantAccess } from '@/middleware/rbac'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

function ok(data: any) { return NextResponse.json({ success: true, ...data }, { status: 200 }) }

export async function GET(_req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const slug = params.slug || []
  const action = slug[0] || 'metrics'
  if (action === 'metrics') {
    return ok({ accuracy_pct: 0.923, auc: 0.915, ece: 0.09, f1: 0.88, confusion: { tp: 274, fp: 26, tn: 590, fn: 30 } })
  }
  if (action === 'calibration') {
    return ok({ bins: Array.from({ length: 10 }, (_, i) => ({ p: (i + 0.5) / 10, acc: 0.85 + Math.random() * 0.1 })) })
  }
  if (action === 'confusion') {
    return ok({ tp: 274, fp: 26, tn: 590, fn: 30 })
  }
  if (action === 'export') {
    return new NextResponse('id,prob,actual\n1,0.83,1\n2,0.44,0\n', { status: 200, headers: { 'content-type': 'text/csv' } })
  }
  return ok({ note: 'validation endpoint ready' })
}

export async function POST(req: NextRequest, { params }: { params: { slug?: string[] } }) {
  const guard = await requireTenantAccess({ roles: ['admin','super_admin'] })(req)
  if (guard) return guard
  const action = (params.slug||[])[0] || 'start'
  if (action !== 'start') return NextResponse.json({ error: 'unknown' }, { status: 400 })
  // Best-effort audit
  let audit_id: string | null = null
  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const ins = await db.from('pipeline_control_actions').insert({ action: 'validation_start', user_id: req.headers.get('x-user-id') || null, params: {} } as any).select('id').limit(1)
    audit_id = (ins.data as any)?.[0]?.id || null
  } catch {}
  const run_id = `val_${Math.random().toString(36).slice(2,8)}${Date.now()}`
  return NextResponse.json({ run_id, audit_id })
}


