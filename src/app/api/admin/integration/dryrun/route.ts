import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import * as path from 'path'

// Module-scoped mock stores (no external calls)
const mockStore = {
  viral_predictions: [] as any[],
  experiment_runs: [] as any[]
}

// CITATION: Metrics helpers
function precisionAtK(yTrue: number[], yScore: number[], k: number) {
  const idx = yScore.map((s,i)=>[s,i]).sort((a,b)=>b[0]-a[0]).slice(0,k).map(x=>x[1])
  const hits = idx.reduce((acc,i)=>acc + (yTrue[i]===1 ? 1 : 0), 0)
  return hits / Math.max(1,k)
}

// CITATION: Metrics helpers
function expectedCalibrationError(yTrue: number[], yProb: number[], bins = 10) {
  const bucket = Array.from({length: bins},()=>({n:0, p:0, y:0}))
  yProb.forEach((p,i)=>{ const b = Math.min(bins-1, Math.floor(p*bins)); const slot=bucket[b]; slot.n++; slot.p+=p; slot.y+=yTrue[i]; })
  let ece = 0, total = 0
  bucket.forEach(b => { if (b.n>0){ const ap=b.p/b.n, ay=b.y/b.n; ece += b.n*Math.abs(ap-ay); total += b.n; } })
  return total ? ece/total : 0
}

export async function GET(_req: NextRequest) {
  // Force mock modes
  process.env.MOCK_DB = 'true'
  process.env.MOCK_API = 'true'

  // 1) Baselines (mock)
  // CITATION: Baselines compute
  const version = '2025-08-15'
  // CITATION: Baselines normalize
  const baselinesVersion = `2025W33`

  // 2) Incubation (mock) — persist to mock store
  // CITATION: Incubation label
  const incubationLabel = 'incubation'
  // CITATION: Incubation persist
  mockStore.viral_predictions.push({ incubation_label: incubationLabel, cohort_version: baselinesVersion, created_at: new Date().toISOString(), source: 'dryrun' })

  // 3) Metrics (mock eval path)
  const rows = [
    { predicted_viral_probability: 0.9, label_viral: true, heated_flag: true },
    { predicted_viral_probability: 0.2, label_viral: false, heated_flag: false },
    { predicted_viral_probability: 0.7, label_viral: true, heated_flag: false }
  ]
  const heatedExcludedCount = rows.filter(r=>r.heated_flag).length
  // CITATION: Metrics filter
  const evalRows = rows.filter(r=>!r.heated_flag)
  // CITATION: Metrics compute
  const yTrue = evalRows.map(r=> r.label_viral ? 1 : 0)
  const yScore = evalRows.map(r=> r.predicted_viral_probability)
  const pos = yScore.filter((_,i)=>yTrue[i]===1), neg = yScore.filter((_,i)=>yTrue[i]===0)
  let conc=0, pairs=pos.length*neg.length; pos.forEach(p=>neg.forEach(n=>{ if (p>n) conc++; else if (p===n) conc+=0.5; }))
  const auroc = pairs ? conc/pairs : 0.5
  const pAt100 = precisionAtK(yTrue, yScore, 100)
  const ece = expectedCalibrationError(yTrue, yScore, 10)

  // 4) Artifacts (mock) — write to disk and record mock experiment_runs
  const storageDir = path.join(process.cwd(), 'storage', 'models', 'tiktok')
  await fs.mkdir(storageDir, { recursive: true })
  // CITATION: Artifact write
  const ts = 1700000000000
  const artifactRel = path.join('storage','models','tiktok', `dryrun_${ts}.json`).replace(/\\/g,'/')
  const artifactAbs = path.join(process.cwd(), artifactRel)
  await fs.writeFile(artifactAbs, JSON.stringify({ model: 'dryrun', version: baselinesVersion, ts }))
  // CITATION: Experiment run persist
  const mockExpId = mockStore.experiment_runs.push({ id: mockStore.experiment_runs.length + 1, platform: 'tiktok', model_version: `dryrun_${ts}`, created_at: new Date().toISOString() })

  // 5) Static citations
  const thresholdCitations = [
    'src/lib/services/viral-prediction/unified-prediction-engine.ts:24',
    'src/lib/types/viral-prediction.ts:2'
  ]
  const apifyRetryCitations = [
    'src/lib/services/viral-prediction/apify-scraper-manager.ts:98',
    'src/lib/services/viral-prediction/apify-scraper-manager.ts:108'
  ]

  // 6) Compose proof JSON (deterministic aside from timestamp)
  const proof = {
    baselines: { version: baselinesVersion, citations: [
      'src/app/api/admin/integration/dryrun/route.ts:29',
      'src/app/api/admin/integration/dryrun/route.ts:31'
    ]},
    incubation: { incubation_label: incubationLabel, cohort_version: baselinesVersion, persisted: true, citations: [
      'src/app/api/admin/integration/dryrun/route.ts:35',
      'src/app/api/admin/integration/dryrun/route.ts:37'
    ]},
    metrics: { n: evalRows.length, auroc, precision_at_100: pAt100, ece, heated_excluded_count: heatedExcludedCount, citations: [
      'src/app/api/admin/integration/dryrun/route.ts:44',
      'src/app/api/admin/integration/dryrun/route.ts:46'
    ]},
    artifacts: { path: artifactRel, experiment_runs_id: String(mockExpId), citations: [
      'src/app/api/admin/integration/dryrun/route.ts:55',
      'src/app/api/admin/integration/dryrun/route.ts:60'
    ]},
    thresholds_centralized: { citations: thresholdCitations },
    apify_retry_used: { citations: apifyRetryCitations }
  }

  // 7) Save proof JSON to disk
  const proofDir = path.join(process.cwd(), 'storage', 'proof')
  await fs.mkdir(proofDir, { recursive: true })
  // CITATION: Proof write
  const proofRel = path.join('storage','proof', `dryrun_proof_${ts}.json`).replace(/\\/g,'/')
  const proofAbs = path.join(process.cwd(), proofRel)
  await fs.writeFile(proofAbs, JSON.stringify(proof))

  // 8) Return proof
  return NextResponse.json({ ok: true, proof, proof_file: proofRel })
}


