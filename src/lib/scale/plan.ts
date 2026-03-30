import { generateScript } from '@/lib/script/generate'
import { Creator, CreatorPlan, PlanItem, Platform } from './store'
import fs from 'fs'
import path from 'path'

type PlanOptions = { seed?: number }

function seededRandom(seed: number) {
	let state = seed >>> 0
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0
		return (state & 0xffffffff) / 0x100000000
	}
}

function pick<T>(arr: T[], rnd: () => number): T {
	return arr[Math.floor(rnd() * arr.length)]
}

function readRecipeBookHOT(): Array<{ id: string; name: string }> {
	try {
		const p = path.join(process.cwd(), 'data', 'seed', 'recipe-book.json')
		const raw = JSON.parse(fs.readFileSync(p, 'utf8'))
		const hot = (raw?.templates||[]).filter((t: any)=> String(t.status).toUpperCase()==='HOT')
		return hot.map((t: any)=>({ id: t.id||t.name, name: t.name||t.id }))
	} catch {
		return [
			{ id:'tpl_hot_01', name:'Split-screen How-To Turbo' },
			{ id:'tpl_hot_02', name:'Pattern Interrupt + Duet' },
			{ id:'tpl_hot_03', name:'On-screen Timer Challenge' },
		]
	}
}

function choosePlatform(platforms: Platform[], niche: string, rnd: () => number): Platform {
	// Use cross-intel priors lightly: tiktok leads by default, then youtube, then instagram
	const weights = platforms.map(p=> p==='tiktok'?0.5 : p==='youtube'?0.3 : 0.2)
	let sum = weights.reduce((a,b)=>a+b,0)
	let x = rnd() * sum
	for (let i=0;i<platforms.length;i++) { x -= weights[i]; if (x<=0) return platforms[i] }
	return platforms[0]
}

export async function make30DayPlan(creator: Creator, opts: PlanOptions = {}): Promise<CreatorPlan> {
	const seed = (opts.seed ?? 1337) ^ (creator.id.split('').reduce((a,c)=>a+c.charCodeAt(0),0))
	const rnd = seededRandom(seed)
	const templates = readRecipeBookHOT()
	const planByDay: Record<number, PlanItem[]> = {}
	for (let d=1; d<=30; d++) {
		const targetPlatform = choosePlatform(creator.platformSet, creator.niche, rnd)
		const t = pick(templates, rnd)
		const seedIdea = `${creator.niche}: ${t.name}`
		const scriptDraft = generateScript({ platform: targetPlatform, niche: creator.niche, seedIdea })
		const timingHour = [8,11,14,17,20][Math.floor(rnd()*5)]
		const timing = `${String(timingHour).padStart(2,'0')}:00`
		planByDay[d] = [{ templateId: t.id, seedIdea, script: [scriptDraft.hook, scriptDraft.body, scriptDraft.cta].join('\n'), timing, targetPlatform }]
	}
	return {
		creatorId: creator.id,
		day1: planByDay[1], day2: planByDay[2], day3: planByDay[3], day4: planByDay[4], day5: planByDay[5],
		day6: planByDay[6], day7: planByDay[7], day8: planByDay[8], day9: planByDay[9], day10: planByDay[10],
		day11: planByDay[11], day12: planByDay[12], day13: planByDay[13], day14: planByDay[14], day15: planByDay[15],
		day16: planByDay[16], day17: planByDay[17], day18: planByDay[18], day19: planByDay[19], day20: planByDay[20],
		day21: planByDay[21], day22: planByDay[22], day23: planByDay[23], day24: planByDay[24], day25: planByDay[25],
		day26: planByDay[26], day27: planByDay[27], day28: planByDay[28], day29: planByDay[29], day30: planByDay[30],
	}
}


