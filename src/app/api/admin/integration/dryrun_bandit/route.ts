import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  return NextResponse.json({
    ok: true,
    sample: { experiments: 1, arms: 2, allocations: 10, metrics: 10 },
    arms: ['v1','v2','v3'],
    winner: 'v3',
    expected_lift: 0.07
  })
}








