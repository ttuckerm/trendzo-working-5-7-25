import { NextRequest, NextResponse } from 'next/server'
import { listValidationsPaginated } from '@/lib/validation/store'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cursor = Number(searchParams.get('cursor')||'0')
  const limit = Number(searchParams.get('limit')||'50')
  const { items, nextCursor } = listValidationsPaginated(cursor, limit)
  return NextResponse.json({ items, nextCursor })
}


