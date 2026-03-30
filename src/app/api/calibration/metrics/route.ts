import { NextRequest, NextResponse } from 'next/server'
import { getMetrics } from '@/lib/recs/calibration'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const cohort = url.searchParams.get('cohort') || 'tiktok:general:med'
    const metrics = await getMetrics(cohort)
    return NextResponse.json({ cohort, metrics }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    return NextResponse.json({ error: 'server_error', message: String(e?.message || e) }, { status: 500 })
  }
}


