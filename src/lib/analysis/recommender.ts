import { FeatureSummary } from './features'

export interface Recommendation {
  action: string
  rationale: string
  predictedUplift: number
}

export function generateRecommendations(features: FeatureSummary, platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin'): Recommendation[] {
  const recs: Recommendation[] = []

  // Hook optimization
  if (features.hookStrength < 0.6) {
    recs.push({
      action: 'Shorten and intensify the hook to the first 3 seconds',
      rationale: 'Open with a curiosity gap or high-contrast claim to increase early retention',
      predictedUplift: 0.12
    })
  }

  // Pacing & cuts
  if (features.pacing === 'slow') {
    recs.push({
      action: 'Increase pacing: add 10–15% more cuts in the first 15s',
      rationale: 'Faster visual tempo aligns with top-quartile content in short-form feeds',
      predictedUplift: 0.08
    })
  }

  // CTA timing
  if (!features.hasCTA) {
    recs.push({
      action: 'Add an explicit CTA before the 80% mark',
      rationale: 'Clear CTAs improve conversion and downstream signals (saves, follows)',
      predictedUplift: 0.05
    })
  }

  // Captions
  if (features.captionDensity < 0.3) {
    recs.push({
      action: 'Enrich caption with 2–3 specific keywords and a benefit statement',
      rationale: 'Higher caption density raises semantic match to user intent and surfacing',
      predictedUplift: 0.06
    })
  }

  // Platform-specific tweak
  if (platform === 'youtube' && features.durationSec < 30) {
    recs.push({
      action: 'Extend to 35–45 seconds with a mini-arc (hook → build → payoff)',
      rationale: 'Shorts favor slightly longer arcs for watch-time completion',
      predictedUplift: 0.04
    })
  }

  // Ensure 3–5 items
  while (recs.length < 3) {
    recs.push({
      action: 'Add a concrete “why now” trigger in the first line',
      rationale: 'Urgency cues boost early attention and watch-through',
      predictedUplift: 0.03
    })
  }
  return recs.slice(0, 5)
}


