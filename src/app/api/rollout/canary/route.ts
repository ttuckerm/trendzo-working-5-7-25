import { NextRequest, NextResponse } from 'next/server'
import { evaluateFlag, setFlag } from '@/lib/flags'

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || null
  const enabled = await evaluateFlag('algo_aplusplus', tenantId)
  return NextResponse.json({ algo_aplusplus: enabled }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  try {
    const { enabled } = await req.json()
    const actor = req.headers.get('x-actor') || 'api'
    const audience = 'all'
    const row = await setFlag('algo_aplusplus', !!enabled, actor, audience)
    return NextResponse.json({ ok: true, row })
  } catch (e: any) {
    return NextResponse.json({ error: 'server_error', message: String(e?.message || e) }, { status: 500 })
  }
}


