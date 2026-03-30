import { NextRequest, NextResponse } from 'next/server'
import { getGuardrailsMetrics } from '@/lib/recs/guardrails'

export async function GET(_req: NextRequest) {
  try {
    const m = getGuardrailsMetrics()
    return NextResponse.json(m, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    return NextResponse.json({ error: 'server_error', message: String(e?.message || e) }, { status: 500 })
  }
}


