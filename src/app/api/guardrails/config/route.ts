import { NextRequest, NextResponse } from 'next/server'
import { getGuardrailsConfig, setGuardrailsConfig } from '@/lib/recs/guardrails'

export async function GET() {
  return NextResponse.json(getGuardrailsConfig(), { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}))
    const cfg = await setGuardrailsConfig(body || {})
    return NextResponse.json(cfg)
  } catch (e: any) {
    return NextResponse.json({ error: 'server_error', message: String(e?.message || e) }, { status: 500 })
  }
}


