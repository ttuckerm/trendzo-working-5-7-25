export type ScriptFeatures = {
  hook_phrases: string[]
  claim_strength: number
  cta_intent: number
  readability: number
  sentiment: number
  novelty: number
  hook_match_strength: number
}

const HOOK_PATTERNS: RegExp[] = [
  /here's the (secret|truth|reason)/i,
  /nobody talks about/i,
  /stop scrolling/i,
  /you won't believe/i,
  /the (one|only) thing/i,
  /before you (buy|do)/i
]

const CTA_PATTERNS: RegExp[] = [
  /follow (me|for)/i,
  /like (and|&)? (share|save)?/i,
  /subscribe/i,
  /link in bio/i
]

export function extractScriptFeatures(text: string): ScriptFeatures {
  const t = (text || '').toString()
  const words = t.split(/\s+/).filter(Boolean)
  const len = words.length || 1
  const sentences = t.split(/[.!?]+/).filter(Boolean).length || 1
  const avgSentenceLen = len / sentences
  const readability = Math.max(0, Math.min(1, 1 - Math.abs(avgSentenceLen - 14) / 20))

  const hooks: string[] = []
  let hookScore = 0
  for (const re of HOOK_PATTERNS) {
    if (re.test(t)) { hooks.push(re.source); hookScore += 1 }
  }
  const ctaHits = CTA_PATTERNS.reduce((s, re) => s + (re.test(t) ? 1 : 0), 0)
  const cta_intent = Math.max(0, Math.min(1, ctaHits / 3))

  // Claim strength: presence of numbers, absolutes, superlatives
  const absHits = ((t.match(/(always|never|best|worst|guarantee|must)/gi) || []).length)
  const numHits = ((t.match(/\b\d+\b/g) || []).length)
  const claim_strength = Math.max(0, Math.min(1, (absHits * 0.2) + (numHits * 0.05)))

  // Simple sentiment: positive minus negative lexicon ratio
  const pos = ((t.match(/(great|amazing|love|win|success|easy|free|save)/gi) || []).length)
  const neg = ((t.match(/(bad|hate|fail|hard|expensive|risk|danger)/gi) || []).length)
  const sentiment = Math.max(-1, Math.min(1, (pos - neg) / Math.max(1, pos + neg)))

  // Novelty heuristic: unique 3-gram ratio
  const grams = new Set<string>()
  for (let i=0;i<words.length-2;i++) grams.add([words[i],words[i+1],words[i+2]].join(' ').toLowerCase())
  const novelty = Math.max(0, Math.min(1, grams.size / Math.max(1, len)))

  const hook_match_strength = Math.max(0, Math.min(1, hookScore / 3))

  return { hook_phrases: hooks, claim_strength, cta_intent, readability, sentiment, novelty, hook_match_strength }
}


