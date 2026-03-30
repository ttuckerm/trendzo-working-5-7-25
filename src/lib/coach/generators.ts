import type { CoachInput, CoachSuggestion, CoachSuggestionType } from './types'
import { coachFeatures } from './features'

function seededRandom(seed: string): () => number {
	let h = 2166136261 >>> 0
	for (let i=0;i<seed.length;i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
	return () => { h += 0x6D2B79F5; let t = Math.imul(h ^ h>>>15,1|h); t ^= t + Math.imul(t ^ t>>>7, 61|t); return ((t ^ t>>>14) >>> 0) / 4294967296 }
}

const HOOKS = [
	"Stop scrolling: here's the fastest way to win this.",
	"Nobody tells you this, but it changes everything.",
	"Do this first and thank me later.",
	"What if you could 2x results in 7 days?",
	"The mistake that kills your reach—fix it in 10s."
]
const CTAS = [
	"Follow for part 2 and save this.",
	"Comment 'guide' and I'll DM the checklist.",
	"Share with a friend who needs this.",
	"Save this to try tonight.",
	"Tap + follow to get the template."
]
const HASHSETS = [
	["#fyp", "#viral", "#howto"],
	["#tutorial", "#tips", "#contentmarketing"],
	["#productivity", "#creator", "#shorts"],
	["#learnontiktok", "#growth", "#tools"],
	["#marketing", "#branding", "#video"]
]
const TEMPLATES = [ 'tpl:hook-list-3', 'tpl:myth-truth', 'tpl:before-after', 'tpl:mistakes-3', 'tpl:framework-case' ]

function makeId(prefix: string, i: number): string { return `${prefix}_${i}_${Math.random().toString(36).slice(2,8)}` }

function mkSuggestion(type: CoachSuggestionType, title: string, preview: string, edit: any, seedRng: ()=>number, baselineLift: number): CoachSuggestion {
	const id = makeId(type.replace(/_.*/, ''), Math.floor(seedRng()*1e6))
	const confidence = 0.55 + 0.4 * seedRng()
	const expectedLift = Math.max(0.01, Math.min(0.35, baselineLift * (0.6 + 0.8 * seedRng())))
	return { id, type, title, edit, preview, expectedLift, confidence, risks: [] }
}

export function genHookRewrites(input: CoachInput): CoachSuggestion[] {
	const rng = seededRandom(`${process.env.MOCK==='1'?'MOCK':''}|${input.platform}|hook|${input.niche||''}`)
	const base = coachFeatures(input)
	const lifts = base.hookWeak ? 0.18 : 0.08
	const out: CoachSuggestion[] = []
	for (let i=0;i<3;i++) {
		const hook = HOOKS[(i + Math.floor(rng()*HOOKS.length)) % HOOKS.length]
		const scriptText = `${hook} ${input.scriptText || ''}`.trim()
		const preview = scriptText.slice(0, 140)
		const edit = { scriptText }
		out.push(mkSuggestion('hook_rewrite', 'Rewrite hook for stronger open', preview, edit, rng, lifts))
	}
	return out
}

export function genCTAs(input: CoachInput): CoachSuggestion[] {
	const rng = seededRandom(`${process.env.MOCK==='1'?'MOCK':''}|${input.platform}|cta|${input.niche||''}`)
	const base = coachFeatures(input)
	const lifts = base.missingCTA ? 0.12 : 0.05
	return CTAS.slice(0,3).map((cta, i)=> {
		const caption = `${(input.caption||'').trim()} ${cta}`.trim()
		return mkSuggestion('cta_insert','Insert explicit CTA', caption, { caption }, rng, lifts)
	})
}

export function genCaptionTighten(input: CoachInput): CoachSuggestion[] {
	const rng = seededRandom(`${process.env.MOCK==='1'?'MOCK':''}|${input.platform}|cap|${input.niche||''}`)
	const base = coachFeatures(input)
	const add = ' — with 3 concrete steps you can do today.'
	const caption = (input.caption||'').trim()
	const tightened = caption.length>0 ? (caption.endsWith('.')? caption: caption+'.') + add : '3 steps you can do today for faster results.'
	const lift = base.captionDensity < 0.3 ? 0.10 : 0.04
	return [mkSuggestion('caption_tighten','Tighten caption for density', tightened, { caption: tightened }, rng, lift)]
}

export function genHashtagSet(input: CoachInput): CoachSuggestion[] {
	const rng = seededRandom(`${process.env.MOCK==='1'?'MOCK':''}|${input.platform}|hash|${input.niche||''}`)
	const pick = HASHSETS[Math.floor(rng()*HASHSETS.length)]
	return [mkSuggestion('hashtag_set','Add platform-relevant hashtags', pick.join(' '), { hashtags: pick }, rng, 0.03 + 0.03*rng())]
}

export function genTemplateSwap(input: CoachInput): CoachSuggestion[] {
	const rng = seededRandom(`${process.env.MOCK==='1'?'MOCK':''}|${input.platform}|tpl|${input.niche||''}`)
	const tpl = TEMPLATES[Math.floor(rng()*TEMPLATES.length)]
	return [mkSuggestion('template_swap','Swap to proven template', `Use ${tpl}`, { templateId: tpl }, rng, 0.07 + 0.05*rng())]
}

export function genPaceTweak(input: CoachInput): CoachSuggestion[] {
	const rng = seededRandom(`${process.env.MOCK==='1'?'MOCK':''}|${input.platform}|pace|${input.niche||''}`)
	const base = coachFeatures(input)
	const faster = base.base.pacing !== 'fast'
	const edit = { pacingHint: faster? 'faster':'slower' as const }
	return [mkSuggestion('pace_tweak', faster? 'Speed up pacing 10–15%':'Slow pacing to emphasize payoff', faster? 'Add more cuts early':'Hold shots longer in build', edit, rng, faster? 0.06: 0.03)]
}

export function generateAllCandidates(input: CoachInput): CoachSuggestion[] {
	return [
		...genHookRewrites(input),
		...genCTAs(input),
		...genCaptionTighten(input),
		...genHashtagSet(input),
		...genTemplateSwap(input),
		...genPaceTweak(input)
	]
}


