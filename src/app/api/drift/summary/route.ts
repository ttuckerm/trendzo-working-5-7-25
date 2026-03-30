import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const cohort = url.searchParams.get('cohort') || ''
    // Best-effort: derive weather from current calibration metrics
    const qs = new URLSearchParams({})
    if (cohort) qs.set('cohort', cohort)
    let status: 'OK'|'Warning'|'Critical' = 'OK'
    let message = ''
    try {
      const r = await fetch(`${url.origin}/api/metrics/accuracy?${qs.toString()}`, { cache: 'no-store' })
      const j = await r.json()
      const ece = Number(j?.ece || 0)
      if (ece < 0.05) status = 'OK'
      else if (ece < 0.12) status = 'Warning'
      else status = 'Critical'
      message = `ece=${ece.toFixed?.(3)}`
    } catch {}
    return NextResponse.json({ status, message })
  } catch (e: any) {
    return NextResponse.json({ status: 'OK', message: 'unavailable' })
  }
}


