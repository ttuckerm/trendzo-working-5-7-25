import fs from 'fs'
import path from 'path'

export type Platform = 'tiktok' | 'instagram' | 'youtube'

export type Creator = {
	id: string
	handle: string
	niche: string
	platformSet: Platform[]
	createdAtISO: string
}

export type PlanItem = {
	templateId: string
	seedIdea: string
	script: string
	timing: string
	targetPlatform: Platform
}

export type CreatorPlan = {
	creatorId: string
	day1: PlanItem[]
	day2: PlanItem[]
	day3: PlanItem[]
	day4: PlanItem[]
	day5: PlanItem[]
	day6: PlanItem[]
	day7: PlanItem[]
	day8: PlanItem[]
	day9: PlanItem[]
	day10: PlanItem[]
	day11: PlanItem[]
	day12: PlanItem[]
	day13: PlanItem[]
	day14: PlanItem[]
	day15: PlanItem[]
	day16: PlanItem[]
	day17: PlanItem[]
	day18: PlanItem[]
	day19: PlanItem[]
	day20: PlanItem[]
	day21: PlanItem[]
	day22: PlanItem[]
	day23: PlanItem[]
	day24: PlanItem[]
	day25: PlanItem[]
	day26: PlanItem[]
	day27: PlanItem[]
	day28: PlanItem[]
	day29: PlanItem[]
	day30: PlanItem[]
}

export type DayOutcome = {
	views: number
	viral: boolean
	followersDelta: number
	convDelta?: number
}

export type DaySession = {
	creatorId: string
	day: number
	actions: any[]
	outcomes: DayOutcome
	notes?: string
	meta?: { baselineProb?: number; variantProb?: number; expectedLift?: number; experimentId?: string|null; templateId?: string }
}

export type RunLog = { runId: string; createdAtISO: string; status: 'success' | 'error'; summary: string }

const ROOT = path.join(process.cwd(), 'fixtures', 'scale')

function ensureDir() {
	if (!fs.existsSync(ROOT)) fs.mkdirSync(ROOT, { recursive: true })
}

function fileOf(name: 'creators.ndjson'|'plans.ndjson'|'sessions.ndjson'|'runs.ndjson'): string {
	return path.join(ROOT, name)
}

function writeAtomic(file: string, data: Buffer | string) {
	ensureDir()
	const tmp = file + '.tmp'
	fs.writeFileSync(tmp, data)
	fs.renameSync(tmp, file)
}

export function appendNdjsonLine(name: 'creators.ndjson'|'plans.ndjson'|'sessions.ndjson'|'runs.ndjson', obj: unknown): void {
	ensureDir()
	const file = fileOf(name)
	const line = JSON.stringify(obj) + '\n'
	const tmp = file + '.tmp'
	fs.writeFileSync(tmp, line, 'utf8')
	try {
		fs.appendFileSync(file, fs.readFileSync(tmp))
	} finally {
		try { fs.unlinkSync(tmp) } catch {}
	}
}

export function readAllNdjson<T = any>(name: 'creators.ndjson'|'plans.ndjson'|'sessions.ndjson'|'runs.ndjson'): T[] {
	try {
		const content = fs.readFileSync(fileOf(name), 'utf8')
		const lines = content.split(/\r?\n/).filter(Boolean)
		return lines.map((l) => JSON.parse(l)) as T[]
	} catch {
		return []
	}
}

export function listCreators(): Creator[] { return readAllNdjson<Creator>('creators.ndjson') }
export function listPlans(): CreatorPlan[] { return readAllNdjson<CreatorPlan>('plans.ndjson') }
export function listSessions(): DaySession[] { return readAllNdjson<DaySession>('sessions.ndjson') }
export function listRuns(): RunLog[] { return readAllNdjson<RunLog>('runs.ndjson') }

export function writeAllPlans(plans: CreatorPlan[]): void { writeAtomic(fileOf('plans.ndjson'), plans.map(p=>JSON.stringify(p)).join('\n') + (plans.length? '\n': '')) }

export function replaceCreators(creators: Creator[]): void { writeAtomic(fileOf('creators.ndjson'), creators.map(c=>JSON.stringify(c)).join('\n') + (creators.length?'\n':'')) }

export function ensureFiles() {
	ensureDir()
	for (const n of ['creators.ndjson','plans.ndjson','sessions.ndjson','runs.ndjson'] as const) {
		const f = fileOf(n)
		if (!fs.existsSync(f)) writeAtomic(f, '')
	}
}


