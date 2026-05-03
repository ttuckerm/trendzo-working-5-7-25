import { NextRequest, NextResponse } from 'next/server'
import { generateHooks } from '@/lib/services/script-intelligence'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const out = generateHooks(body || {})
  return NextResponse.json(out)
}


