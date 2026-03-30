import fs from 'fs'
import path from 'path'
import { LearningModel } from './types'
import { getSummary } from '@/lib/validation/summary'

const ROOT = path.join(process.cwd(), 'fixtures', 'learning')
const CURRENT = path.join(ROOT, 'model_current.json')
const CANDIDATE = path.join(ROOT, 'model_candidate.json')

function ensureDir() {
  if (!fs.existsSync(ROOT)) fs.mkdirSync(ROOT, { recursive: true })
}

function writeAtomic(file: string, data: unknown) {
  ensureDir()
  const tmp = file + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, file)
}

function readJson<T>(file: string): T | null {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) as T } catch { return null }
}

function buildNeutralFromValidation(version: number): LearningModel {
  const now = new Date().toISOString()
  const summary: any = readJson<any>(path.join(process.cwd(), 'fixtures', 'validation', 'summary.json')) || { bins: [], accuracy: 0, auroc: 0, ece: 0, validated: 0 }
  const calib = Array.isArray(summary?.bins) && summary.bins.length
    ? (summary.bins as Array<{ p_mid:number; frac_positive:number; count:number }>).map((b, i, arr)=>{
        const lo = i/arr.length
        const hi = (i+1)/arr.length
        return { lo, hi, frac: b.frac_positive, count: b.count }
      })
    : Array.from({ length: 10 }, (_, i)=>({ lo:i/10, hi:(i+1)/10, frac:(i+0.5)/10, count: 0 }))
  const model: LearningModel = {
    version,
    createdAtISO: now,
    weights: { hook:1, clarity:1, pacing:1, novelty:1, platformFit:1, socialProof:1 },
    calibrationBins: calib,
    threshold: 0.5,
    notes: 'auto-bootstrapped neutral model',
    metricsAtBuild: { accuracy: summary?.accuracy||0, auroc: summary?.auroc||0, ece: summary?.ece||0, brier: 0.25, validated: summary?.validated||0 }
  }
  return model
}

export async function getCurrentModel(): Promise<LearningModel> {
  ensureDir()
  let cur = readJson<LearningModel>(CURRENT)
  if (!cur) {
    // Bootstrap v1 from validation summary (or fallback neutral)
    try { await getSummary() } catch {}
    cur = buildNeutralFromValidation(1)
    writeAtomic(CURRENT, cur)
    writeAtomic(path.join(ROOT, `model_v${cur.version}.json`), cur)
  }
  return cur
}

export async function saveCandidate(model: LearningModel): Promise<void> {
  ensureDir()
  writeAtomic(CANDIDATE, model)
  writeAtomic(path.join(ROOT, `model_v${model.version}.json`), model)
}

export async function readCandidate(): Promise<LearningModel | null> {
  ensureDir()
  return readJson<LearningModel>(CANDIDATE)
}

export async function promoteCandidate(): Promise<LearningModel> {
  ensureDir()
  const cand = await readCandidate()
  if (!cand) return await getCurrentModel()
  writeAtomic(CURRENT, cand)
  // Keep candidate file to show last candidate; optionally could remove
  return cand
}










