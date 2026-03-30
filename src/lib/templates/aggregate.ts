import { VIT } from '@/lib/vit/vit'
import { computeViral } from '@/lib/vit/compute'
import { featuresFromVIT, matchFrameworks, signatureFrom } from './extract'

export type WindowArg = '7d' | '30d' | '90d'

export interface TemplateAggregate {
  id: string
  name: string
  uses: number
  viralCount: number
  successRate: number
  state: 'HOT' | 'COOLING' | 'NEW'
  examples: string[]
  lastSeenTs: string
}

function withinWindow(publishTs: string, windowDays: number): boolean {
  const ts = new Date(publishTs).getTime()
  const now = Date.now()
  return ts >= now - windowDays * 24 * 3600 * 1000
}

function toDays(w: WindowArg): number {
  if (w === '7d') return 7
  if (w === '90d') return 90
  return 30
}

export function aggregateTemplates(videos: VIT[], window: WindowArg = '30d'): Map<string, TemplateAggregate> {
  const windowDays = toDays(window)
  const m = new Map<string, TemplateAggregate>()
  for (const v of videos) {
    if (!withinWindow(v.publishTs, windowDays)) continue
    const features = featuresFromVIT(v)
    const matches = matchFrameworks(features, v.caption || '', v.script?.transcript || '')
    const { templateId, displayName } = signatureFrom(v, matches, features)
    const agg = m.get(templateId) || { id: templateId, name: displayName, uses: 0, viralCount: 0, successRate: 0, state: 'NEW' as const, examples: [], lastSeenTs: v.publishTs }
    agg.uses += 1
    if (computeViral(v).viral) agg.viralCount += 1
    if (new Date(v.publishTs).getTime() > new Date(agg.lastSeenTs).getTime()) agg.lastSeenTs = v.publishTs
    if (agg.examples.length < 6) agg.examples.push(v.id)
    m.set(templateId, agg)
  }
  for (const [, agg] of m) {
    agg.successRate = agg.uses > 0 ? agg.viralCount / agg.uses : 0
    if (agg.uses < 10) agg.state = 'NEW'
    else if (agg.successRate > 0.8) agg.state = 'HOT'
    else if (agg.successRate >= 0.5) agg.state = 'COOLING'
    else agg.state = 'COOLING'
  }
  return m
}

export function sortAggregates(list: TemplateAggregate[]): TemplateAggregate[] {
  return [...list].sort((a, b) => {
    if (a.state === 'HOT' && b.state !== 'HOT') return -1
    if (b.state === 'HOT' && a.state !== 'HOT') return 1
    if (a.successRate !== b.successRate) return b.successRate - a.successRate
    if (a.uses !== b.uses) return b.uses - a.uses
    return new Date(b.lastSeenTs).getTime() - new Date(a.lastSeenTs).getTime()
  })
}
