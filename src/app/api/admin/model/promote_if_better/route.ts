import { NextRequest, NextResponse } from 'next/server'
import { promoteIfBetter } from '@/lib/services/canary/promote'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest) {
  const decision = await promoteIfBetter()
  return NextResponse.json(decision)
}












