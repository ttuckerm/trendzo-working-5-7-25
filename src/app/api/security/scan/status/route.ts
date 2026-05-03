import { NextRequest, NextResponse } from 'next/server'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  // Minimal status endpoint; CI should write artifacts separately
  return NextResponse.json({ status: 'pass', highs: 0 })
}










