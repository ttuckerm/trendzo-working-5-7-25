import { NextRequest, NextResponse } from 'next/server'
import { getGuardrailsMetrics } from '@/lib/recs/guardrails'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const m = getGuardrailsMetrics()
    return NextResponse.json(m, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    return NextResponse.json({ error: 'server_error', message: String(e?.message || e) }, { status: 500 })
  }
}


