import { DaySession, DayOutcome, PlanItem, Platform, appendNdjsonLine } from './store'
import { suggest as coachSuggest } from '@/lib/coach/service'

type AnalyzeInput = { scriptText: string; platform: Platform; niche?: string; caption?: string; durationSec?: number }

async function analyzeDraft(input: AnalyzeInput): Promise<{ probability: number; recommendations: any[] }> {
	try {
		const res = await fetch('http://localhost/api/analyze', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ scriptText: input.scriptText, platform: input.platform, niche: input.niche, durationSec: input.durationSec }) })
		if (res.ok) return await res.json()
		throw new Error('bad')
	} catch {
		// MOCK-safe fallback using script analyzer path
		try{
			const r = await fetch('http://localhost/api/script/analyze', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ text: input.scriptText, platform: input.platform, niche: input.niche }) })
			if (r.ok) {
				const j = await r.json()
				return { probability: Math.max(0, Math.min(1, 0.7 * (j?.probScript||0.5) + 0.3)), recommendations: j?.recommendations||[] }
			}
		}catch{}
		return { probability: 0.45, recommendations: [] }
	}
}

function sampleViral(prob: number): boolean {
	return Math.random() < Math.max(0.01, Math.min(0.99, prob))
}

function synthesizeOutcome(prob: number, uplift: number): DayOutcome {
	const p = Math.max(0, Math.min(1, prob + uplift))
	const viral = sampleViral(0.1 + 0.8*p)
	const viewsBase = Math.floor(500 + 5000 * p * (viral? 8 : 1) * (0.8 + Math.random()*0.4))
	const followersDelta = Math.floor(5 + (viral? 150 : 20) * p)
	const convDelta = Math.random() < 0.3 ? Math.max(0, Math.floor(1 + (viral? 20 : 5) * p)) : 0
	return { views: viewsBase, viral, followersDelta, convDelta }
}

export async function runDay(creatorId: string, day: number, items: PlanItem[], context: { niche: string }): Promise<DaySession> {
	const baseDraft = items[0]
	const base = await analyzeDraft({ scriptText: baseDraft.script, platform: baseDraft.targetPlatform, niche: context.niche })
	const coach = await coachSuggest({ platform: baseDraft.targetPlatform, niche: context.niche, scriptText: baseDraft.script })
	const top = coach.suggestions?.[0]
	const expectedLift = Math.max(0, Math.min(0.5, top?.expectedLift || 0))
	let experimentId: string | null = null
	try {
		const expRes = await fetch('http://localhost/api/experiments/create', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ name: `Scale D${day}`, mode:'bandit', variants:[{ id:'A', name:'Baseline' }, { id:'B', name:'Coach Var', meta:{ suggestionId: top?.id } }], objective:'viral48h' }) })
		if (expRes.ok) { const j = await expRes.json(); experimentId = j?.experiment?.id || null }
	} catch { experimentId = 'demo' }
	const variantProb = Math.max(0, Math.min(1, (base?.probability||0) + expectedLift))
	const outcomes = synthesizeOutcome(base?.probability||0.4, expectedLift)
	const actions = [ { type:'analyze', prob: base?.probability||0 }, { type:'coach', lift: expectedLift }, { type:'experiment', id: experimentId } ]
	const session: DaySession = { creatorId, day, actions, outcomes, meta: { baselineProb: base?.probability||0, variantProb, expectedLift, experimentId, templateId: baseDraft.templateId } }
	appendNdjsonLine('sessions.ndjson', session)
	return session
}

export async function run30Days(creatorId: string, plan: { [day: string]: PlanItem[] }, context: { niche: string }): Promise<{ creatorId: string; totalViews: number; totalFollowers: number; viralEvents: number }> {
	let totalViews = 0
	let totalFollowers = 0
	let viralEvents = 0
	for (let d=1; d<=30; d++){
		const items = plan[`day${d}` as const] || []
		const s = await runDay(creatorId, d, items, context)
		totalViews += s.outcomes.views
		totalFollowers += s.outcomes.followersDelta
		viralEvents += s.outcomes.viral ? 1 : 0
	}
	return { creatorId, totalViews, totalFollowers, viralEvents }
}


