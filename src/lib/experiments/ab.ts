import type { Experiment } from './types'

function hash(str: string): number { let h=2166136261; for (let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h = Math.imul(h, 16777619) } return (h>>>0) }

export function assignAB(exp: Experiment, subjectId?: string, videoId?: string): string {
  const key = `${exp.id}|${subjectId||''}|${videoId||''}`
  const h = hash(key)
  const r = (h % 10000) / 10000
  const per = 1 / Math.max(1, exp.variants.length)
  const idx = Math.min(exp.variants.length-1, Math.floor(r / per))
  return exp.variants[idx].id
}


