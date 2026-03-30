export type ScriptFeatures = {
  words: number
  chars: number
  sentences: number
  avgWordsPerSentence: number
  questions: number
  exclaims: number
  numbers: number
  listOpeners: number
  imperativeVerbs: string[]
  ctaDetected: boolean
  beforeAfterDetected: boolean
  mythTruthDetected: boolean
  povDetected: boolean
  readingScore: number
  sentimentLite: number
  uniqueNgrams: number
  keywordHits: string[]
}

const STOPWORDS = new Set<string>([
  'the','a','an','and','or','but','to','of','in','on','for','with','is','are','was','were','it','that','this','at','by','as','be','from','if','then','so','just','very'
])

const IMPERATIVE_VERBS = [
  'stop','do','try','use','avoid','start','add','save','share','follow','subscribe','click','buy','learn','watch','read','ask','build','fix','improve','optimize','steal','copy'
]

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

export function extractScriptFeatures(text: string): ScriptFeatures {
  const raw = text || ''
  const tokens = tokenize(raw)
  const contentTokens = tokens.filter(t => !STOPWORDS.has(t))
  const words = contentTokens.length
  const chars = raw.length
  const sentences = Math.max(1, (raw.match(/[.!?]+/g) || []).length)
  const avgWordsPerSentence = words / sentences
  const questions = (raw.match(/\?/g) || []).length
  const exclaims = (raw.match(/!/g) || []).length
  const numbers = (raw.match(/\b\d+\b/g) || []).length
  const listOpeners = (raw.match(/\b(top|steps|reasons|tips|list|#\d)\b/gi) || []).length
  const imperativeVerbs = Array.from(new Set(contentTokens.filter(t => IMPERATIVE_VERBS.includes(t))))
  const ctaDetected = /\b(follow|subscribe|save|share|comment|like|dm|link in bio)\b/i.test(raw)
  const beforeAfterDetected = /\bbefore\b[\s\S]*\bafter\b/i.test(raw)
  const mythTruthDetected = /\bmyth\b[\s\S]*\btruth\b/i.test(raw) || /\bactually\b/i.test(raw)
  const povDetected = /\bpov\b/i.test(raw) || /^pov[:\s]/i.test(raw)

  // Flesch-like heuristic (shorter sentences + shorter words => easier). Normalize to 0..1 where higher = easier
  const totalSyllablesApprox = tokens.reduce((sum, t) => sum + Math.max(1, Math.ceil(t.replace(/[^aeiouy]/g, '').length / 2)), 0)
  const ASL = tokens.length / Math.max(1, sentences)
  const ASW = totalSyllablesApprox / Math.max(1, tokens.length)
  const flesch = 206.835 - 1.015 * ASL - 84.6 * ASW
  const readingScore = Math.max(0, Math.min(1, (flesch + 50) / 100))

  // Sentiment-lite: positive with exclaims and benefit words, negative with negations
  const positiveHits = (raw.match(/\b(win|easy|best|fast|save|boost|grow|success|viral)\b/gi) || []).length + exclaims
  const negativeHits = (raw.match(/\bno|not|never|hard|worse|bad\b/gi) || []).length
  const sentimentLite = Math.max(-1, Math.min(1, (positiveHits - negativeHits) / 10))

  const uniqueNgrams = computeUniqueNgrams(contentTokens, 3)

  const keywordHits = Array.from(new Set([
    ...((raw.match(/\b(how to|steps|tips|myth|truth|before|after|framework|follow|subscribe)\b/gi) || []).map(s=>s.toLowerCase()))
  ]))

  return {
    words,
    chars,
    sentences,
    avgWordsPerSentence,
    questions,
    exclaims,
    numbers,
    listOpeners,
    imperativeVerbs,
    ctaDetected,
    beforeAfterDetected,
    mythTruthDetected,
    povDetected,
    readingScore,
    sentimentLite,
    uniqueNgrams,
    keywordHits
  }
}

function computeUniqueNgrams(tokens: string[], n: number): number {
  const set = new Set<string>()
  for (let i = 0; i <= tokens.length - n; i++) {
    set.add(tokens.slice(i, i + n).join(' '))
  }
  return set.size
}








































































































































