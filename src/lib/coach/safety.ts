import { classifySafety } from '@/lib/safety/brand_policy'
import type { CoachInput, CoachSuggestion } from './types'

export function filterUnsafe(input: CoachInput, suggestions: CoachSuggestion[]): CoachSuggestion[] {
	function isUnsafe(text: string): boolean {
		try {
			const s = classifySafety({ caption: input.caption||'', transcript: input.scriptText||'', hashtags: [], frameworkTokens: [] })
			return s.policy_risk === 'high' || s.reasons.includes('hate')
		} catch { return false }
	}
	return suggestions.filter(s => {
		const combined = `${s.edit.scriptText||''} ${s.edit.caption||''}`
		return !isUnsafe(combined)
	})
}


