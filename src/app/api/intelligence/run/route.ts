import { NextRequest, NextResponse } from 'next/server'
import { runIntelligence } from '@/lib/intelligence/run'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { goal, context, data, maxTokens } = body || {}
    const out = await runIntelligence({ goal, context, data, maxTokens })
    return NextResponse.json(out, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ code: 'INTELLIGENCE_ERROR', message: e?.message || 'error' }, { status: 400 })
  }
}


