import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export type Platform = 'tiktok'|'instagram'|'youtube'|'other'

export type PredictionEvent = {
  id: string
  videoId?: string
  externalId?: string
  platform: Platform
  niche?: string
  madeAtISO: string
  probability: number
  threshold: number
  features?: Record<string, number|string|boolean>
}

export type ValidationRecord = {
  predictionId: string
  videoId?: string
  platform: string
  madeAtISO: string
  maturedAtISO: string
  probability: number
  actualViral: boolean
  predictedViral: boolean
}

const ROOT = path.join(process.cwd(), 'fixtures', 'validation')
const PRED_FILE = path.join(ROOT, 'predictions.ndjson')
const VAL_FILE = path.join(ROOT, 'validations.ndjson')
const SUM_FILE = path.join(ROOT, 'summary.json')

function ensureDir() {
  if (!fs.existsSync(ROOT)) fs.mkdirSync(ROOT, { recursive: true })
}

function writeAtomicJson(file: string, data: unknown) {
  ensureDir()
  const tmp = file + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, file)
}

function readLines(file: string): string[] {
  try {
    const txt = fs.readFileSync(file, 'utf8')
    return txt.split(/\r?\n/).filter(Boolean)
  } catch { return [] }
}

export function readAllPredictions(): PredictionEvent[] {
  const lines = readLines(PRED_FILE)
  return lines.map(l=>{ try { return JSON.parse(l) as PredictionEvent } catch { return null } }).filter(Boolean) as PredictionEvent[]
}

export function readAllValidations(): ValidationRecord[] {
  const lines = readLines(VAL_FILE)
  return lines.map(l=>{ try { return JSON.parse(l) as ValidationRecord } catch { return null } }).filter(Boolean) as ValidationRecord[]
}

export function appendPrediction(ev: Omit<PredictionEvent,'id'|'madeAtISO'> & { id?: string; madeAtISO?: string }): PredictionEvent {
  ensureDir()
  const event: PredictionEvent = {
    id: ev.id || randomUUID(),
    platform: ev.platform,
    videoId: ev.videoId,
    externalId: ev.externalId,
    niche: ev.niche,
    madeAtISO: ev.madeAtISO || new Date().toISOString(),
    probability: ev.probability,
    threshold: ev.threshold,
    features: ev.features
  }
  const existing = readAllPredictions().some(p => p.id === event.id)
  if (!existing) fs.appendFileSync(PRED_FILE, JSON.stringify(event) + '\n')
  return event
}

export function appendValidation(rec: ValidationRecord): void {
  ensureDir()
  const existing = readAllValidations().some(v => v.predictionId === rec.predictionId)
  if (!existing) fs.appendFileSync(VAL_FILE, JSON.stringify(rec) + '\n')
}

export function writeSummary(summary: any): void { writeAtomicJson(SUM_FILE, summary) }
export function readSummary(): any | null { try { return JSON.parse(fs.readFileSync(SUM_FILE,'utf8')) } catch { return null } }

export function listValidationsPaginated(cursor: number = 0, limit: number = 50): { items: ValidationRecord[]; nextCursor?: number } {
  const all = readAllValidations()
  const start = Math.max(0, cursor)
  const end = Math.min(all.length, start + Math.max(1, Math.min(500, limit)))
  const items = all.slice(start, end).reverse() // newest last lines should be latest; reverse for recent first
  const nextCursor = end < all.length ? end : undefined
  return { items, nextCursor }
}

export function ensureBackfillIfEmpty(generate: () => { predictions: PredictionEvent[]; validations: ValidationRecord[]; summary: any }): void {
  ensureDir()
  const has = fs.existsSync(PRED_FILE) && fs.statSync(PRED_FILE).size > 0
  const hasVal = fs.existsSync(VAL_FILE) && fs.statSync(VAL_FILE).size > 0
  if (!has || !hasVal) {
    const g = generate()
    // Write fresh files
    fs.writeFileSync(PRED_FILE, g.predictions.map(p=>JSON.stringify(p)).join('\n') + '\n')
    fs.writeFileSync(VAL_FILE, g.validations.map(v=>JSON.stringify(v)).join('\n') + '\n')
    writeSummary(g.summary)
  }
}


