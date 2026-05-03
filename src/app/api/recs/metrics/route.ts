import { NextRequest, NextResponse } from 'next/server'
import { snapshotMetrics } from '@/lib/recs/metrics'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    return NextResponse.json(snapshotMetrics(), { headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    return NextResponse.json({ error: 'server_error', message: String(e?.message || e) }, { status: 500 })
  }
}


