import { NextRequest, NextResponse } from 'next/server'
import { refreshAll } from '@/lib/recs/calibration'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest) {
  try {
    const res = await refreshAll()
    return NextResponse.json(res)
  } catch (e: any) {
    return NextResponse.json({ error: 'server_error', message: String(e?.message || e) }, { status: 500 })
  }
}


