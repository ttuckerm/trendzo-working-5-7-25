import { NextRequest, NextResponse } from 'next/server'
import { forceRecompute } from '@/lib/validation/summary'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const summary = await forceRecompute()
    return NextResponse.json({ ok: true, summary })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message||'recompute_failed' }, { status: 500 })
  }
}

export async function GET() { return POST({} as any) }


