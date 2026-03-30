type Lang = 'en'|'es'|'pt'|'de'|'fr'|'it'|'id'|'hi'|'ar'|'ja'|'ko'|'zh'

const STOPWORDS: Record<Lang, Set<string>> = {
	en: new Set(['the','a','an','and','or','to','of','in','on','for','with','is','are','be','this','that']),
	es: new Set(['el','la','los','las','y','o','de','del','en','con','es','son','ser','esto','eso','para','por','un','una']),
	pt: new Set(['o','a','os','as','e','ou','de','do','da','em','com','é','são','ser','isto','isso','para','por','um','uma']),
	de: new Set(['der','die','das','und','oder','zu','von','im','mit','ist','sind','sein','dies','das','für']),
	fr: new Set(['le','la','les','et','ou','de','du','des','en','avec','est','sont','être','ceci','cela','pour']),
	it: new Set(['il','la','i','le','e','o','di','del','della','in','con','è','sono','essere','questo','quello','per']),
	id: new Set(['dan','atau','yang','di','ke','dengan','ini','itu','untuk','karena','adalah','ada']),
	hi: new Set(['और','या','यह','वह','का','की','के','पर','में','से','है','थे']),
	ar: new Set(['و','أو','هذا','ذلك','من','في','على','مع','هو','هي','هم']),
	ja: new Set(['これ','それ','あれ','そして','または','ため','から','に','で']),
	ko: new Set(['그리고','또는','이것','저것','에','에서','와','과','은','는','이','가']),
	zh: new Set(['和','或','这','那','的','在','是','与','为','对'])
}

function normalizeHashtag(tag: string): string {
	const t = tag.replace(/^#+/, '')
	if (/^fürdich$/i.test(t) || /^fuerdich$/i.test(t)) return 'fyp'
	if (/^parati$/i.test(t) || /^paráti$/i.test(t)) return 'fyp'
	if (/^paravoce$/i.test(t) || /^para voce$/i.test(t)) return 'fyp'
	return t.toLowerCase()
}

export function tokenizeText(text: string, lang: Lang): string[] {
	const stop = STOPWORDS[lang] || STOPWORDS.en
	const lowered = (text||'').toLowerCase()
	const raw = lowered.replace(/#[\p{L}\p{N}_]+/gu, ' ').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/)
	const tokens = raw.filter(x => x && !stop.has(x))
	return tokens.map(stemLite)
}

export function tokenizeHashtags(tags: string[], lang: Lang): string[] {
	return (tags||[]).map(normalizeHashtag).filter(Boolean)
}

export function normalizeSoundTitle(title: string): string {
	return (title||'').replace(/\s*\((?:official|audio|sped up|slowed|slowed\s*&\s*reverb|[a-z]{2}-[A-Z]{2})\)\s*$/i, '').trim()
}

function stemLite(token: string): string {
	// Very light stemming just trimming common suffixes across languages
	return token
		.replace(/(ing|ed|ly|es|s)$/i,'')
		.replace(/(mente|aciones|ados|adas)$/i,'')
		.replace(/(ções|mente|ções)$/i,'')
}












