import { computeUniqueInsights, InsightItem } from './lift'

type CacheEntry = { ts: number; items: InsightItem[] }
const cache: Map<string, CacheEntry> = new Map()
const TTL_MS = 10 * 60 * 1000

export async function getUniqueInsightsCached(topN: number = 50): Promise<InsightItem[]> {
	const key = `default:${topN}`
	const now = Date.now()
	const hit = cache.get(key)
	if (hit && (now - hit.ts) < TTL_MS) return hit.items
	try {
		const items = computeUniqueInsights(topN)
		cache.set(key, { ts: now, items })
		return items
	} catch {
		// MOCK fallback: empty safe shape
		const items: InsightItem[] = []
		cache.set(key, { ts: now, items })
		return items
	}
}


