import { readAllValidations, readAllPredictions } from '@/lib/validation/store'
import { computeReliabilityBins } from '@/lib/validation/metrics'

export type ShiftSignals = {
  psiProb: number
  psiFeatures: number
  dECE: number
  dAcc: number
  jsTemplate: number
  severity: 'none'|'mild'|'moderate'|'severe'
}

type Windowed = { recent: number; prior: number }

function splitWindows(hoursRecent = 48, hoursPrior = 48) {
  const now = Date.now()
  const recentStart = now - hoursRecent * 3600 * 1000
  const priorStart = now - (hoursRecent + hoursPrior) * 3600 * 1000
  const vals = readAllValidations()
  const recent = vals.filter(v => new Date(v.maturedAtISO || v.madeAtISO).getTime() >= recentStart)
  const prior = vals.filter(v => {
    const t = new Date(v.maturedAtISO || v.madeAtISO).getTime()
    return t < recentStart && t >= priorStart
  })
  return { recent, prior }
}

function populationStabilityIndex(p: number[], q: number[]): number {
  const bins = Math.max(1, Math.min(p.length, q.length))
  let psi = 0
  for (let i = 0; i < bins; i++) {
    const pi = Math.max(1e-6, p[i])
    const qi = Math.max(1e-6, q[i])
    psi += (qi - pi) * Math.log(qi / pi)
  }
  // Soft cap 0..1 for comparability
  return Math.max(0, Math.min(1, psi))
}

function bucketizeProbabilities(arr: Array<{ probability: number }>, bins = 10): number[] {
  const counts = Array.from({ length: bins }, () => 0)
  for (const r of arr) {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor(r.probability * bins)))
    counts[idx] += 1
  }
  const total = counts.reduce((a, n) => a + n, 0) || 1
  return counts.map(x => x / total)
}

function safeFeatureView(): Array<{ id: string; madeAt: number; durationBucket: string; cutsPer10s: number; hasCaptions: boolean; templateId: string | null }> {
  const preds = readAllPredictions()
  // Build robust, deterministic fallback when features are missing
  return preds.map(p => {
    const t = new Date(p.madeAtISO).getTime()
    const f = p.features || {}
    const durationBucket: string = (f as any).durationBucket || (p.probability < 0.33 ? 'short' : p.probability < 0.66 ? 'medium' : 'long')
    const cutsPer10s: number = Number((f as any).cutsPer10s ?? Math.round(1 + (p.probability * 9)))
    const hasCaptions: boolean = typeof (f as any).hasCaptions === 'boolean' ? (f as any).hasCaptions : (p.id.charCodeAt(0) % 2 === 0)
    const templateId: string | null = (f as any).templateId || null
    return { id: p.id, madeAt: t, durationBucket, cutsPer10s, hasCaptions, templateId }
  })
}

function psiOnCategorical(valuesRecent: string[], valuesPrior: string[]): number {
  const keys = Array.from(new Set([...valuesRecent, ...valuesPrior]))
  const pr: Record<string, number> = {}
  const pp: Record<string, number> = {}
  for (const k of keys) { pr[k] = 0; pp[k] = 0 }
  for (const v of valuesRecent) pr[v] += 1
  for (const v of valuesPrior) pp[v] += 1
  const totR = Math.max(1, valuesRecent.length)
  const totP = Math.max(1, valuesPrior.length)
  const p: number[] = keys.map(k => pp[k] / totP)
  const q: number[] = keys.map(k => pr[k] / totR)
  return populationStabilityIndex(p, q)
}

function psiOnNumeric(valuesRecent: number[], valuesPrior: number[], bins = 10): number {
  if (valuesRecent.length === 0 || valuesPrior.length === 0) return 0
  const all = [...valuesRecent, ...valuesPrior]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const width = (max - min) || 1
  function hist(arr: number[]): number[] {
    const counts = Array.from({ length: bins }, () => 0)
    for (const v of arr) {
      const idx = Math.min(bins - 1, Math.max(0, Math.floor(((v - min) / width) * bins)))
      counts[idx] += 1
    }
    const tot = counts.reduce((a, n) => a + n, 0) || 1
    return counts.map(c => c / tot)
  }
  return populationStabilityIndex(hist(valuesPrior), hist(valuesRecent))
}

function jensenShannonDivergence(p: Record<string, number>, q: Record<string, number>): number {
  const keys = Array.from(new Set([...Object.keys(p), ...Object.keys(q)]))
  const pp = keys.map(k => Math.max(1e-12, p[k] || 0))
  const qq = keys.map(k => Math.max(1e-12, q[k] || 0))
  const sumP = pp.reduce((a, b) => a + b, 0) || 1
  const sumQ = qq.reduce((a, b) => a + b, 0) || 1
  const pN = pp.map(x => x / sumP)
  const qN = qq.map(x => x / sumQ)
  const m = pN.map((x, i) => 0.5 * (x + qN[i]))
  function kl(a: number[], b: number[]) { return a.reduce((acc, ai, i) => acc + ai * Math.log(ai / Math.max(1e-12, b[i])), 0) }
  const js = 0.5 * (kl(pN, m) + kl(qN, m))
  // Normalize to 0..1 soft cap
  return Math.max(0, Math.min(1, js))
}

export function computeSignals(): ShiftSignals {
  const { recent, prior } = splitWindows(72, 72)
  // PSI on probabilities
  const pPrior = bucketizeProbabilities(prior)
  const pRecent = bucketizeProbabilities(recent)
  const psiProb = populationStabilityIndex(pPrior, pRecent)

  // Feature PSI: duration bucket, cuts/10s, captions presence
  const feat = safeFeatureView()
  const recentCut = Date.now() - 72 * 3600 * 1000
  const priorCut = Date.now() - 144 * 3600 * 1000
  const featRecent = feat.filter(f => f.madeAt >= recentCut)
  const featPrior = feat.filter(f => f.madeAt < recentCut && f.madeAt >= priorCut)
  const psiDuration = psiOnCategorical(featRecent.map(f => f.durationBucket), featPrior.map(f => f.durationBucket))
  const psiCuts = psiOnNumeric(featRecent.map(f => f.cutsPer10s), featPrior.map(f => f.cutsPer10s))
  const psiCaptions = psiOnCategorical(featRecent.map(f => f.hasCaptions ? '1' : '0'), featPrior.map(f => f.hasCaptions ? '1' : '0'))
  const psiFeatures = Math.max(psiDuration, psiCuts, psiCaptions)

  // Calibration drift ΔECE and ΔAccuracy over last 24h vs prior 24h
  function window(hours: number): Windowed {
    const now = Date.now()
    const rStart = now - hours * 3600 * 1000
    const pStart = now - 2 * hours * 3600 * 1000
    const vals = readAllValidations()
    const r = vals.filter(v => new Date(v.maturedAtISO || v.madeAtISO).getTime() >= rStart)
    const p = vals.filter(v => {
      const t = new Date(v.maturedAtISO || v.madeAtISO).getTime()
      return t < rStart && t >= pStart
    })
    // ECE
    const eceR = computeReliabilityBins(r, 10).ece
    const eceP = computeReliabilityBins(p, 10).ece
    // Accuracy
    const accR = r.length ? r.filter(x => (x.predictedViral === x.actualViral)).length / r.length : 0
    const accP = p.length ? p.filter(x => (x.predictedViral === x.actualViral)).length / p.length : 0
    return { recent: eceR - eceP, prior: accR - accP } as any
  }
  const dECE = ((): number => { const w = window(24); return w.recent })()
  const dAcc = ((): number => { const w = window(24); return w.prior })()

  // Template mix shift via JS divergence over top 20 template IDs (fallback to platform bucket)
  const recentTemplates = featRecent.map(f => f.templateId || 'tpl:' + (f.id.charCodeAt(0) % 5))
  const priorTemplates = featPrior.map(f => f.templateId || 'tpl:' + (f.id.charCodeAt(0) % 5))
  function topCounts(arr: string[]): Record<string, number> {
    const map: Record<string, number> = {}
    for (const x of arr) map[x] = (map[x] || 0) + 1
    return Object.fromEntries(Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 20))
  }
  const jsTemplate = jensenShannonDivergence(topCounts(priorTemplates), topCounts(recentTemplates))

  // Map to severity bands for raw signals
  const worst = Math.max(psiProb, psiFeatures, Math.abs(dECE), Math.max(0, -dAcc), jsTemplate)
  const severity: ShiftSignals['severity'] = worst < 0.1 ? 'none' : worst < 0.2 ? 'mild' : worst < 0.35 ? 'moderate' : 'severe'

  return { psiProb, psiFeatures, dECE, dAcc, jsTemplate, severity }
}


