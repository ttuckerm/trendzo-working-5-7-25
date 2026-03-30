export type DetectedLocale = {
	lang: 'en'|'es'|'pt'|'de'|'fr'|'it'|'id'|'hi'|'ar'|'ja'|'ko'|'zh'
	country: string
	confidence: number
}

const LANGUAGE_HINTS: Array<{ rx: RegExp; lang: DetectedLocale['lang'] }> = [
	{ rx: /[áéíóúñ¡¿]/i, lang: 'es' },
	{ rx: /[ãõç]/i, lang: 'pt' },
	{ rx: /[äöüß]/i, lang: 'de' },
	{ rx: /[àâçéèêëîïôùûüÿœ]/i, lang: 'fr' },
	{ rx: /[àèéìíîòóùú]/i, lang: 'it' },
	{ rx: /[اأإآءئة-ي]/, lang: 'ar' },
	{ rx: /[ぁ-んァ-ン]/, lang: 'ja' },
	{ rx: /[가-힣]/, lang: 'ko' },
	{ rx: /[一-龯]/, lang: 'zh' },
	{ rx: /(?:lah|banget|aja)\b/i, lang: 'id' },
	{ rx: /(?:है|क्या|आप|कैसे)\b/u, lang: 'hi' }
]

const COUNTRY_HASHTAGS: Record<string,string[]> = {
	US: ['usa','america','fyp','foryou'],
	MX: ['mexico','latam','parati'],
	BR: ['brasil','para voce','paravoce','foryoubr'],
	DE: ['deutschland','fürdich','fuerdich'],
	FR: ['france','pourtoi'],
	IT: ['italia','perte'],
	ID: ['indonesia'],
	IN: ['india','bharat'],
	AR: ['saudi','ksa','saudiarabia'],
	JP: ['japan','nippon'],
	KR: ['korea','southkorea'],
	CN: ['china','zhongguo']
}

function guessCountry(hashtags: string[]): string {
	const h = hashtags.map(x=>x.toLowerCase())
	for (const [cc, tags] of Object.entries(COUNTRY_HASHTAGS)) {
		if (tags.some(t=> h.includes(t))) return cc
	}
	return 'US'
}

export function detectLanguage(input: { caption?: string; transcript?: string; hashtags?: string[]; soundTitle?: string }): DetectedLocale {
	const text = [input.caption||'', input.transcript||'', (input.soundTitle||'')].join(' ').slice(0, 8000)
	let lang: DetectedLocale['lang'] = 'en'
	let score = 0.2
	for (const hint of LANGUAGE_HINTS) {
		if (hint.rx.test(text)) { lang = hint.lang; score = 0.9; break }
	}
	// Hashtag hints
	const ht = (input.hashtags||[]).join(' ').toLowerCase()
	if (/\bparati\b|\bparáti\b/.test(ht)) { lang = 'es'; score = Math.max(score, 0.8) }
	if (/\bfürdich\b|\bfuerdich\b/.test(ht)) { lang = 'de'; score = Math.max(score, 0.8) }
	if (/\bparavoce\b|\bpara voce\b/.test(ht)) { lang = 'pt'; score = Math.max(score, 0.8) }

	const country = guessCountry(input.hashtags||[])
	return { lang, country, confidence: Number(Math.min(1, Math.max(0.2, score)).toFixed(2)) }
}












