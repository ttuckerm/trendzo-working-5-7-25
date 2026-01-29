import { VIT } from '@/lib/vit/vit'
import { matchFrameworks, featuresFromVIT, tokenize } from '@/lib/templates/extract'

export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'linkedin'

export interface ScriptInput {
  text?: string
}

export interface MetadataInput {
  platform: Platform
  niche?: string
  durationSec?: number
  fps?: number
  caption?: string
}

export interface FeatureSummary {
  durationSec: number
  fpsApprox: number
  estimatedCuts: number
  pacing: 'slow' | 'medium' | 'fast'
  hookStrength: number
  captionDensity: number
  hasCTA: boolean
  keywordMatches: Array<{ id: string; score: number; name: string }>
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function estimateFpsFromText(text: string | undefined): number {
  if (!text) return 30
  if (/cinematic|b-roll/i.test(text)) return 24
  if (/gaming|fps|screen capture/i.test(text)) return 60
  return 30
}

function estimateCuts(script: string | undefined, caption: string | undefined, durationSec: number): number {
  const text = `${caption || ''} ${script || ''}`
  const punctuationCuts = (text.match(/[.!?]/g) || []).length
  const keywordCuts = (text.match(/cut|scene|then|next|first|second|third/gi) || []).length
  const base = punctuationCuts + keywordCuts
  const normalized = Math.round(clamp(base, 0, 30) * (durationSec > 0 ? clamp(durationSec / 30, 0.5, 2) : 1))
  return normalized
}

function estimatePacing(estimatedCuts: number, durationSec: number): 'slow' | 'medium' | 'fast' {
  const cutsPerMin = durationSec > 0 ? (estimatedCuts / durationSec) * 60 : 0
  if (cutsPerMin >= 40) return 'fast'
  if (cutsPerMin >= 20) return 'medium'
  return 'slow'
}

function computeCaptionDensity(caption?: string): number {
  if (!caption) return 0
  const words = caption.trim().split(/\s+/).length
  return clamp(words / 40, 0, 1)
}

function detectCTA(text?: string): boolean {
  if (!text) return false
  return /(follow|like|subscribe|save|share|comment|link\s+in\s+bio|check\s+description)/i.test(text)
}

function computeHookStrength(script?: string, caption?: string): number {
  const firstEight = (script || caption || '').split(/\s+/).slice(0, 20).join(' ')
  let score = 0
  if (/what if|you won't believe|stop scrolling|here's why|the secret|nobody tells you|mistakes/i.test(firstEight)) score += 0.5
  if (/\?|!/.test(firstEight)) score += 0.2
  if (/^how\s+to|^the\s+truth|^do\s+this|^watch\s+this/i.test(firstEight)) score += 0.2
  const lengthPenalty = firstEight.split(/\s+/).length > 35 ? -0.2 : 0
  return clamp(score + lengthPenalty, 0, 1)
}

export function extractFeatures(args: { videoVIT?: VIT; script?: ScriptInput; metadata?: MetadataInput }): FeatureSummary {
  const v = args.videoVIT
  const scriptText = args.script?.text || v?.script?.transcript || ''
  const caption = args.metadata?.caption ?? v?.caption ?? ''
  const durationSec = args.metadata?.durationSec ?? v?.durationSec ?? 0
  const fps = args.metadata?.fps ?? estimateFpsFromText(scriptText)

  // Framework matches using existing DSL
  const vitForFeatures: VIT | undefined = v
  const f = vitForFeatures ? featuresFromVIT(vitForFeatures) : {
    durationBucket: durationSec <= 0 ? '<15s' : durationSec <= 45 ? '15-45s' : '>45s',
    hasList: /\b(steps|list|reasons|tips)\b/i.test(scriptText),
    hasNumbers: /\b\d+\b/.test(scriptText),
    hasQuestion: /\?/.test(scriptText),
    hasPOV: /\bpov\b/i.test(scriptText),
    hasReveal: /\b(reveal|before\s*after|big reveal)\b/i.test(scriptText),
    hasHowTo: /^how\s*to\b/i.test(caption),
    hasCTA: detectCTA(`${caption} ${scriptText}`),
    audioType: 'unknown',
    niche: args.metadata?.niche,
    platform: (args.metadata?.platform || 'tiktok') as string,
    tokens: tokenize(`${caption} ${scriptText}`)
  } as any

  const frameworkMatches = matchFrameworks(f, caption, scriptText)
  const estimatedCuts = estimateCuts(scriptText, caption, durationSec)
  const pacing = estimatePacing(estimatedCuts, durationSec)
  const captionDensity = computeCaptionDensity(caption)
  const hasCTA = detectCTA(`${caption} ${scriptText}`)
  const hookStrength = computeHookStrength(scriptText, caption)

  return {
    durationSec,
    fpsApprox: fps,
    estimatedCuts,
    pacing,
    hookStrength,
    captionDensity,
    hasCTA,
    keywordMatches: frameworkMatches
  }
}


