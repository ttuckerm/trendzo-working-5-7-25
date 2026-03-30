import fs from 'fs'
import path from 'path'
import { VIT } from '@/lib/vit/vit'
import { durationBucketFromSeconds, matchFrameworks, featuresFromVIT, signatureFrom } from '@/lib/templates/extract'
import { ensureFixtures } from '@/lib/data/init-fixtures'

export type InsightItem = {
	templateId: string
	niche: string | null
	durationBucket: ReturnType<typeof durationBucketFromSeconds>
	captionSignal: string
	support: number
	successRate: number
	deltaVsBaseline: number
	PMI: number
}

function safeReadVIT(): VIT[] {
	try {
		if (process.env.MOCK === '1') try { ensureFixtures() } catch {}
		const p = path.join(process.cwd(), 'fixtures', 'videos.json')
		const arr = JSON.parse(fs.readFileSync(p, 'utf8'))
		if (!Array.isArray(arr)) return []
		return arr as VIT[]
	} catch {
		return []
	}
}

function captionSignalOf(v: VIT): string {
	const txt = (v.caption || '').toLowerCase()
	if (/how to|tutorial|guide/.test(txt)) return 'how_to'
	if (/you won'?t believe|secret|surprising/.test(txt)) return 'curiosity'
	if (/#\w+/.test(v.caption || '')) return 'hashtag_heavy'
	if ((v.script?.patterns?.[0]?.id || '').length > 0) return v.script!.patterns![0]!.id
	return 'generic'
}

function isSuccess(v: VIT): boolean {
	// Use explicit validation if present, else fall back to viral rule proxy from baselines
	if (v.validation48h?.label) return v.validation48h.label === 'viral'
	const pct = v.baselines?.percentile ?? 0
	return pct >= 95

}

export function computeUniqueInsights(topN: number = 50, pmiThreshold: number = 0.2): InsightItem[] {
	const items = safeReadVIT()
	if (items.length === 0) return []

	const total = items.length
	const successes = items.filter(isSuccess).length
	const pB = successes / total || 1e-6

	const groups = new Map<string, { key: { templateId: string; niche: string | null; durationBucket: ReturnType<typeof durationBucketFromSeconds>; captionSignal: string }; n: number; s: number }>()
	for (const v of items) {
		const feats = featuresFromVIT(v)
		const matches = matchFrameworks(feats, v.caption || '', v.script?.transcript || '')
		const sig = signatureFrom(v, matches, feats)
		const templateId = sig.templateId
		const niche = v.niche || null
		const durationBucket = durationBucketFromSeconds(v.durationSec)
		const captionSignal = captionSignalOf(v)
		const k = `${templateId}__${niche || ''}__${durationBucket}__${captionSignal}`
		const g = groups.get(k) || { key: { templateId, niche, durationBucket, captionSignal }, n: 0, s: 0 }
		g.n += 1
		if (isSuccess(v)) g.s += 1
		groups.set(k, g)
	}

	const baseline = pB
	const out: InsightItem[] = []
	for (const g of groups.values()) {
		const support = g.n
		const successRate = g.s / Math.max(1, g.n)
		const deltaVsBaseline = successRate - baseline
		const pA = g.n / total
		const pAB = g.s / total
		const PMI = Math.log2(Math.max(1e-9, pAB) / Math.max(1e-9, pA * baseline))
		if (support >= 30 && deltaVsBaseline >= 0.08 && PMI >= pmiThreshold) {
			out.push({ ...g.key, support, successRate, deltaVsBaseline, PMI })
		}
	}
	out.sort((a, b) => (b.deltaVsBaseline + 0.01 * b.PMI) - (a.deltaVsBaseline + 0.01 * a.PMI))
	return out.slice(0, topN)
}


