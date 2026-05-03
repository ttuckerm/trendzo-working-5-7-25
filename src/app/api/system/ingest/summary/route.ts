import { NextResponse } from 'next/server'
import { countProcessedLast24h } from '@/lib/db/pg'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET() {
  const total = await countProcessedLast24h()
  return NextResponse.json({ records24h: total })
}


