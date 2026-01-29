export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'all'
export type Badge = 'HOT' | 'COOLING' | 'NEW' | 'RECOMMENDED'
export type BeatType = 'Hook' | 'CTA' | 'Benefit' | 'Steps'

export interface Beat {
	id: string
	type: BeatType
	text: string
	startSeconds?: number
	endSeconds?: number
}

export interface Script {
	id: string
	text: string
	beats?: Beat[]
}

export interface Stats {
	views: number
	uses: number
	examples: number
}

export interface TemplateKernelTemplate {
	id: string
	title: string
	description?: string
	badges?: Badge[]
	successRate: number // 0..1
	stats: Stats
	platformBest?: Platform
	trendingTag?: string
	previewVideoUrl?: string
	tags?: string[]
	category?: string
	niche?: string
}

export interface FeatureVector {
	[key: string]: number | string | boolean
}

export interface AudioRef {
	id: string
	title: string
	artist?: string
	label?: string
}

export interface Variant {
	id: string
	templateId: string
	version?: string
	script?: Script
	featureVector?: FeatureVector
	audio?: AudioRef
}

export interface FixSuggestion {
	id: string
	title: string
	description?: string
	impactPercent: number
	confidencePercent?: number
	timeEstimateMinutes?: number
	severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface Prediction {
	id: string
	templateId?: string
	variantId?: string
	viralScore: number // 0..100
	successRate: number // 0..1
	platformScores?: { tiktok?: number; instagram?: number; youtube?: number }
	reasons?: string[]
	fixes?: FixSuggestion[]
}

export interface Experiment {
	id: string
	templateId: string
	variantIds: string[]
	status: 'draft' | 'active' | 'completed'
	winnerVariantId?: string
}

export interface Outcome {
	id: string
	variantId: string
	postedAt: string
	predictedReach?: number
	actualReach?: number
	completionRate?: number // 0..1
	engagement?: { ctr?: number; saves?: number; shares?: number }
}

export interface CalibrationRun {
	id: string
	startedAt: string
	endedAt: string
	accuracyPercent?: number
	f1Score?: number
	meanError?: number
	calibrationPercent?: number
}

export type KernelEventType =
	| 'TemplateSelected'
	| 'VariantCreated'
	| 'DraftUploaded'
	| 'ScriptUpdated'
	| 'FeaturesExtracted'
	| 'PredictionScored'
	| 'FixSuggested'
	| 'OptimizationApplied'
	| 'ABTestStarted'
	| 'VariantScheduled'
	| 'OutcomeIngested'
	| 'ModelRecalibrated'
	| 'ValidationRunCompleted'

export interface KernelEvent {
	type: KernelEventType
	timestamp: string
	templateId?: string
	variantId?: string
	payload?: Record<string, unknown>
}

export interface TemplateKernelRoot {
	version: 'v1'
}

export const exampleTemplate: TemplateKernelTemplate = {
	id: 'tpl_mistake_prevention',
	title: 'Mistake Prevention',
	successRate: 0.91,
	stats: { views: 2800000, uses: 1680000, examples: 28 },
	platformBest: 'youtube',
	badges: ['HOT'],
	trendingTag: 'Trending',
	tags: ['Before/After', 'Visual Hook', 'Transformation']
}

export const examplePrediction: Prediction = {
	id: 'pred_tpl_mistake_prevention_v1',
	templateId: 'tpl_mistake_prevention',
	viralScore: 84,
	successRate: 0.84,
	platformScores: { tiktok: 92, instagram: 88, youtube: 84 },
	reasons: ['Hook strength', 'Trend match'],
	fixes: [
		{
			id: 'fix_move_hook',
			title: 'Strengthen hook timing',
			description: 'Move main hook 2 seconds earlier for better retention',
			impactPercent: 12,
			confidencePercent: 94,
			timeEstimateMinutes: 5,
			severity: 'CRITICAL'
		}
	]
}









