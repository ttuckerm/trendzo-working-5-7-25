import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  return NextResponse.json({ recalibrations_30d: 2 })
}



