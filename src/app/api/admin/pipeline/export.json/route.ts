import { NextRequest, NextResponse } from 'next/server'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const res = await fetch(new URL('/api/admin/pipeline/export?format=json', url.origin), { headers: req.headers as any })
  const payload = await res.json()
  return NextResponse.json(payload)
}



