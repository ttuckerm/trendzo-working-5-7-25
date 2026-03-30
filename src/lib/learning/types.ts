export type LearningModel = {
  version: number
  createdAtISO: string
  parentVersion?: number
  weights: { hook:number; clarity:number; pacing:number; novelty:number; platformFit:number; socialProof:number }
  calibrationBins: Array<{ lo:number; hi:number; frac:number; count:number }>
  threshold: number
  notes?: string
  metricsAtBuild: { accuracy:number; auroc:number; ece:number; brier:number; validated:number }
}

export type LearningSummary = {
  currentVersion: number
  candidateVersion?: number
  lastUpdateISO: string
  accuracyTrend: Array<{ day:string; accuracy:number; validated:number }>
  driftIndex: number
  ece: number
  auroc: number
}










