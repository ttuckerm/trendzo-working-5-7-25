export type CoachPlatform = 'tiktok' | 'instagram' | 'youtube' | 'linkedin'

export type CoachInput = {
	platform: CoachPlatform
	niche?: string
	scriptText?: string
	caption?: string
	durationSec?: number
	templateId?: string
}

export type CoachSuggestionType = 'hook_rewrite' | 'cta_insert' | 'caption_tighten' | 'hashtag_set' | 'template_swap' | 'pace_tweak'

export type CoachEdit = {
	scriptText?: string
	caption?: string
	hashtags?: string[]
	templateId?: string
	pacingHint?: 'slower' | 'faster'
}

export type CoachSuggestion = {
	id: string
	type: CoachSuggestionType
	title: string
	edit: CoachEdit
	preview: string
	diff?: string
	expectedLift: number
	confidence: number
	risks: string[]
}

export type CoachFeatures = {
	hookWeak: boolean
	missingCTA: boolean
	captionDensity: number
	keywordMismatch: boolean
	durationOffTarget: boolean
	platformTarget: { min: number; max: number }
	base: {
		hookStrength: number
		pacing: 'slow'|'medium'|'fast'
		estimatedCuts: number
		hasCTA: boolean
	}
}

export type CoachResult = {
	baselineProb: number
	suggestions: CoachSuggestion[]
	features: CoachFeatures
}


