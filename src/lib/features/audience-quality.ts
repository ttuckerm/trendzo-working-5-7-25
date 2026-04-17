/**
 * Audience Quality Features — follower/engagement signals for XGBoost VPS prediction
 *
 * Extracts 5 features from onboarding_profiles describing the creator's audience
 * characteristics. These are relatively static compared to trajectory features,
 * but capture the baseline audience context that affects viral potential.
 *
 * Data source: onboarding_profiles (follower_count, creator_stage)
 * + prediction_runs aggregates (avg engagement from actuals)
 */

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export interface AudienceQualityFeatures {
  /** log10(follower_count) — compresses range. 10K=4.0, 1M=6.0. */
  follower_count_log: number
  /** Estimated engagement rate 0-1. Default 0.03 (3%). */
  engagement_rate_estimate: number
  /** Normalized follower growth rate -1 to 1. 0 if no history. */
  follower_growth_velocity: number
  /** nano=1, micro=2, mid=3, macro=4, mega=5 */
  audience_size_tier: number
  /** Composite quality score 0-100 */
  follower_quality_score: number
}

export const AUDIENCE_FEATURE_NAMES = [
  'follower_count_log',
  'engagement_rate_estimate',
  'follower_growth_velocity',
  'audience_size_tier',
  'follower_quality_score',
] as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any

function getServiceClient(): DB {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

function classifyTier(followers: number): number {
  if (followers >= 2_000_000) return 5 // mega
  if (followers >= 500_000) return 4   // macro
  if (followers >= 100_000) return 3   // mid
  if (followers >= 10_000) return 2    // micro
  return 1                              // nano
}

/**
 * Extract audience quality features for a creator.
 *
 * Uses onboarding_profiles for follower_count, and prediction_runs
 * aggregates for engagement estimation where available.
 */
export async function extractAudienceFeatures(
  creatorId: string,
  db?: DB,
): Promise<AudienceQualityFeatures> {
  const defaults: AudienceQualityFeatures = {
    follower_count_log: 0,
    engagement_rate_estimate: 0.03,
    follower_growth_velocity: 0,
    audience_size_tier: 1,
    follower_quality_score: 50,
  }

  if (!creatorId) return defaults

  const client = db || getServiceClient()

  try {
    // Get profile data
    const { data: profile } = await client
      .from('onboarding_profiles')
      .select('follower_count, creator_stage')
      .eq('user_id', creatorId)
      .single()

    const followerCount = profile?.follower_count || 0

    // ── follower_count_log ──────────────────────────────────────────
    const followerLog = Math.log10(Math.max(followerCount, 1))

    // ── audience_size_tier ──────────────────────────────────────────
    const sizeTier = classifyTier(followerCount)

    // ── engagement_rate_estimate ────────────────────────────────────
    // Estimate from prediction_runs actuals: (likes + comments) / views
    let engagementRate = 0.03 // default 3%
    try {
      const { data: engagementRows } = await client
        .from('prediction_runs')
        .select('actual_views, actual_likes, actual_comments')
        .eq('creator_id', creatorId)
        .not('actual_views', 'is', null)
        .gt('actual_views', 0)
        .order('created_at', { ascending: false })
        .limit(20)

      if (engagementRows && engagementRows.length >= 2) {
        let totalEngagement = 0
        let totalViews = 0
        for (const r of engagementRows) {
          totalEngagement += (r.actual_likes || 0) + (r.actual_comments || 0)
          totalViews += r.actual_views || 0
        }
        if (totalViews > 0) {
          engagementRate = Math.max(0, Math.min(1, totalEngagement / totalViews))
        }
      }
    } catch {
      // prediction_runs may not have these columns populated — use default
    }

    // ── follower_growth_velocity ────────────────────────────────────
    // Estimate from prediction_runs: compare follower count across runs
    let growthVelocity = 0
    try {
      const { data: followerHistory } = await client
        .from('prediction_runs')
        .select('actual_follower_count, created_at')
        .eq('creator_id', creatorId)
        .not('actual_follower_count', 'is', null)
        .gt('actual_follower_count', 0)
        .order('created_at', { ascending: true })
        .limit(10)

      if (followerHistory && followerHistory.length >= 2) {
        const oldest = followerHistory[0].actual_follower_count
        const newest = followerHistory[followerHistory.length - 1].actual_follower_count
        if (oldest > 0) {
          growthVelocity = Math.max(-1, Math.min(1, (newest - oldest) / oldest))
        }
      }
    } catch {
      // Column may not exist — use default
    }

    // ── follower_quality_score ──────────────────────────────────────
    // Weighted composite: engagement (40%) + reach (30%) + growth (30%)
    const engagementComponent = engagementRate * 40 // 0-1 * 40 = 0-40
    const reachComponent = (followerLog / 7) * 30   // log10(10M)=7 → 0-30
    const growthComponent = (growthVelocity * 0.5 + 0.5) * 30 // -1..1 → 0..1 → 0-30
    const qualityScore = Math.max(0, Math.min(100,
      engagementComponent + reachComponent + growthComponent,
    ))

    return {
      follower_count_log: Math.round(followerLog * 10000) / 10000,
      engagement_rate_estimate: Math.round(engagementRate * 10000) / 10000,
      follower_growth_velocity: Math.round(growthVelocity * 10000) / 10000,
      audience_size_tier: sizeTier,
      follower_quality_score: Math.round(qualityScore * 100) / 100,
    }
  } catch (err) {
    console.warn('[audience-quality] Error for creator', creatorId, err)
    return defaults
  }
}
