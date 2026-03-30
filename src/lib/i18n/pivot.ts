type Lang = 'en'|'es'|'pt'|'de'|'fr'|'it'|'id'|'hi'|'ar'|'ja'|'ko'|'zh'

const GLOSSARY: Record<Lang, Record<string, string>> = {
	en: {
		'AUTHORITY': 'AUTHORITY', 'REVEAL': 'REVEAL', 'CHALLENGE': 'CHALLENGE', 'CUTS': 'CUTS'
	},
	es: {
		'AUTORIDAD': 'AUTHORITY', 'REVELA': 'REVEAL', 'RETO': 'CHALLENGE', 'CORTES': 'CUTS'
	},
	pt: { 'AUTORIDADE': 'AUTHORITY', 'REVELAÇÃO': 'REVEAL', 'DESAFIO': 'CHALLENGE', 'CORTES': 'CUTS' },
	de: { 'AUTORITÄT': 'AUTHORITY', 'ENTHÜLLUNG': 'REVEAL', 'HERAUSFORDERUNG': 'CHALLENGE', 'SCHNITTE': 'CUTS' },
	fr: { 'AUTORITÉ': 'AUTHORITY', 'RÉVÉLER': 'REVEAL', 'DÉFI': 'CHALLENGE', 'COUPURES': 'CUTS' },
	it: { 'AUTORITÀ': 'AUTHORITY', 'RIVELA': 'REVEAL', 'SFIDA': 'CHALLENGE', 'TAGLI': 'CUTS' },
	id: { 'OTORITAS': 'AUTHORITY', 'UNGKAP': 'REVEAL', 'TANTANGAN': 'CHALLENGE', 'POTONGAN': 'CUTS' },
	hi: { 'प्राधिकरण': 'AUTHORITY', 'खुलासा': 'REVEAL', 'चुनौती': 'CHALLENGE', 'कट': 'CUTS' },
	ar: { 'سلطة': 'AUTHORITY', 'كشف': 'REVEAL', 'تحدي': 'CHALLENGE', 'لقطات': 'CUTS' },
	ja: { '権威': 'AUTHORITY', '公開': 'REVEAL', '挑戦': 'CHALLENGE', 'カット': 'CUTS' },
	ko: { '권위': 'AUTHORITY', '공개': 'REVEAL', '도전': 'CHALLENGE', '컷': 'CUTS' },
	zh: { '权威': 'AUTHORITY', '揭露': 'REVEAL', '挑战': 'CHALLENGE', '剪辑': 'CUTS' }
}

export function pivotTokensToEnglish(tokens: string[], lang: Lang): string[] {
	const map = GLOSSARY[lang] || GLOSSARY.en
	return tokens.map(t => map[t.toUpperCase()] || t)
}












