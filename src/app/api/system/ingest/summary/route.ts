import { NextResponse } from 'next/server'
import { countProcessedLast24h } from '@/lib/db/pg'

export async function GET() {
  const total = await countProcessedLast24h()
  return NextResponse.json({ records24h: total })
}


