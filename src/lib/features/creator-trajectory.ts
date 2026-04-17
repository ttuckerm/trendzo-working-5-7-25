/**
 * Creator Trajectory Features — momentum signals for XGBoost VPS prediction
 *
 * Extracts 5 features describing a creator's trajectory at the time a video was posted.
 * These are NOT static profile features — they capture momentum, consistency, and
 * recency of viral performance relative to the video's post date.
 *
 * Used by the feature-matrix-builder to augment the 58 content features.
 */

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export interface CreatorTrajectoryFeatures {
  /** Linear regression slope of VPS actuals over last 30 days. Range: -1 to 1. */
  creator_momentum_30d: number
  /** Rolling 90-day average actual VPS. */
  creator_avg_vps_90d: number
  /** Days since last video scored above 70 VPS. 365 if never. */
  creator_viral_recency: number
  /** Inverted std deviation of VPS actuals (100 - stddev). Clamped 0-100. */
  creator_consistency_score: number
  /** Encoded trajectory: declining=0, stable=1, improving=2 */
  creator_trajectory_label: number
}

export const CREATOR_FEATURE_NAMES = [
  'creator_momentum_30d',
  'creator_avg_vps_90d',
  'creator_viral_recency',
  'creator_consistency_score',
  'creator_trajectory_label',
] as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any

function getServiceClient(): DB {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

/**
 * Extract creator trajectory features relative to a video's post date.
 *
 * All queries use windows BEFORE videoPostDate to prevent data leakage —
 * the model only sees what was known at the time of posting.
 */
export async function extractCreatorFeatures(
  creatorId: string,
  videoPostDate: Date,
  db?: DB,
): Promise<CreatorTrajectoryFeatures> {
  const client = db || getServiceClient()

  // Default/fallback values
  const defaults: CreatorTrajectoryFeatures = {
    creator_momentum_30d: 0,
    creator_avg_vps_90d: 50,
    creator_viral_recency: 365,
    creator_consistency_score: 50,
    creator_trajectory_label: 1, // stable
  }

  if (!creatorId) return defaults

  try {
    // Query the 90-day window of actuals (30-day is a subset)
    const ninetyDaysAgo = new Date(videoPostDate)
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: runs, error } = await client
      .from('prediction_runs')
      .select('actual_dps, dps_v2_display_score, created_at')
      .eq('creator_id', creatorId)
      .lt('created_at', videoPostDate.toISOString())
      .gte('created_at', ninetyDaysAgo.toISOString())
      .not('actual_dps', 'is', null)
      .order('created_at', { ascending: true })

    if (error || !runs || runs.length === 0) return defaults

    // Use dps_v2_display_score if available, else actual_dps
    const actuals = runs.map((r: { actual_dps: number; dps_v2_display_score?: number; created_at: string }) => ({
      score: r.dps_v2_display_score ?? r.actual_dps,
      date: new Date(r.created_at),
    }))

    // ── creator_avg_vps_90d ──────────────────────────────────────────
    const scores90d = actuals.map((a: { score: number }) => a.score)
    const avg90d = scores90d.reduce((sum: number, s: number) => sum + s, 0) / scores90d.length

    // ── creator_consistency_score ────────────────────────────────────
    let consistency = 50
    if (scores90d.length >= 2) {
      const mean = avg90d
      const variance = scores90d.reduce((sum: number, s: number) => sum + (s - mean) ** 2, 0) / scores90d.length
      const stddev = Math.sqrt(variance)
      consistency = Math.max(0, Math.min(100, 100 - stddev))
    }

    // ── creator_momentum_30d (linear regression slope) ───────────────
    const thirtyDaysAgo = new Date(videoPostDate)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recent30d = actuals.filter((a: { date: Date }) => a.date >= thirtyDaysAgo)

    let momentum = 0
    if (recent30d.length >= 3) {
      // Simple linear regression: y = mx + b, normalize m to -1..1
      const n = recent30d.length
      const xs = recent30d.map((_: unknown, i: number) => i)
      const ys = recent30d.map((a: { score: number }) => a.score)
      const xMean = xs.reduce((s: number, x: number) => s + x, 0) / n
      const yMean = ys.reduce((s: number, y: number) => s + y, 0) / n
      const numerator = xs.reduce((s: number, x: number, i: number) => s + (x - xMean) * (ys[i] - yMean), 0)
      const denominator = xs.reduce((s: number, x: number) => s + (x - xMean) ** 2, 0)
      const slope = denominator !== 0 ? numerator / denominator : 0
      // Normalize: slope is in VPS-per-index-step. Divide by score range to get -1..1
      const range = Math.max(Math.max(...ys) - Math.min(...ys), 1)
      momentum = Math.max(-1, Math.min(1, slope / range))
    }

    // ── creator_viral_recency ────────────────────────────────────────
    // Query the most recent run above 70 VPS before videoPostDate
    const { data: viralRun } = await client
      .from('prediction_runs')
      .select('created_at')
      .eq('creator_id', creatorId)
      .lt('created_at', videoPostDate.toISOString())
      .or('actual_dps.gte.70,dps_v2_display_score.gte.70')
      .not('actual_dps', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)

    let viralRecency = 365
    if (viralRun && viralRun.length > 0) {
      const daysSince = Math.floor(
        (videoPostDate.getTime() - new Date(viralRun[0].created_at).getTime()) / (1000 * 60 * 60 * 24),
      )
      viralRecency = Math.max(0, daysSince)
    }

    // ── creator_trajectory_label ─────────────────────────────────────
    let trajectoryLabel = 1 // stable
    if (momentum > 0.15) trajectoryLabel = 2 // improving
    else if (momentum < -0.15) trajectoryLabel = 0 // declining

    return {
      creator_momentum_30d: Math.round(momentum * 10000) / 10000,
      creator_avg_vps_90d: Math.round(avg90d * 100) / 100,
      creator_viral_recency: viralRecency,
      creator_consistency_score: Math.round(consistency * 100) / 100,
      creator_trajectory_label: trajectoryLabel,
    }
  } catch (err) {
    console.error(`[creator-trajectory] Error for creator ${creatorId}:`, err)
    return defaults
  }
}
