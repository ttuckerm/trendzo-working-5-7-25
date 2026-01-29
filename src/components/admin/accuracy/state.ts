import { create } from 'zustand'

export type MetricsSnapshot = {
  ece: number
  auc: number
  accuracy: number
  mode?: 'dev' | 'db'
}

export type LastPrediction = {
  probability?: number
  score?: number
  cohortKey?: string
  modelVersion?: string
}

type AccuracyMetrics = {
  mode?: 'dev' | 'db'
  reliability_raw?: { x: number[]; y: number[] }
  reliability_cal?: { x: number[]; y: number[] }
  auc_raw?: number; ece_raw?: number
  auc_cal?: number; ece_cal?: number
}

type AccuracyState = {
  selectedCohort: string
  setSelectedCohort: (key: string) => void
  refreshToken: number
  bumpRefresh: () => void
  // NEW: dev/DB switch and last metrics
  devMode: boolean
  setDevMode: (v: boolean) => void
  lastMetrics?: MetricsSnapshot
  setLastMetrics: (m: MetricsSnapshot) => void
  lastPrediction?: LastPrediction | null
  setLastPrediction: (p: LastPrediction | null) => void
  metrics?: AccuracyMetrics | null
  setMetrics: (m: AccuracyMetrics | null) => void
}

export const useAccuracyStore = create<AccuracyState>((set) => ({
  selectedCohort: '',
  setSelectedCohort: (key: string) => set({ selectedCohort: key || '' }),
  refreshToken: 0,
  bumpRefresh: () => set((s) => ({ refreshToken: s.refreshToken + 1 })),
  devMode: false,
  setDevMode: (v) => set({ devMode: v }),
  lastMetrics: undefined,
  setLastMetrics: (m) => set({ lastMetrics: m }),
  lastPrediction: null,
  setLastPrediction: (p) => set({ lastPrediction: p }),
  metrics: null,
  setMetrics: (m) => set({ metrics: m })
}))


