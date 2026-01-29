import { NextResponse } from 'next/server'
import { computeDiscoveryReadiness } from '@/lib/discovery/discovery_readiness'

export async function GET() {
  try {
    const report = await computeDiscoveryReadiness()
    return NextResponse.json(report)
  } catch (e: any) {
    return NextResponse.json({ ready: false, scores: {
      freshness_secs: 999999,
      templates_total: 0,
      sections: { HOT: 0, COOLING: 0, NEW: 0 },
      examples_coverage_pct: 0,
      safety_coverage_pct: 0,
      analyzer_online: false,
      ab_online: false,
      validate_online: false
    }, reasons: [String(e?.message || 'readiness_failed')] }, { status: 200 })
  }
}


