import { extractFeatures } from '@/lib/analysis/features'
import { extractScriptFeatures } from '@/lib/script/features'
import { matchFrameworks } from '@/lib/templates/extract'
import type { CoachInput, CoachFeatures } from './types'

function platformDurationTarget(platform: string): { min: number; max: number } {
	const p = (platform||'tiktok').toLowerCase()
	if (p === 'youtube') return { min: 25, max: 60 }
	if (p === 'instagram') return { min: 15, max: 45 }
	if (p === 'linkedin') return { min: 20, max: 60 }
	return { min: 12, max: 35 }
}

export function coachFeatures(input: CoachInput): CoachFeatures {
	const af = extractFeatures({ script: { text: input.scriptText }, metadata: { platform: input.platform as any, caption: input.caption, durationSec: input.durationSec } })
	const sf = extractScriptFeatures(String(input.scriptText||''))
	const matches = matchFrameworks({
		// Minimal feature stub for matcher
		// Values mirror extract.ts expectations
		durationBucket: (input.durationSec||0) <= 0 ? '<15s' : (input.durationSec||0) <= 45 ? '15-45s' : '>45s',
		hasList: sf.listOpeners > 0,
		hasNumbers: sf.numbers > 0,
		hasQuestion: sf.questions > 0,
		hasPOV: sf.povDetected,
		hasReveal: sf.beforeAfterDetected,
		hasHowTo: /\bhow to\b/i.test(String(input.caption||'')),
		hasCTA: af.hasCTA,
		audioType: 'unknown',
		niche: input.niche,
		platform: input.platform,
		tokens: (String(input.caption||'') + ' ' + String(input.scriptText||'')).toLowerCase().split(/\s+/).filter(Boolean)
	} as any, input.caption||'', input.scriptText||'')

	const target = platformDurationTarget(input.platform)
	const durationOffTarget = typeof input.durationSec === 'number' && (input.durationSec < target.min || input.durationSec > target.max)
	const keywordMismatch = (matches[0]?.score || 0) < 0.4

	return {
		hookWeak: af.hookStrength < 0.6,
		missingCTA: !af.hasCTA,
		captionDensity: af.captionDensity,
		keywordMismatch,
		durationOffTarget,
		platformTarget: target,
		base: {
			hookStrength: af.hookStrength,
			pacing: af.pacing,
			estimatedCuts: af.estimatedCuts,
			hasCTA: af.hasCTA
		}
	}
}


