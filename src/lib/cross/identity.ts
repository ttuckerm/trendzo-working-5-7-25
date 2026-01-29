import type { VIT } from '@/lib/vit/vit'

export function normalizeHandle(handle?: string | null): string {
  if (!handle) return ''
  const s = String(handle).toLowerCase()
  return s.replace(/^@+/, '').replace(/[^a-z0-9]+/g, '')
}

export type VideoSignature = { textSig: string; audioSig: string; durationBucket: 'short'|'medium'|'long' }

function tokenizeCaption(caption?: string | null): string[] {
  if (!caption) return []
  return caption.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
}

function textSignatureFromTokens(tokens: string[]): string {
  if (tokens.length === 0) return ''
  // Use top 8 informative tokens excluding stopwords
  const stop = new Set(['the','and','or','for','with','this','that','you','your','what','how','why','to','of','a','is','it'])
  const filtered = tokens.filter(t => !stop.has(t) && t.length >= 3)
  const top = filtered.slice(0, 8)
  return top.join('-')
}

export function durationToBucket(sec?: number | null): VideoSignature['durationBucket'] {
  const s = Math.max(0, Number(sec || 0))
  if (s <= 20) return 'short'
  if (s <= 60) return 'medium'
  return 'long'
}

export function videoSignature(v: VIT): VideoSignature {
  const tokens = tokenizeCaption(v.caption)
  const textSig = textSignatureFromTokens(tokens)
  const audioSig = (v.audio?.id && v.audio.id !== '') ? `aud:${v.audio.id}` : `aud:${(v.caption||'').slice(0,20).toLowerCase().replace(/\s+/g,'-')}`
  const durationBucket = durationToBucket(v.durationSec)
  return { textSig, audioSig, durationBucket }
}

export function isSameVideo(a: VIT, b: VIT): boolean {
  const sa = videoSignature(a)
  const sb = videoSignature(b)
  let score = 0
  if (sa.durationBucket === sb.durationBucket) score += 1
  if (sa.audioSig && sa.audioSig === sb.audioSig) score += 2
  if (sa.textSig && sb.textSig) {
    const aa = new Set(sa.textSig.split('-'))
    const bb = new Set(sb.textSig.split('-'))
    let overlap = 0
    aa.forEach(t => { if (bb.has(t)) overlap += 1 })
    if (overlap >= 3) score += 2
    else if (overlap >= 1) score += 1
  }
  return score >= 3
}


