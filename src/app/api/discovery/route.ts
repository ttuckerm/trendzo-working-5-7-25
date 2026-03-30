import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [metricsRes, readinessRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/discovery/metrics`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/discovery/readiness`, { cache: 'no-store' })
    ])
    const metrics = metricsRes.ok ? await metricsRes.json() : null
    const readiness = readinessRes.ok ? await readinessRes.json() : null
    return NextResponse.json({ metrics, readiness })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 200 })
  }
}



