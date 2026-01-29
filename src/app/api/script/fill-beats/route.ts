import { NextRequest, NextResponse } from 'next/server'
import { fillBeats } from '@/lib/services/script-intelligence'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const out = fillBeats(body)
  return NextResponse.json(out)
}


