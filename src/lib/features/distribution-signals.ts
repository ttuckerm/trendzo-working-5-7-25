/**
 * Distribution Signal Features — posting strategy signals for XGBoost VPS prediction
 *
 * Extracts 6 features from scraped_videos distribution columns (post timing,
 * hashtag strategy, sound selection, early velocity). NULL columns produce
 * neutral 50 defaults — no penalty for missing data.
 */

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export interface DistributionFeatures {
  /** 0-100: how optimal was the posting hour */
  post_hour_score: number
  /** 0-100: how optimal was the posting day */
  post_day_score: number
  /** 0-100: composite hashtag quality */
  hashtag_strategy_score: number
  /** 0-100: sound selection quality */
  sound_advantage_score: number
  /** 0-100: normalized early engagement velocity */
  early_velocity_signal: number
  /** 0-100: weighted average of all distribution signals */
  distribution_composite: number
}

export const DISTRIBUTION_FEATURE_NAMES = [
  'post_hour_score',
  'post_day_score',
  'hashtag_strategy_score',
  'sound_advantage_score',
  'early_velocity_signal',
  'distribution_composite',
] as const

const NEUTRAL = 50

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any

function getServiceClient(): DB {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

// TikTok posting hour quality (0-23 UTC). Peak: 6-9am, 12-2pm, 7-11pm.
// These are global averages — actual optimal times vary by niche/audience timezone.
const HOUR_SCORES: number[] = [
  40, 35, 20, 20, 20, 30,  // 0-5am: dead zone
  80, 90, 90, 85,           // 6-9am: morning peak
  70, 75,                   // 10-11am: near-peak
  90, 85, 75,               // 12-2pm: lunch peak
  70, 70, 70,               // 3-5pm: moderate
  75, 85, 90, 90, 80, 60,  // 6-11pm: evening peak
]

// TikTok engagement by day of week (ISO: 0=Mon, 6=Sun)
const DAY_SCORES: number[] = [
  65, // Mon
  85, // Tue
  75, // Wed
  85, // Thu
  85, // Fri
  75, // Sat
  55, // Sun
]

// Views-at-1h benchmarks by audience_size_tier
const VELOCITY_BENCHMARKS: Record<number, number> = {
  1: 500,    // nano (<10K followers)
  2: 2000,   // micro (10K-100K)
  3: 8000,   // mid (100K-500K)
  4: 25000,  // macro (500K-2M)
  5: 80000,  // mega (>2M)
}

/**
 * Extract distribution features for a video from its scraped_videos distribution columns.
 *
 * All NULL columns produce neutral 50 — the model treats missing distribution data
 * as "average", not as a penalty. Features improve as more data is scraped.
 */
export async function extractDistributionFeatures(
  videoId: string,
  audienceSizeTier?: number,
  db?: DB,
): Promise<DistributionFeatures> {
  const defaults: DistributionFeatures = {
    post_hour_score: NEUTRAL,
    post_day_score: NEUTRAL,
    hashtag_strategy_score: NEUTRAL,
    sound_advantage_score: NEUTRAL,
    early_velocity_signal: NEUTRAL,
    distribution_composite: NEUTRAL,
  }

  if (!videoId) return defaults

  const client = db || getServiceClient()

  try {
    const { data: video, error } = await client
      .from('scraped_videos')
      .select('posted_hour_utc, posted_day_of_week, hashtag_count, hashtag_niche_count, has_fyp_hashtag, hashtag_specificity_score, sound_type, sound_is_trending, sound_age_days, views_at_1h')
      .eq('video_id', videoId)
      .single()

    if (error || !video) return defaults

    // ── post_hour_score ─────────────────────────────────────────────
    const postHourScore = video.posted_hour_utc != null
      ? HOUR_SCORES[video.posted_hour_utc] || NEUTRAL
      : NEUTRAL

    // ── post_day_score ──────────────────────────────────────────────
    const postDayScore = video.posted_day_of_week != null
      ? DAY_SCORES[video.posted_day_of_week] || NEUTRAL
      : NEUTRAL

    // ── hashtag_strategy_score ──────────────────────────────────────
    let hashtagScore = NEUTRAL
    if (video.hashtag_count != null) {
      const count = video.hashtag_count as number
      // Count quality: 3-7 is optimal
      let countScore: number
      if (count >= 3 && count <= 7) countScore = 100
      else if ((count >= 1 && count <= 2) || (count >= 8 && count <= 10)) countScore = 70
      else countScore = 40

      // Niche relevance
      const nicheCount = (video.hashtag_niche_count as number) || 0
      const nicheScore = count > 0 ? (nicheCount / count) * 100 : 0

      // Composite with FYP penalty
      hashtagScore = countScore * 0.4 + nicheScore * 0.45 + 30 * 0.15
      if (video.has_fyp_hashtag) {
        hashtagScore *= 0.85 // FYP hashtags are oversaturated — slight penalty
      }
      hashtagScore = Math.max(0, Math.min(100, hashtagScore))
    }

    // ── sound_advantage_score ───────────────────────────────────────
    let soundScore = NEUTRAL
    if (video.sound_type != null) {
      const soundType = video.sound_type as string
      const soundAge = (video.sound_age_days as number) || 999

      if (soundType === 'trending' && soundAge < 14) soundScore = 90
      else if (soundType === 'trending' && soundAge <= 30) soundScore = 70
      else if (soundType === 'trending') soundScore = 55
      else if (soundType === 'original') soundScore = 60
      else if (soundType === 'licensed') soundScore = 50
      else soundScore = 45

      if (video.sound_is_trending) {
        soundScore = Math.min(100, soundScore + 10)
      }
    }

    // ── early_velocity_signal ───────────────────────────────────────
    let velocitySignal = NEUTRAL
    if (video.views_at_1h != null) {
      const views1h = video.views_at_1h as number
      const tier = audienceSizeTier || 1
      const benchmark = VELOCITY_BENCHMARKS[tier] || 500
      velocitySignal = Math.min(100, Math.round((views1h / benchmark) * 100))
    }

    // ── distribution_composite ──────────────────────────────────────
    const composite =
      postHourScore * 0.15 +
      postDayScore * 0.10 +
      hashtagScore * 0.35 +
      soundScore * 0.25 +
      velocitySignal * 0.15

    return {
      post_hour_score: Math.round(postHourScore * 100) / 100,
      post_day_score: Math.round(postDayScore * 100) / 100,
      hashtag_strategy_score: Math.round(hashtagScore * 100) / 100,
      sound_advantage_score: Math.round(soundScore * 100) / 100,
      early_velocity_signal: Math.round(velocitySignal * 100) / 100,
      distribution_composite: Math.round(composite * 100) / 100,
    }
  } catch (err) {
    console.warn('[distribution-signals] Error for video', videoId, err)
    return defaults
  }
}
