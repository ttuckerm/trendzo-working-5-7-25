import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  // Simulated health summary
  const primary = 'us-east-1'
  const secondary = 'us-west-2'
  const active = 'us-east-1'
  return NextResponse.json({ primary, secondary, active, regions: [{ id: primary, healthy: true }, { id: secondary, healthy: true }] })
}










