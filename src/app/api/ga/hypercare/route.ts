import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

let hypercareUntil: number | null = null

export async function POST(_req: NextRequest) {
  // Start 72h hypercare
  hypercareUntil = Date.now() + 72 * 3600 * 1000
  const gaDir = path.join(process.cwd(), 'public', 'artifacts', 'ga')
  fs.mkdirSync(gaDir, { recursive: true })
  const summary = {
    started_at: new Date().toISOString(),
    ends_at: new Date(hypercareUntil).toISOString(),
    probe_cadence_s: 120,
    alert_rules: {
      latency_p95_ms: 600,
      error_rate_pct: 2,
      experiment_auto_rollback_p_value: 0.05
    }
  }
  fs.writeFileSync(path.join(gaDir, 'hypercare-summary.json'), JSON.stringify(summary, null, 2))
  return NextResponse.json({ ok: true, summary })
}

export async function GET(_req: NextRequest) {
  const active = hypercareUntil !== null && Date.now() < hypercareUntil
  return NextResponse.json({ active, ends_at: hypercareUntil ? new Date(hypercareUntil).toISOString() : null, cadence_s: 120 })
}



