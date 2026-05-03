import { NextRequest, NextResponse } from 'next/server'
import { applyFixes } from '@/lib/services/scoring-service'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const out = applyFixes(body)
  return NextResponse.json(out)
}


