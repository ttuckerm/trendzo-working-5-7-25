import { NextRequest, NextResponse } from 'next/server'
import { evaluateFlag } from '@/lib/flags'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || null
  if (!(await evaluateFlag('leaderboard', tenantId))) {
    return NextResponse.json({ error: 'feature_disabled' }, { status: 403 })
  }
  return NextResponse.json({ score: 0.0 })
}


