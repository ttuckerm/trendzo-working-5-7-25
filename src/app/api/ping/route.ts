import { NextResponse } from 'next/server'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    return NextResponse.json({ ok: true, time: new Date().toISOString() })
  } catch (e) {
    const msg = (e as any)?.message ?? String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
