import { NextResponse } from 'next/server'
import { aggregateScriptElements } from '@/lib/services/scriptElementsAggregator'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = aggregateScriptElements()
    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'aggregation_failed' }, { status: 500 })
  }
}


