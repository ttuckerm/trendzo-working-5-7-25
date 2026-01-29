import { scoreDraft } from '@/lib/analysis/scorer'
import type { CoachInput, CoachSuggestion } from './types'

type UpliftResult = { baselineProb: number; variantProb: number; expectedLift: number; confidence: number }

export async function scoreBaseline(input: CoachInput): Promise<{ probability: number; confidence: number; features: any }> {
	const res = await scoreDraft({
		videoVIT: undefined as any,
		script: { text: input.scriptText },
		metadata: { platform: input.platform as any, niche: input.niche, caption: input.caption, durationSec: input.durationSec }
	})
	return { probability: res.probability, confidence: res.confidence, features: res.features }
}

export async function batchUplift(input: CoachInput, suggestions: CoachSuggestion[], baselineProb: number): Promise<Array<{ id: string; variantProb: number; expectedLift: number; confidence: number }>> {
	// Simple batching: sequential but could parallelize within Promise.all
	const out: Array<{ id: string; variantProb: number; expectedLift: number; confidence: number }> = []
	for (const s of suggestions) {
		const edited: CoachInput = {
			...input,
			scriptText: s.edit.scriptText !== undefined ? s.edit.scriptText : input.scriptText,
			caption: s.edit.caption !== undefined ? s.edit.caption : input.caption,
			durationSec: input.durationSec,
		}
		const res = await scoreDraft({
			videoVIT: undefined as any,
			script: { text: edited.scriptText },
			metadata: { platform: edited.platform as any, niche: edited.niche, caption: edited.caption, durationSec: edited.durationSec }
		})
		const variantProb = res.probability
		const expectedLift = Math.max(0, variantProb - baselineProb)
		const confidence = Math.max(0, Math.min(1, (res.confidence + 0.1)))
		out.push({ id: s.id, variantProb, expectedLift, confidence })
	}
	return out
}


