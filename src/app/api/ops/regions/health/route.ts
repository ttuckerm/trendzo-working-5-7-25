import { NextRequest, NextResponse } from 'next/server'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  // Simulated health summary
  const primary = 'us-east-1'
  const secondary = 'us-west-2'
  const active = 'us-east-1'
  return NextResponse.json({ primary, secondary, active, regions: [{ id: primary, healthy: true }, { id: secondary, healthy: true }] })
}










