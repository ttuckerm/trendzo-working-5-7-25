export type SafetyInput = {
	caption?: string
	transcript?: string
	soundTokens?: string[]
	hashtags?: string[]
	frameworkTokens?: string[]
}

export type SafetyResult = {
	brand_safety: 'PG' | 'M' | 'MA'
	policy_risk: 'low' | 'medium' | 'high'
	reasons: string[]
}

const LISTS = {
	violence: [/\bkill|murder|assault|shoot|stab|blood|gore\b/i],
	hate: [/\bslur|racist|nazi|kkk|lynch|white\s*power\b/i],
	nudity: [/\bnude|nsfw|porn|sex|explicit|onlyfans|boobs|nipples?\b/i],
	ipMusic: [/\bunlicensed|copyright|dmca|illegal\s*music|pirated\b/i],
	medical: [/\bcure\b.*\bcancer\b|\bmiracle\b.*\bweight\s*loss\b|\bno\s*side\s*effects\b/i],
	politicalAd: [/\bpaid\s*for\s*by\b.*(campaign|committee)|\bpolitical\s*ad\b/i]
}

function containsAny(text: string, patterns: RegExp[]): boolean {
	return patterns.some(rx => rx.test(text))
}

export function classifySafety(input: SafetyInput): SafetyResult {
	const textParts: string[] = []
	if (input.caption) textParts.push(input.caption)
	if (input.transcript) textParts.push(input.transcript)
	if (Array.isArray(input.soundTokens)) textParts.push(input.soundTokens.join(' '))
	if (Array.isArray(input.hashtags)) textParts.push(input.hashtags.join(' '))
	if (Array.isArray(input.frameworkTokens)) textParts.push(input.frameworkTokens.join(' '))
	const text = textParts.join(' ').slice(0, 10000)

	const reasons: string[] = []
	let brand: SafetyResult['brand_safety'] = 'PG'
	let risk: SafetyResult['policy_risk'] = 'low'

	if (containsAny(text, LISTS.violence)) { reasons.push('violence'); brand = 'M'; risk = 'medium' }
	if (containsAny(text, LISTS.hate)) { reasons.push('hate'); brand = 'MA'; risk = 'high' }
	if (containsAny(text, LISTS.nudity)) { reasons.push('nudity'); brand = brand === 'MA' ? 'MA' : 'M'; risk = risk === 'high' ? 'high' : 'medium' }
	if (containsAny(text, LISTS.ipMusic)) { reasons.push('IP/music-risk'); risk = risk === 'high' ? 'high' : 'medium' }
	if (containsAny(text, LISTS.medical)) { reasons.push('medical-claim'); risk = risk === 'high' ? 'high' : 'medium'; brand = brand === 'MA' ? 'MA' : 'M' }
	if (containsAny(text, LISTS.politicalAd)) { reasons.push('political-ad'); risk = 'high' }

	// Deduplicate reasons and cap lengths
	const uniq = Array.from(new Set(reasons)).slice(0, 10)
	return { brand_safety: brand, policy_risk: risk, reasons: uniq }
}












