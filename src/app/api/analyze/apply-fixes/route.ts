import { NextRequest, NextResponse } from 'next/server'
import { applyFixes } from '@/lib/services/scoring-service'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const out = applyFixes(body)
  return NextResponse.json(out)
}


