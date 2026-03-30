import { VIT } from '@/lib/vit/vit'
import { FRAMEWORK_DSL, FrameworkRule, DurationBucket } from './dsl'
import crypto from 'crypto'

export interface Features {
  durationBucket: DurationBucket
  hasList: boolean
  hasNumbers: boolean
  hasQuestion: boolean
  hasPOV: boolean
  hasReveal: boolean
  hasHowTo: boolean
  hasCTA: boolean
  audioType: 'original' | 'music' | 'unknown'
  niche?: string
  platform: string
  tokens: string[]
}

const STOPWORDS = new Set(['the','a','an','and','or','but','to','of','in','on','for','with','is','are','was','were','it','that','this','at','by'])

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !STOPWORDS.has(t))
}

export function durationBucketFromSeconds(sec?: number): DurationBucket {
  if (!sec || sec < 15) return '<15s'
  if (sec <= 45) return '15-45s'
  return '>45s'
}

export function featuresFromVIT(v: VIT): Features {
  const cap = (v.caption || '').toLowerCase()
  const transcript = (v.script?.transcript || '').toLowerCase()
  const text = `${cap} ${transcript}`
  const tokens = tokenize(text)
  const has = (re: RegExp) => re.test(text)
  const durationBucket = durationBucketFromSeconds(v.durationSec)
  const hasList = /\b(steps|list|reasons|tips)\b/i.test(text)
  const hasNumbers = /\b\d+\b/.test(text)
  const hasQuestion = /\?/.test(text) || /^why\b/i.test(cap)
  const hasPOV = /\bpov\b/i.test(text)
  const hasReveal = /\b(reveal|before\s*after|big reveal)\b/i.test(text)
  const hasHowTo = /^how\s*to\b/i.test(cap)
  const hasCTA = /\b(follow|like|subscribe|save|share)\b/i.test(text)
  const audioType: Features['audioType'] = v.audio?.isOriginal ? 'original' : (v.audio?.title ? 'music' : 'unknown')
  return {
    durationBucket,
    hasList,
    hasNumbers,
    hasQuestion,
    hasPOV,
    hasReveal,
    hasHowTo,
    hasCTA,
    audioType,
    niche: v.niche,
    platform: v.platform,
    tokens,
  }
}

function scoreFramework(rule: FrameworkRule, features: Features, cap: string, transcript: string): number {
  let score = 0
  const weights = rule.weights

  if (rule.signals.captionRegex?.length) {
    const m = rule.signals.captionRegex.some((r) => r.test(cap))
    if (m) score += weights.caption
  }
  if (rule.signals.transcriptRegex?.length) {
    const m = rule.signals.transcriptRegex.some((r) => r.test(transcript))
    if (m) score += weights.transcript
  }
  if (rule.signals.requiredKeywords?.length) {
    const set = new Set(features.tokens)
    const all = rule.signals.requiredKeywords.every((kw) => set.has(kw.toLowerCase()))
    if (all) score += weights.keywords
  } else if (rule.signals.anyKeywords?.length) {
    const set = new Set(features.tokens)
    const any = rule.signals.anyKeywords.some((kw) => set.has(kw.toLowerCase()))
    if (any) score += weights.keywords
  }

  if (rule.signals.structure) {
    const s = rule.signals.structure
    let struct = 0
    if (s.duration && s.duration.includes(features.durationBucket)) struct += 0.25
    if (s.hasList && features.hasList) struct += 0.25
    if (s.hasQuestion && features.hasQuestion) struct += 0.25
    if (s.hasPOV && features.hasPOV) struct += 0.25
    if (s.hasReveal && features.hasReveal) struct += 0.25
    if (s.hasHowTo && features.hasHowTo) struct += 0.25
    score += Math.min(1, struct) * weights.structure
  }

  return score
}

export function matchFrameworks(features: Features, caption: string = '', transcript: string = ''): Array<{ id: string; score: number; name: string }> {
  const cap = caption.toLowerCase()
  const trans = transcript.toLowerCase()
  const scored = FRAMEWORK_DSL.map((r) => ({ id: r.id, name: r.name, score: scoreFramework(r, features, cap, trans) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, 3)
}

export function signatureFrom(v: VIT, matches: Array<{ id: string; score: number; name: string }>, features?: Features): { templateId: string; displayName: string } {
  const primary = matches[0]?.id || 'generic'
  const qualifier: string[] = []
  if (/pov/.test(primary)) qualifier.push('POV Hook')
  if (/fast/.test(primary)) qualifier.push('Fast Cut')
  const bucket = durationBucketFromSeconds(v.durationSec)
  const f = features || { hasReveal: false, hasList: false } as any
  const raw = `${primary}|${bucket}|${v.platform}|${f.hasReveal ? 1 : 0}|${f.hasList ? 1 : 0}`
  const templateId = crypto.createHash('sha1').update(raw).digest('hex')
  const displayName = `${matches[0]?.name || 'Template'}${qualifier.length ? ' + ' + qualifier.join(' + ') : ''}`
  return { templateId, displayName }
}


