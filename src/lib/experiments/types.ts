export type Objective = 'viral48h'
export type Mode = 'ab'|'bandit'
export type Status = 'running'|'paused'|'stopped'|'winner'

export type Variant = {
  id: string
  name: string
  meta?: Record<string, any>
}

export type Guardrails = {
  maxImpressions?: number
  minSamples?: number
  minLift?: number
  maxDays?: number
}

export type Experiment = {
  id: string
  name: string
  createdAtISO: string
  mode: Mode
  objective: Objective
  status: Status
  variants: Variant[]
  autopilot?: boolean
  guardrails?: Guardrails
  winnerVariantId?: string | null
  deployed?: boolean
}

export type Assignment = { experimentId: string; variantId: string; subjectId?: string; videoId?: string; assignedAtISO: string }

export type Report = { experimentId: string; variantId: string; impressions?: number; clicks?: number; views48h?: number; viral?: boolean; atISO?: string }

export type VariantSummary = {
  variantId: string
  name: string
  impressions: number
  successes: number
  successRate: number
  ciLow: number
  ciHigh: number
  samples: number
}

export type ExperimentSummary = {
  experiment: Experiment
  totals: { impressions: number; successes: number }
  variants: VariantSummary[]
  pBest: Record<string, number>
  winnerVariantId?: string | null
  deployed?: boolean
}


