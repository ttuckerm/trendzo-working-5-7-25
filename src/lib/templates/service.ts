import { source } from '@/lib/data'
import { aggregateTemplates, sortAggregates, TemplateAggregate } from './aggregate'
import { cacheGet, cacheSet, readLeaderboard, readRecipeBook, writeFixtures } from './cache'

type WindowArg = '7d' | '30d' | '90d'

export async function generateRecipeBook({ window = '30d', platform, niche }: { window?: WindowArg; platform?: string; niche?: string }) {
  const cached = cacheGet(window, platform, niche)
  if (cached) return cached

  // Pull videos using source; we can paginate until a reasonable cap
  let cursor: string | undefined = undefined
  const collected: any[] = []
  for (let i = 0; i < 10; i++) {
    const { items, nextCursor } = await source.list({ cursor, limit: 200, platform, niche, order: 'recent' })
    collected.push(...items)
    if (!nextCursor) break
    cursor = nextCursor
  }

  const aggregates = aggregateTemplates(collected, window)
  const list = sortAggregates(Array.from(aggregates.values()))
  const hot = list.filter((t) => t.state === 'HOT')
  const cooling = list.filter((t) => t.state === 'COOLING' && t.uses >= 10)
  const newly = list.filter((t) => t.state === 'NEW')

  const counts = {
    hot: hot.length,
    cooling: cooling.length,
    newly: newly.length,
    uses: list.reduce((s, t) => s + t.uses, 0),
    viral: list.reduce((s, t) => s + t.viralCount, 0),
  }

  const payload = { generatedAtISO: new Date().toISOString(), counts, hot, cooling, newly }
  // Persist fixtures in mock mode
  writeFixtures(payload, list)
  cacheSet(window, platform, niche, payload)
  return payload
}

export async function getLeaderboard({ window = '30d', platform, niche, limit = 100 }: { window?: WindowArg; platform?: string; niche?: string; limit?: number }) {
  const rb = await generateRecipeBook({ window, platform, niche })
  const flat = [...rb.hot, ...rb.cooling, ...rb.newly]
  return flat.slice(0, limit)
}

export async function getTemplateDetail(id: string, { window = '30d', platform, niche }: { window?: WindowArg; platform?: string; niche?: string }) {
  const rb = await generateRecipeBook({ window, platform, niche })
  const find = [...rb.hot, ...rb.cooling, ...rb.newly].find((t: any) => t.id === id)
  if (!find) return null
  // Fetch example videos by IDs via source
  const examples = [] as any[]
  for (const vid of find.examples) {
    const v = await source.get(vid)
    if (v) examples.push(v)
  }
  return { ...find, examples }
}


