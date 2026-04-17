/**
 * Cultural Momentum Features — trend-timing signals for XGBoost VPS prediction
 *
 * Extracts 4 features describing whether a video was posted during a detected
 * cultural wave. Uses the cultural_events table populated by Atlas Subsystem 4.
 *
 * These features capture cultural tailwinds — not content quality, but timing luck.
 */

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export interface CulturalMomentumFeatures {
  /** 0-100: how strong was relevant trend activity at post time */
  cultural_momentum_score: number
  /** rising=2, peak=3, fading=1, none=0 */
  trend_phase_encoded: number
  /** 0-100: how active was this niche overall at post time */
  niche_activation_score: number
  /** 0-1: did this video post during a detected event window */
  cultural_timing_advantage: number
}

export const CULTURAL_FEATURE_NAMES = [
  'cultural_momentum_score',
  'trend_phase_encoded',
  'niche_activation_score',
  'cultural_timing_advantage',
] as const

const DEFAULTS: CulturalMomentumFeatures = {
  cultural_momentum_score: 0,
  trend_phase_encoded: 0,
  niche_activation_score: 0,
  cultural_timing_advantage: 0,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any

const VELOCITY_WEIGHTS: Record<string, number> = {
  rising: 1.0,
  peak: 0.8,
  fading: 0.4,
}

const PHASE_ENCODING: Record<string, number> = {
  rising: 2,
  peak: 3,
  fading: 1,
}

function getServiceClient(): DB {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

/**
 * Extract cultural momentum features for a video based on its niche, topic, and post date.
 *
 * Queries cultural_events in a 14-day lookback window before videoPostDate.
 * All zeros are valid — they mean "no cultural tailwind detected."
 */
export async function extractCulturalFeatures(
  niche: string,
  topic: string,
  videoPostDate: Date,
  db?: DB,
): Promise<CulturalMomentumFeatures> {
  if (!niche) return DEFAULTS

  const client = db || getServiceClient()

  try {
    const fourteenDaysAgo = new Date(videoPostDate)
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    // Query 1: topic-matching events in this niche (or activated niches)
    // We search event_title and keywords for topic relevance
    const { data: matchingEvents, error: matchErr } = await client
      .from('cultural_events')
      .select('event_title, velocity_score, confidence, keywords, activated_niches, status')
      .or(`niche.eq.${niche},activated_niches.cs.{${niche}}`)
      .lte('created_at', videoPostDate.toISOString())
      .gte('created_at', fourteenDaysAgo.toISOString())
      .in('status', ['detected', 'approved'])
      .order('confidence', { ascending: false })
      .limit(10)

    if (matchErr) {
      console.warn('[cultural-momentum] Query error:', matchErr.message)
      return DEFAULTS
    }

    if (!matchingEvents || matchingEvents.length === 0) return DEFAULTS

    // Filter for topic relevance if topic is provided
    const topicLower = (topic || '').toLowerCase()
    const topicWords = topicLower.split(/\s+/).filter((w: string) => w.length > 3)

    let relevantEvents = matchingEvents
    if (topicWords.length > 0) {
      relevantEvents = matchingEvents.filter((e: { event_title: string; keywords: string[] }) => {
        const titleLower = (e.event_title || '').toLowerCase()
        const kwLower = (e.keywords || []).map((k: string) => k.toLowerCase())
        return topicWords.some((tw: string) =>
          titleLower.includes(tw) || kwLower.some((k: string) => k.includes(tw)),
        )
      })
    }

    // If no topic-specific matches, use all niche events (weaker signal but still valid)
    const eventsForScoring = relevantEvents.length > 0 ? relevantEvents.slice(0, 3) : []

    // ── cultural_momentum_score ─────────────────────────────────────
    let momentumScore = 0
    if (eventsForScoring.length > 0) {
      const weightedScores = eventsForScoring.map((e: { confidence: number; velocity_score: number }) => {
        // Map velocity_score to phase: >0.7 = rising, 0.3-0.7 = peak, <0.3 = fading
        const phase = e.velocity_score > 0.7 ? 'rising' : e.velocity_score > 0.3 ? 'peak' : 'fading'
        const weight = VELOCITY_WEIGHTS[phase] || 0.5
        return e.confidence * weight
      })
      momentumScore = Math.min(100, weightedScores.reduce((s: number, v: number) => s + v, 0) / weightedScores.length)
    }

    // ── trend_phase_encoded ─────────────────────────────────────────
    let trendPhase = 0
    if (eventsForScoring.length > 0) {
      const topEvent = eventsForScoring[0] as { velocity_score: number }
      const phase = topEvent.velocity_score > 0.7 ? 'rising' : topEvent.velocity_score > 0.3 ? 'peak' : 'fading'
      trendPhase = PHASE_ENCODING[phase] || 0
    }

    // ── niche_activation_score ──────────────────────────────────────
    // Count ALL events in the niche window (not just topic-relevant)
    const totalNicheEvents = matchingEvents.length
    const nicheActivation = Math.min(totalNicheEvents * 10, 100)

    // ── cultural_timing_advantage ───────────────────────────────────
    const timingAdvantage = eventsForScoring.length > 0 ? 1 : 0

    return {
      cultural_momentum_score: Math.round(momentumScore * 100) / 100,
      trend_phase_encoded: trendPhase,
      niche_activation_score: nicheActivation,
      cultural_timing_advantage: timingAdvantage,
    }
  } catch (err) {
    console.warn('[cultural-momentum] Error:', err)
    return DEFAULTS
  }
}
