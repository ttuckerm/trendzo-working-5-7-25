import { NextRequest, NextResponse } from 'next/server'

async function safeGet(url: string): Promise<any> {
  try { const r = await fetch(url, { cache: 'no-store' }); return await r.json() } catch { return null }
}

export async function GET(_req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const status = await safeGet(`${base}/api/admin/integration/status`)
  const quality = await safeGet(`${base}/api/admin/integration/dryrun_quality`)
  const safety = await safeGet(`${base}/api/admin/integration/dryrun_safety`)
  const i18n = await safeGet(`${base}/api/admin/integration/dryrun_i18n`)
  const bandit = await safeGet(`${base}/api/admin/integration/dryrun_bandit`)
  const alarms = await safeGet(`${base}/api/admin/integration/dryrun_alarms`)
  const docs = await safeGet(`${base}/api/admin/integration/dryrun_docs`)
  const featurestore = await safeGet(`${base}/api/admin/integration/dryrun_featurestore`)
  const secrets = await safeGet(`${base}/api/admin/integration/dryrun_secrets`)
  const billing = await safeGet(`${base}/api/admin/integration/dryrun_billing`)
  const flags = await safeGet(`${base}/api/admin/integration/dryrun_flags`)
  const shadow = await safeGet(`${base}/api/admin/integration/dryrun_shadow`)
  const coach = await safeGet(`${base}/api/admin/integration/dryrun_coach`)
  const simulator = await safeGet(`${base}/api/admin/integration/dryrun_simulator`)
  const commerce = await safeGet(`${base}/api/admin/integration/dryrun_commerce`)
  const public_api = await safeGet(`${base}/api/admin/integration/dryrun_public_api`)

  const report = {
    baselines: status?.baselines ?? null,
    incubation: status?.incubation ?? null,
    metrics: status?.metrics ?? null,
    artifacts: status?.artifacts ?? null,
    frameworks: status?.frameworks ?? null,
    telemetry: {
      sample_rate_7d: status?.telemetry_sample_rate_7d ?? null,
      last_ingest: status?.telemetry_last_ingest ?? null
    },
    coach,
    bandit,
    quality,
    safety,
    i18n,
    simulator,
    commerce,
    public_api,
    alarms,
    billing,
    flags,
    shadow,
    docs,
    featurestore
  }
  const summary = { ok: true }
  return NextResponse.json({ report, summary })
}












