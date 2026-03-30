import type { CoachInput, CoachResult, CoachSuggestion } from './types'
import { generateAllCandidates } from './generators'
import { filterUnsafe } from './safety'
import { scoreBaseline, batchUplift } from './uplift'
import { computeUnifiedDiff, applyEdit } from './apply'

export async function suggest(input: CoachInput, k: number = 5): Promise<CoachResult> {
	try {
		const all = generateAllCandidates(input)
		const safe = filterUnsafe(input, all)
		const base = await scoreBaseline(input)
		const scored = await batchUplift(input, safe, base.probability)
		const liftById = new Map(scored.map(s=>[s.id, s]))
		const merged: CoachSuggestion[] = safe.map(s => {
			const lift = liftById.get(s.id)
			const scriptDiff = computeUnifiedDiff(input.scriptText||'', s.edit.scriptText||input.scriptText||'', 'script')
			const captionDiff = computeUnifiedDiff(input.caption||'', s.edit.caption||input.caption||'', 'caption')
			return { ...s, expectedLift: lift?.expectedLift ?? s.expectedLift, confidence: lift?.confidence ?? s.confidence, diff: `${scriptDiff}\n${captionDiff}` }
		})
		const top = merged.sort((a,b)=> (b.expectedLift||0) - (a.expectedLift||0)).slice(0, Math.max(3, Math.min(k, 5)))
		return { baselineProb: base.probability, suggestions: top, features: {
			// Minimal echo of features; rely on downstream consumers for full details
			hookWeak: (base.features?.hookStrength||0) < 0.6,
			missingCTA: !base.features?.hasCTA,
			captionDensity: base.features?.captionDensity||0,
			keywordMismatch: (base.features?.keywordMatches?.[0]?.score||0) < 0.4,
			durationOffTarget: false,
			platformTarget: { min: 0, max: 0 },
			base: {
				hookStrength: base.features?.hookStrength||0,
				pacing: base.features?.pacing||'medium',
				estimatedCuts: base.features?.estimatedCuts||0,
				hasCTA: !!base.features?.hasCTA,
			}
		} }
	} catch {
		return { baselineProb: 0, suggestions: [], features: { hookWeak:false, missingCTA:false, captionDensity:0, keywordMismatch:false, durationOffTarget:false, platformTarget:{min:0,max:0}, base:{ hookStrength:0, pacing:'medium', estimatedCuts:0, hasCTA:false } } }
	}
}

export function applySuggestion(input: CoachInput, suggestionId: string, suggestions: CoachSuggestion[]): CoachInput {
	const s = suggestions.find(x => x.id === suggestionId)
	if (!s) return input
	return applyEdit(input, s.edit)
}


