import { NextRequest, NextResponse } from 'next/server'
import { evaluateFlag } from '@/lib/flags'

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || null
  const checks: Record<string, string> = {}
  const pairs: [string, string][] = [
    ['telemetry_ingest', 'telemetry_ingest'],
    ['federated_training', 'federated_training'],
    ['branches_longform3m', 'branches_longform3m'],
    ['branches_carousel', 'branches_carousel'],
    ['attribution_pixel', 'attribution_pixel'],
    ['leaderboard', 'leaderboard'],
  ]
  for (const [id, label] of pairs) {
    const on = await evaluateFlag(id as any, tenantId)
    checks[label] = on ? 'ENABLED' : 'DISABLED (by flag)'
  }
  return NextResponse.json({ checks })
}


