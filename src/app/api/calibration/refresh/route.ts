import { NextRequest, NextResponse } from 'next/server'
import { refreshAll } from '@/lib/recs/calibration'

export async function POST(_req: NextRequest) {
  try {
    const res = await refreshAll()
    return NextResponse.json(res)
  } catch (e: any) {
    return NextResponse.json({ error: 'server_error', message: String(e?.message || e) }, { status: 500 })
  }
}


