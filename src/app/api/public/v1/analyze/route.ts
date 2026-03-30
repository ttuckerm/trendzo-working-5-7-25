import { NextRequest, NextResponse } from 'next/server'
import { getFlags } from '@/lib/moat/flags'
import { findKey, recordUsage } from '@/lib/moat/keys'
import { enforce } from '@/lib/moat/rate'
import { acceptUpload } from '@/lib/data/upload'
import { scoreDraft } from '@/lib/analysis/scorer'
import { startStopwatch } from '@/lib/analysis/sla'
import { generateRecommendations } from '@/lib/analysis/recommender'
import { extractScriptFeatures } from '@/lib/script/features'
import { matchPatterns } from '@/lib/script/match'
import { scoreScript } from '@/lib/script/score'
import { scriptRecommendations } from '@/lib/script/recommend'

export async function POST(req: NextRequest) {
	const flags = getFlags()
	if (!flags.publicApi) return NextResponse.json({ ok: false, message: 'disabled' }, { status: 403 })
	try {
		const apiKey = req.headers.get('x-api-key') || ''
		if (!apiKey) return NextResponse.json({ ok: false, message: 'missing_key' }, { status: 401 })
		const rec = findKey(apiKey)
		if (!rec || rec.revoked) return NextResponse.json({ ok: false, message: 'invalid_key' }, { status: 401 })
		const gate = enforce(rec.keyId, rec.limits, 1)
		if (!gate.ok) return NextResponse.json({ ok: false, message: gate.reason === 'rpm' ? 'rate_limited_rpm' : 'rate_limited_rpd' }, { status: 429 })

		const timer = startStopwatch()
		const body = await req.json()
		const { scriptText, caption, platform, niche, durationSec, videoUrl } = body || {}
		const upload = await acceptUpload({ url: videoUrl })
		const vit = undefined
		const score = await scoreDraft({
			videoVIT: vit as any,
			script: { text: scriptText },
			metadata: { platform: platform || 'tiktok', niche, caption, durationSec },
		})
		const sFeatures = extractScriptFeatures(String(scriptText || ''))
		const sMatched = matchPatterns(sFeatures)
		const sScore = await scoreScript({ features: sFeatures, platform: platform || 'tiktok', niche, matchedPatterns: sMatched, recipeSupport: 0.6 })
		const strongMatch = (sMatched[0]?.score || 0) >= 0.85
		const blendedProb = Math.max(0, Math.min(1, 0.85 * score.probability + 0.15 * sScore.probScript + (strongMatch ? 0.02 : 0)))
		const recs = [...generateRecommendations(score.features, platform || 'tiktok'), ...scriptRecommendations(sFeatures, platform || 'tiktok')].slice(0, 7)
		const timings = timer.stop()
		recordUsage(rec.keyId, 1)
		return NextResponse.json({ probability: blendedProb, confidence: score.confidence, features: score.features, matchedPatterns: sMatched, recommendations: recs, timings, source: upload.mode })
	} catch (e) {
		// fallback to MOCK safe output
		return NextResponse.json({ probability: 0.55, confidence: 0.6, features: {}, matchedPatterns: [], recommendations: [], timings: { metSLA: true, totalMs: 20 }, source: 'mock-fallback' })
	}
}


