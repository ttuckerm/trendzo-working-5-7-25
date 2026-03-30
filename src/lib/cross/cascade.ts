import { source } from '@/lib/data'
import type { VIT } from '@/lib/vit/vit'
import { isSameVideo, videoSignature, normalizeHandle } from './identity'

export type Cascade = {
  id: string
  signature: string
  creator: string
  nodes: Array<{ platform: 'tiktok'|'instagram'|'youtube'; videoId: string; publishedAtISO: string; viral: boolean; views48h: number }>
  lags: { tikTokToIG?: number; igToYT?: number; tikTokToYT?: number }
  leader: 'tiktok'|'instagram'|'youtube'
  crossSR: number
}

function toKey(v: VIT): string {
  const sig = videoSignature(v)
  return `${sig.textSig}|${sig.audioSig}|${sig.durationBucket}`
}

function isViral(v: VIT): boolean {
  const label = v.validation48h?.label
  if (label) return label === 'viral'
  const pct = v.baselines?.percentile ?? 0
  return pct >= 95
}

function views48(v: VIT): number {
  const m48 = v.metrics.find(m => m.window === '48h')
  return m48?.views ?? 0
}

export async function buildCascadesRaw(windowDays = 30, niche?: string, creator?: string): Promise<Cascade[]> {
  // Collect videos over the window using source.list pagination
  let cursor: string | undefined = undefined
  const collected: VIT[] = []
  const cutoff = Date.now() - windowDays * 24 * 3600 * 1000
  for (let i = 0; i < 20; i++) {
    const { items, nextCursor } = await source.list({ cursor, limit: 200, order: 'recent' })
    const filtered = items.filter(v => new Date(v.publishTs).getTime() >= cutoff)
    collected.push(...filtered)
    if (!nextCursor) break
    cursor = nextCursor
  }
  const rows = collected.filter(v => (!niche || v.niche === niche) && (!creator || normalizeHandle((v as any).creatorHandle || (v as any).creatorId) === normalizeHandle(creator)))
  // Group by signature heuristic, then per creator
  const groups = new Map<string, VIT[]>()
  for (const v of rows) {
    const key = toKey(v)
    const exist = groups.get(key)
    if (exist) exist.push(v); else groups.set(key, [v])
  }
  // Merge by isSameVideo for safety: split groups if mixed
  const cascades: Cascade[] = []
  for (const [key, vids] of groups) {
    const buckets: VIT[][] = []
    for (const v of vids) {
      let placed = false
      for (const b of buckets) {
        if (isSameVideo(v, b[0])) { b.push(v); placed = true; break }
      }
      if (!placed) buckets.push([v])
    }
    for (const bucket of buckets) {
      if (bucket.length < 2) continue
      // Compute leader and lags
      const sorted = [...bucket].sort((a,b) => +new Date(a.publishTs) - +new Date(b.publishTs))
      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      const leader = first.platform
      const tiktok = sorted.find(v => v.platform === 'tiktok')
      const ig = sorted.find(v => v.platform === 'instagram')
      const yt = sorted.find(v => v.platform === 'youtube')
      const lag = (a?: VIT, b?: VIT): number | undefined => (a && b) ? Math.max(0, Math.round((+new Date(b.publishTs) - +new Date(a.publishTs)) / 3600000)) : undefined
      const lags = { tikTokToIG: lag(tiktok, ig), igToYT: lag(ig, yt), tikTokToYT: lag(tiktok, yt) }
      const nodes = sorted.map(v => ({ platform: v.platform, videoId: v.platformVideoId, publishedAtISO: v.publishTs, viral: isViral(v), views48h: views48(v) }))
      const creatorId = normalizeHandle((first as any).creatorHandle || (first as any).creatorId || '')
      // Cross-template success rate estimate: success rate of same template id across platforms in 30d
      const tplId = first.template?.id
      let crossSR = 0
      if (tplId) {
        const tplSet = rows.filter(x => x.template?.id === tplId)
        const successes = tplSet.filter(x => isViral(x)).length
        crossSR = tplSet.length ? successes / tplSet.length : 0
      }
      cascades.push({ id: `${key}:${creatorId}`, signature: key, creator: creatorId, nodes, lags, leader: leader as any, crossSR: Number(crossSR.toFixed(3)) })
    }
  }
  return cascades
}


