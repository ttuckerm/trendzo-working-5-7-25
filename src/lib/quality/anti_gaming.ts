import { startOfHour } from 'date-fns'

export type QualityInput = {
	videoId?: string
	platform?: 'tiktok' | 'instagram' | 'youtube'
	viewCount: number
	likeCount: number
	commentCount: number
	shareCount: number
	hoursSinceUpload?: number
	// Optional time-series windows for stronger signals
	window?: {
		points: Array<{
			ts: string
			views: number
			likes?: number
			comments?: number
			shares?: number
			referrer?: string | null
		}>
	}
	referrers?: Array<{ source: string; pct: number }>
}

export type QualityResult = {
	qualityFactor: number
	flags: string[]
	snapshot: any
}

export type QualityReasons = {
	reasons: {
		view_spike_low_engagement?: number
		bot_comments?: number
		ratio_anomaly?: number
		pod_pattern?: number
		suspicious_referrer?: number
	}
	weight: number
}

/**
 * Compute anti-gaming quality factor in [0.90, 1.10] and detection flags.
 * Flags:
 * - view_spike_low_eng
 * - pod_pattern
 * - bot_comment_burst
 * - ratio_anomaly
 * - suspicious_referrer
 */
export function computeQualityFactor(input: QualityInput): QualityResult {
	const flags: string[] = []
	let factorPenalty = 0
	let factorBonus = 0

	const views = Math.max(1, Number(input.viewCount || 0))
	const likes = Math.max(0, Number(input.likeCount || 0))
	const comments = Math.max(0, Number(input.commentCount || 0))
	const shares = Math.max(0, Number(input.shareCount || 0))
	const hours = Math.max(1, Number(input.hoursSinceUpload || 1))

	const likeRate = likes / views
	const commentRate = comments / views
	const shareRate = shares / views

	// 1) View spike with low engagement: sharp jump in views not matched by engagement
	if (input.window && Array.isArray(input.window.points) && input.window.points.length >= 4) {
		const pts = input.window.points
		const last = pts.slice(-4)
		const v = last.map(p => p.views)
		const deltas = v.slice(1).map((x, i) => x - v[i])
		const maxDelta = Math.max(...deltas)
		const avgDelta = deltas.reduce((s, x) => s + x, 0) / Math.max(1, deltas.length)
		const spike = maxDelta > Math.max(5000, 5 * avgDelta)
		const likeIncrements = last.slice(1).map((p, i) => (p.likes || 0) - (last[i].likes || 0))
		const shareIncrements = last.slice(1).map((p, i) => (p.shares || 0) - (last[i].shares || 0))
		const engAvg = (likeIncrements.reduce((s, x) => s + x, 0) + shareIncrements.reduce((s, x) => s + x, 0)) / Math.max(1, likeIncrements.length)
		if (spike && engAvg < 0.002 * maxDelta) {
			flags.push('view_spike_low_eng')
			factorPenalty += 0.04
		}
	} else {
		// Fallback heuristic using aggregate rates
		if (views > 10000 && likeRate < 0.01 && shareRate < 0.002) {
			flags.push('view_spike_low_eng')
			factorPenalty += 0.03
		}
	}

	// 2) Pod pattern: unusually high like:comment ratio bands indicative of engagement pods
	const likeToComment = comments > 0 ? likes / comments : likes > 0 ? 50 : 0
	if (likes > 200 && comments > 5 && (likeToComment > 40 || likeToComment < 0.5)) {
		flags.push('ratio_anomaly')
		factorPenalty += 0.02
	}
	// Narrow time-band commenting bursts relative to likes
	if (input.window && input.window.points.length >= 6) {
		const byHour = new Map<string, number>()
		for (const p of input.window.points) {
			const key = startOfHour(new Date(p.ts)).toISOString()
			byHour.set(key, (byHour.get(key) || 0) + Number(p.comments || 0))
		}
		const counts = Array.from(byHour.values())
		const maxHour = Math.max(...counts, 0)
		const avgHour = counts.length ? counts.reduce((s, x) => s + x, 0) / counts.length : 0
		if (maxHour > Math.max(20, 5 * avgHour)) {
			flags.push('bot_comment_burst')
			factorPenalty += 0.03
		}
	}

	// 3) Engagement pod signal: high likes early with suppressed comments/shares over first hour
	if (hours <= 2 && likes > 200 && (commentRate < 0.0005 || shareRate < 0.0005)) {
		flags.push('pod_pattern')
		factorPenalty += 0.03
	}

	// 4) Suspicious referrer distribution
	if (Array.isArray(input.referrers) && input.referrers.length) {
		const suspicious = input.referrers.find(r => /clickfarm|bot|unknown|paid-network/i.test(r.source) && r.pct >= 0.25)
		if (suspicious) {
			flags.push('suspicious_referrer')
			factorPenalty += 0.03
		}
	}

	// 5) Light positive signal: organic share-to-like strength
	if (shares >= 10 && likes > 0 && shares / likes > 0.15) {
		factorBonus += 0.01
	}

	const rawFactor = 1.0 - factorPenalty + factorBonus
	const qualityFactor = Math.max(0.90, Math.min(1.10, Number(rawFactor.toFixed(3))))

	const snapshot = {
		video_id: input.videoId || null,
		platform: input.platform || null,
		metrics: { views, likes, comments, shares, hours },
		rates: { likeRate, commentRate, shareRate, likeToComment },
		window_points: input.window?.points?.length || 0,
		referrers: input.referrers || null,
		computed: { factorPenalty: Number(factorPenalty.toFixed(3)), factorBonus: Number(factorBonus.toFixed(3)) }
	}

	return { qualityFactor, flags, snapshot }
}

/**
 * Extended structured reasons mapping + overall weight for anti-gaming signals.
 * Backward-compatible: uses the same internal heuristics as computeQualityFactor.
 */
export function computeQualityReasons(input: QualityInput): QualityReasons {
	const base = computeQualityFactor(input)
	const reasons: QualityReasons['reasons'] = {}
	for (const f of base.flags) {
		if (f === 'view_spike_low_eng') reasons.view_spike_low_engagement = (reasons.view_spike_low_engagement || 0) + 1
		if (f === 'bot_comment_burst') reasons.bot_comments = (reasons.bot_comments || 0) + 1
		if (f === 'ratio_anomaly') reasons.ratio_anomaly = (reasons.ratio_anomaly || 0) + 1
		if (f === 'pod_pattern') reasons.pod_pattern = (reasons.pod_pattern || 0) + 1
		if (f === 'suspicious_referrer') reasons.suspicious_referrer = (reasons.suspicious_referrer || 0) + 1
	}
	// Convert qualityFactor [0.90..1.10] to weight in [-1..+1]
	const weight = Number(((base.qualityFactor - 1.0) / 0.10).toFixed(3))
	return { reasons, weight }
}








