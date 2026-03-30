export const DRIFT_THRESHOLDS = {
	REL_CHANGE: 0.35,
	ABS_CHANGE: 0.05,
	RANK_SHIFT: 3,
	MIN_SUPPORT: 500
}

export type DriftFeature =
	| 'zScoreNormalized'
	| 'engagementScore'
	| 'platformWeight'
	| 'decayFactor'
	| 'frameworkContribution'
	| 'transcriptFeatures'
	| 'telemetryAlignment'
	| 'timingScore'
	| 'personalizationFactor'
	| 'simulatorFactor'
	| 'distributionFactor'
	| 'calibrationImpact'
	| 'qualityFactor'
	| 'safetyPenalty'

export const DRIFT_FEATURES: DriftFeature[] = [
	'zScoreNormalized',
	'engagementScore',
	'platformWeight',
	'decayFactor',
	'frameworkContribution',
	'transcriptFeatures',
	'telemetryAlignment',
	'timingScore',
	'personalizationFactor',
	'simulatorFactor',
	'distributionFactor',
	'calibrationImpact',
	'qualityFactor',
	'safetyPenalty'
]


