import { NextRequest, NextResponse } from 'next/server'
import { listValidationsPaginated } from '@/lib/validation/store'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cursor = Number(searchParams.get('cursor')||'0')
  const limit = Number(searchParams.get('limit')||'50')
  const { items, nextCursor } = listValidationsPaginated(cursor, limit)
  return NextResponse.json({ items, nextCursor })
}


