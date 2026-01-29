import { NextRequest, NextResponse } from 'next/server'
import { generateHooks } from '@/lib/services/script-intelligence'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const out = generateHooks(body || {})
  return NextResponse.json(out)
}


