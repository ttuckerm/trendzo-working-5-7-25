// Central Virality Contract (single import path)
// Provides consistent category thresholds and classification helpers.

export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'linkedin'
export type Niche = 'business' | 'creator' | 'fitness' | 'education' | 'general'

export type ViralityCategory = 'mega-viral' | 'hyper-viral' | 'viral' | 'trending' | 'normal'

export interface CategoryThresholds {
  megaViral: number
  hyperViral: number
  viral: number
  trending: number
}

export interface ViralityThresholdSpec {
  // Percentile thresholds in [0,100]
  percentile: CategoryThresholds
  // Optional probability thresholds in [0,1]
  probability?: CategoryThresholds
  // Optional engagement rate thresholds in [0,1]
  engagementRate?: CategoryThresholds
  // Window used for evaluation in hours (default 48)
  windowHours: number
}

export interface ThresholdInput {
  platform: Platform
  niche?: Niche | string | null
  windowHours?: number
}

import { getNicheOverrides } from './niche_overrides'

const BASE_PERCENTILE_THRESHOLDS: CategoryThresholds = {
  megaViral: 99.9,
  hyperViral: 99.0,
  viral: 95.0,
  trending: 90.0
}

const BASE_PROB_THRESHOLDS: CategoryThresholds = {
  // Mirrors historical usage to avoid regressions
  megaViral: 0.999,
  hyperViral: 0.99,
  viral: 0.95,
  trending: 0.90
}

export function getViralityThresholds(input: ThresholdInput): ViralityThresholdSpec {
  const windowHours = input.windowHours ?? 48
  const overrides = getNicheOverrides(input.platform, input.niche || undefined, windowHours)
  return {
    percentile: overrides.percentile ?? BASE_PERCENTILE_THRESHOLDS,
    probability: overrides.probability ?? BASE_PROB_THRESHOLDS,
    engagementRate: overrides.engagementRate,
    windowHours
  }
}

export function classifyByPercentile(
  percentile: number,
  input: ThresholdInput
): ViralityCategory {
  const t = getViralityThresholds(input).percentile
  if (percentile >= t.megaViral) return 'mega-viral'
  if (percentile >= t.hyperViral) return 'hyper-viral'
  if (percentile >= t.viral) return 'viral'
  if (percentile >= t.trending) return 'trending'
  return 'normal'
}

export function classifyByProbability(
  probability: number,
  input: ThresholdInput
): ViralityCategory {
  const t = getViralityThresholds(input).probability || BASE_PROB_THRESHOLDS
  if (probability >= t.megaViral) return 'mega-viral'
  if (probability >= t.hyperViral) return 'hyper-viral'
  if (probability >= t.viral) return 'viral'
  if (probability >= t.trending) return 'trending'
  return 'normal'
}

export function classifyByPercentileAndZ(
  percentile: number,
  zScore: number,
  input: ThresholdInput
): { category: ViralityCategory; threshold: string; confidence: 'high' | 'medium' | 'low' } {
  // Primary decision by percentile thresholds; z-score refines confidence and docs threshold
  const category = classifyByPercentile(percentile, input)
  const thresholds = getViralityThresholds(input).percentile
  let threshold = `${percentile.toFixed(1)}th percentile`
  if (category === 'mega-viral') threshold = `Top ${100 - thresholds.megaViral}% (z≥3.0)`
  else if (category === 'hyper-viral') threshold = `Top ${100 - thresholds.hyperViral}% (z≥2.5)`
  else if (category === 'viral') threshold = `Top ${100 - thresholds.viral}% (z≥2.0)`
  else if (category === 'trending') threshold = `Top ${100 - thresholds.trending}% (z≥1.5)`

  let confidence: 'high' | 'medium' | 'low' = 'low'
  if (Math.abs(zScore) >= 2.0) confidence = 'high'
  else if (Math.abs(zScore) >= 1.0) confidence = 'medium'

  return { category, threshold, confidence }
}

export function isGodModeEnabled(): boolean {
  // Keep God Mode behind a dev flag; evaluation paths should keep this false
  return process.env.ENABLE_GOD_MODE === '1'
}



