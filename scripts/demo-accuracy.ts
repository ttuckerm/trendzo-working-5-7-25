/*
  CLI helper: seeds demo dev store, runs calibration, prints summary.
  Assumes dev server on http://localhost:3002
*/
import fetch from 'node-fetch'

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3002'

async function main() {
  const cohort = 'demo-tt-001::v1'
  function log(step: string, extra?: string) { console.log(`› ${step}${extra? ' — '+extra:''}`) }
  try {
    // 1) Reset
    log('Resetting dev store')
    const r1 = await fetch(`${BASE}/api/dev/reset`, { method: 'POST' })
    const j1 = await r1.json().catch(()=> ({}))
    if (!r1.ok) throw new Error(`reset_failed: ${j1?.error||j1?.message||r1.status}`)
    log('Reset OK', `cleared preds=${j1?.cleared?.predictions ?? 0} labels=${j1?.cleared?.labels ?? 0}`)

    // 2) Seed
    log('Seeding demo cohort', cohort)
    const r2 = await fetch(`${BASE}/api/debug/seed-p1-demo`, { method: 'POST' })
    const j2 = await r2.json().catch(()=> ({}))
    if (!r2.ok) throw new Error(`seed_failed: ${j2?.error||j2?.message||r2.status}`)
    log('Seed OK', `preds=${j2?.predictions ?? 0} outcomes=${j2?.outcomes ?? 0} labels=${j2?.labels ?? j2?.labelCount ?? 0}`)

    // 3) Calibrate
    log('Calibrating (DEV mode) for cohort', cohort)
    const r3 = await fetch(`${BASE}/api/jobs/calibrate?dev=1`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cohort }) })
    const j3 = await r3.json().catch(()=> ({}))
    if (!r3.ok) throw new Error(`calibrate_failed: ${j3?.error||j3?.message||r3.status}`)
    const binsLen = Array.isArray(j3?.reliabilityByCohort?.[cohort]) ? j3.reliabilityByCohort[cohort].length : 0
    log('Calibrate OK', `mode=${j3?.mode} cohorts=${j3?.cohortsProcessed ?? j3?.cohorts ?? '—'} bins=${binsLen} avgECE=${(j3?.avgECE ?? 0).toFixed?.(3)} avgAUC=${(j3?.avgAUC ?? 0).toFixed?.(3)}`)

    // 4) Fetch metrics for chart
    const r4 = await fetch(`${BASE}/api/metrics/accuracy?cohort=${encodeURIComponent(cohort)}&dev=1`)
    const j4 = await r4.json().catch(()=> ({}))
    if (!r4.ok) throw new Error(`metrics_failed: ${j4?.error||j4?.message||r4.status}`)
    const bins = Array.isArray(j4?.reliability?.x) ? j4.reliability.x.length : 0
    const auc = (j4?.auc ?? 0).toFixed?.(3)
    const ece = (j4?.ece ?? 0).toFixed?.(3)
    log('Metrics', `bins=${bins} auc=${auc} ece=${ece}`)

    console.log('\nOpen http://localhost:3002/admin/command-center/validation (cohort prefilled).')
    process.exit(0)
  } catch (e: any) {
    console.error('Demo failed:', String(e?.message || e))
    process.exit(1)
  }
}

main()


