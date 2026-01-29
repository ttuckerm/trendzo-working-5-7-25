// src/app/api/metrics/accuracy/route.ts
export const runtime = 'nodejs'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

type Bin = { x?: number; y?: number; pHat?: number; fracPos?: number; count?: number }

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const cohort = url.searchParams.get('cohort') || 'demo-tt-001::v1'
    const forceDev = url.searchParams.get('dev') === '1'

    // Build absolute URL for same-origin server call
    const host = req.headers.get('host') ?? 'localhost:3000'
    const proto = req.headers.get('x-forwarded-proto') ?? 'http'
    const base = `${proto}://${host}`

    // Ask calibrate to do the heavy lifting (it already computes ECE/AUC/bins)
    const qp = forceDev ? 'dev=1' : ''
    const res = await fetch(`${base}/api/jobs/calibrate?${qp}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cohort }),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => '')
      return NextResponse.json({ ok: false, error: `calibrate failed: ${err}` }, { status: 500 })
    }
    const data = await res.json()

    // Pull bins from calibrate (it may expose reliabilityByCohort)
    const rawBins: Bin[] =
      data?.reliabilityByCohort?.[cohort] ??
      data?.reliability?.[cohort] ??
      []

    // Map bins to x/y arrays regardless of shape
    const x = rawBins.map((b) => (typeof b.pHat === 'number' ? b.pHat : (b.x ?? 0)))
    const y = rawBins.map((b) => (typeof b.fracPos === 'number' ? b.fracPos : (b.y ?? 0)))

    // Pull scalar metrics from calibrate detail
    const det = Array.isArray(data?.details)
      ? data.details.find((d: any) => d.cohortKey === cohort) ?? null
      : null

    const auc = typeof det?.auc === 'number' ? det.auc : Number(data?.avgAUC ?? 0)
    const ece = typeof det?.ece === 'number' ? det.ece : Number(data?.avgECE ?? 0)
    const accuracy = typeof det?.accuracy === 'number' ? det.accuracy : 0

    return NextResponse.json({
      ok: true,
      mode: data?.mode ?? (forceDev ? 'dev' : 'db'),
      cohort,
      reliability: { x, y },
      bins: x.length,
      auc,
      ece,
      accuracy,
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 },
    )
  }
}



