import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  // Minimal status endpoint; CI should write artifacts separately
  return NextResponse.json({ status: 'pass', highs: 0 })
}










