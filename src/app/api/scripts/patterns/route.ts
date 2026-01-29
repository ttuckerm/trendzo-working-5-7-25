import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  return NextResponse.json({ top10: ['authority hook','pattern break','question lead'] })
}



