import type { RankerItem } from '@/lib/recs/cap320/ranker'

export type ExploreStrategy = 'ucb' | 'thompson'

export interface ExplorationConfig {
  strategy: ExploreStrategy
  budgetFraction: number // fraction of topK eligible for exploration (0..0.5)
  minCandidates: number
  perCohortGuard?: (item: RankerItem) => boolean
  seed?: number
}

function seededRandom(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    // xorshift32
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 1_000_000) / 1_000_000
  }
}

function thompsonScore(item: RankerItem, rnd: () => number): number {
  // Beta approximation from calibrated share_prob and CI width as pseudo counts
  const p = item.scores.share_prob
  const w = Math.max(0.05, Math.min(0.2, item.ci.share_prob.width))
  const n = Math.max(10, Math.round(400 * (1 - w)))
  const alpha = 1 + Math.max(1, Math.round(p * n))
  const beta = 1 + Math.max(1, n - Math.round(p * n))
  // Sample beta(alpha, beta) via inverse CDF approximation (simple for dev)
  // Fallback: mean + noise scaled by variance
  const mean = alpha / (alpha + beta)
  const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1))
  return mean + (rnd() - 0.5) * Math.sqrt(variance) * 3
}

function ucbScore(item: RankerItem): number {
  const p = item.scores.share_prob
  const w = Math.max(0.05, Math.min(0.2, item.ci.share_prob.width))
  const bonus = 0.5 * (w / 0.2) // larger width => larger bonus
  return p + bonus
}

export interface ExplorationResult {
  items: RankerItem[]
  promoted: string[]
  demoted: string[]
  explore_id: string
}

export function applyExploration(
  ranked: RankerItem[],
  topK: number,
  cfg: ExplorationConfig
): ExplorationResult {
  const explore_id = `explore_${Date.now()}`
  const items = ranked.slice(0, topK).map(it => ({ ...it }))
  const budget = Math.max(0, Math.min(Math.floor(topK * cfg.budgetFraction), Math.floor(topK * 0.5)))
  if (budget === 0) return { items, promoted: [], demoted: [], explore_id }

  const rnd = seededRandom(cfg.seed ?? (Date.now() & 0xffffffff))
  // Eligible pool: next minCandidates below topK plus high-uncertainty within topK
  const tailPool = ranked.slice(topK, topK + Math.max(cfg.minCandidates, budget * 2))
  const insidePool = items.filter(it => it.ci.share_prob.width > 0.12)
  const candidatesPool = [...insidePool, ...tailPool]
    .filter((it, idx, arr) => arr.findIndex(x => x.id === it.id) === idx)
    .filter(it => (cfg.perCohortGuard ? cfg.perCohortGuard(it) : true))
  if (candidatesPool.length === 0) return { items, promoted: [], demoted: [], explore_id }

  // Score by strategy
  const scored = candidatesPool.map(it => ({
    id: it.id,
    s:
      cfg.strategy === 'thompson'
        ? thompsonScore(it, rnd)
        : ucbScore(it),
    item: it
  }))
  scored.sort((a, b) => b.s - a.s)
  const picks = scored.slice(0, budget).map(x => x.item)

  const promotedIds = new Set<string>()
  const demotedIds = new Set<string>()

  // Replace the last `budget` positions in topK with exploration picks
  const replaceIdxStart = Math.max(0, topK - picks.length)
  for (let i = replaceIdxStart, j = 0; i < topK && j < picks.length; i++, j++) {
    const replacing = items[i]
    const pick = picks[j]
    if (replacing && replacing.id !== pick.id) {
      demotedIds.add(replacing.id)
      promotedIds.add(pick.id)
      items[i] = { ...pick, rank: i + 1 }
    }
  }

  // Re-number ranks and keep consistent
  for (let i = 0; i < items.length; i++) items[i].rank = i + 1

  return {
    items,
    promoted: Array.from(promotedIds),
    demoted: Array.from(demotedIds),
    explore_id
  }
}


