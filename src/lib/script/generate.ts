import { SCRIPT_PATTERNS, PatternSpec } from './patterns'
import { matchPatterns } from './match'
import { extractScriptFeatures } from './features'

type Tone = 'authority'|'friendly'|'edgy'|'inspirational'

export function generateScript(input: {
  platform: string
  niche?: string
  seedIdea: string
  tone?: Tone
  lengthSecTarget?: number
  patternId?: string
}) {
  const tone = input.tone || 'friendly'
  const pattern = pickPattern(input)
  const phr = derivePhrases(input.seedIdea, tone)
  const hook = fill(select(pattern.hookTemplates), { ...phr, N: pickNumber(input.seedIdea), niche: input.niche || 'general' })
  const bodyTmpl = select(pattern.bodyTemplates)
  const steps = deriveSteps(input.seedIdea)
  const body = fill(bodyTmpl, { ...phr, ...steps, N: pickNumber(input.seedIdea), niche: input.niche || 'general' })
  const cta = buildCTA(tone, input.platform, phr)

  const full = [hook, '', body, '', cta].join('\n')
  const features = extractScriptFeatures(full)
  const matched = matchPatterns(features)
  const wpm = 135
  const durationEstimateSec = Math.max(10, Math.round((features.words / wpm) * 60))

  return {
    id: `scr_${Date.now().toString(36)}`,
    patternId: pattern.id,
    hook,
    body,
    cta,
    durationEstimateSec,
    matchedPatterns: matched,
    slots: { tone, seedIdea: input.seedIdea }
  }
}

function pickPattern(input: { platform: string; patternId?: string; seedIdea: string }) : PatternSpec {
  if (input.patternId) {
    const found = SCRIPT_PATTERNS.find(p => p.id === input.patternId)
    if (found) return found
  }
  const feats = extractScriptFeatures(input.seedIdea)
  const m = matchPatterns(feats)
  const top = m[0]?.id
  return SCRIPT_PATTERNS.find(p => p.id === top) || SCRIPT_PATTERNS[0]
}

function derivePhrases(seed: string, tone: Tone) {
  const s = seed.toLowerCase()
  const pain = s.match(/\b(stuck|slow|hard|confusing|costly|waste|low|bad)\b/)?.[0] || 'hidden friction'
  const benefit = s.match(/\b(grow|scale|save|convert|sell|learn|viral|engage)\b/)?.[0] || 'get results faster'
  const role = s.match(/\b(creator|founder|coach|marketer|dev|designer)\b/)?.[0] || 'creator'
  const topic = seed
  const truth = 'what actually works'
  const myth = 'what everyone repeats'
  const benefit1 = benefit
  const benefit2 = 'save time'
  const benefit3 = 'increase reach'
  const ctaAction = tone === 'authority' ? 'follow' : tone === 'edgy' ? 'prove me wrong and follow' : 'follow for more'
  return { pain, benefit, role, topic, truth, myth, benefit1, benefit2, benefit3, ctaAction }
}

function deriveSteps(seed: string) { 
  const base = seed.replace(/\s+/g, ' ').trim()
  return { step1: `Identify ${base}`, step2: `Apply a simple rule to ${base}`, step3: `Measure and iterate ${base}`, step4: `Share ${base}` }
}

function buildCTA(tone: Tone, platform: string, phr: any) {
  const base = tone === 'authority' ? 'Follow for proven systems' : tone === 'edgy' ? 'Follow if you disagree' : tone === 'inspirational' ? 'Save this and share with a friend' : 'Follow for more like this'
  if (platform.includes('youtube')) return `${base}. Subscribe for deep dives.`
  if (platform.includes('instagram')) return `${base}. Save this to remember.`
  return `${base}. ${capitalize(phr.benefit)} next.`
}

function select<T>(arr: T[]): T { return arr[Math.floor(arr.length * 0.37) % arr.length] }
function pickNumber(seed: string): number { const n = seed.length % 5 + 3; return n }
function capitalize(s: string){ return s.charAt(0).toUpperCase() + s.slice(1) }

function fill(tmpl: string, vars: Record<string, any>): string {
  return tmpl.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k]
    return v == null ? `{${k}}` : String(v)
  })
}








































































































































