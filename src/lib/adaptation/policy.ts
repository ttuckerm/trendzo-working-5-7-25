import { computeSignals, ShiftSignals } from './signals'
import { getCurrentModel } from '@/lib/learning/store'
import { runTrainer } from '@/lib/learning/trainer'

export type ProposedChange = {
  versionFrom: number
  versionTo: number
  reason: string
  severity: 'Stable'|'Shifting'|'Storm'
  newThreshold: number
  newWeights: Record<string, number>
  newCalibrationBins: Array<{ lo: number; hi: number; frac: number; count: number }>
  expected: { accuracy: number; ece: number; auroc: number; brier: number }
}

export type Weather = 'Stable'|'Shifting'|'Storm'

function classifyWeather(s: { psiProb:number; psiFeatures:number; dECE:number; dAcc:number }): Weather {
  const stable = s.psiProb < 0.15 && s.psiFeatures < 0.15 && Math.abs(s.dECE) < 0.03
  if (stable) return 'Stable'
  const shifting = s.psiProb <= 0.3 || s.psiFeatures <= 0.3 || Math.abs(s.dECE) < 0.06
  if (shifting) return 'Shifting'
  if (s.psiProb > 0.3 || s.psiFeatures > 0.3 || Math.abs(s.dECE) >= 0.06 || s.dAcc <= -0.08) return 'Storm'
  return 'Shifting'
}

export async function planRetune(): Promise<{ signals: ShiftSignals; proposed: ProposedChange }>{
  const signals = computeSignals()
  const severity = classifyWeather(signals)
  const cur = await getCurrentModel()

  // Recompute calibration bins and candidate metrics using existing trainer over last 7d
  const { candidate, deltas } = await runTrainer()
  const versionFrom = cur.version
  const versionTo = Math.max(candidate.version, cur.version + 1)

  // Decision threshold: trust trainer's selection if within range else grid-search placeholder via trainer outputs
  let threshold = candidate.threshold
  if (threshold < 0.4 || threshold > 0.7) threshold = Math.min(0.7, Math.max(0.4, threshold))

  // Nudge weights toward recent correctness signals: we rely on trainer-optimized weights, then clamp ±0.1 vs current
  const nudged: Record<string, number> = { ...cur.weights }
  for (const k of Object.keys(nudged)) {
    const target = (candidate.weights as any)[k] ?? nudged[k]
    const delta = Math.max(-0.1, Math.min(0.1, target - nudged[k]))
    nudged[k] = Number((nudged[k] + delta).toFixed(4))
  }

  const proposed: ProposedChange = {
    versionFrom,
    versionTo,
    reason: `Auto-retune due to signals: psiProb=${signals.psiProb.toFixed(3)}, psiFeat=${signals.psiFeatures.toFixed(3)}, dECE=${signals.dECE.toFixed(3)}, dAcc=${signals.dAcc.toFixed(3)}`,
    severity,
    newThreshold: threshold,
    newWeights: nudged,
    newCalibrationBins: candidate.calibrationBins,
    expected: candidate.metricsAtBuild
  }

  return { signals, proposed }
}


