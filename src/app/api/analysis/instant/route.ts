import { NextRequest, NextResponse } from 'next/server'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const sample = url.searchParams.get('sample') === '1'
  const start = Date.now()
  // Simulate analysis
  await new Promise((r) => setTimeout(r, sample ? 50 : 100))
  const latency_ms = Date.now() - start
  const recommendations = [ 'Tighten hook in first 2s' ]
  return NextResponse.json({ latency_ms, recommendations })
}



