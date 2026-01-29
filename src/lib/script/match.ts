import { ScriptFeatures } from './features'
import { SCRIPT_PATTERNS } from './patterns'

export function matchPatterns(features: ScriptFeatures): { id: string; score: number }[] {
  const candidates: { id: string; score: number }[] = []
  const add = (id: string, s: number) => candidates.push({ id, score: Math.max(0, Math.min(1, s)) })

  const hasNumbers = features.numbers > 0
  const hasQuestion = features.questions > 0
  const hasBeforeAfter = features.beforeAfterDetected
  const hasMythTruth = features.mythTruthDetected
  const pov = features.povDetected
  const listy = features.listOpeners > 0
  const cta = features.ctaDetected
  const imperative = features.imperativeVerbs.length > 0

  // Rules
  if (hasQuestion && hasNumbers) add('list_of_n', 0.9)
  if (hasQuestion && !hasNumbers) add('question_reveal', 0.8)
  if (listy) add('list_of_n', 0.8)
  if (hasBeforeAfter) add('before_after', 0.9)
  if (hasMythTruth) add('myth_truth', 0.85)
  if (pov) add('pov', 0.8)
  if (cta) add('cta_forward', 0.7)
  if (imperative && features.words < 150) add('problem_demo', 0.7)
  if (features.sentimentLite > 0.3 && features.keywordHits.includes('framework')) add('framework_teaser', 0.7)

  // Fallbacks with lighter weights
  if (candidates.length === 0) {
    if (features.avgWordsPerSentence <= 18) add('tutorial_3_steps', 0.55)
    else add('storytime_hook', 0.5)
  }

  // Normalize by template presence in library (ensure valid IDs)
  const ids = new Set(SCRIPT_PATTERNS.map(p => p.id))
  const filtered = candidates.filter(c => ids.has(c.id))
  filtered.sort((a, b) => b.score - a.score)
  return filtered.slice(0, 3)
}








































































































































