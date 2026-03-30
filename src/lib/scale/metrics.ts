import { DaySession } from './store'

export type Rollup = {
	viralEvents: number
	medianTimeToFirstViral: number | null
	avgFollowerDelta: number
	successRate: number
	templateWinRate: Record<string, number>
	coachUpliftAvg: number
}

export function computeMetrics(sessions: DaySession[]): Rollup {
	const byCreator = new Map<string, DaySession[]>()
	for (const s of sessions) {
		if (!byCreator.has(s.creatorId)) byCreator.set(s.creatorId, [])
		byCreator.get(s.creatorId)!.push(s)
	}
	let viralEvents = 0
	let totalFollowers = 0
	let totalDays = 0
	const ttc: number[] = []
	const templateCounts: Record<string, { total:number; viral:number }> = {}
	let upliftSum = 0
	let upliftCount = 0
	for (const arr of byCreator.values()){
		arr.sort((a,b)=>a.day-b.day)
		let firstViralDay: number | null = null
		for (const s of arr){
			viralEvents += s.outcomes.viral?1:0
			totalFollowers += s.outcomes.followersDelta||0
			totalDays += 1
			const tpl = s.meta?.templateId||'unknown'
			templateCounts[tpl] = templateCounts[tpl] || { total:0, viral:0 }
			templateCounts[tpl].total += 1
			if (s.outcomes.viral) templateCounts[tpl].viral += 1
			if (firstViralDay===null && s.outcomes.viral) firstViralDay = s.day
			if ((s.meta?.expectedLift||0)>0){ upliftSum += s.meta!.expectedLift!; upliftCount += 1 }
		}
		if (firstViralDay!==null) ttc.push(firstViralDay)
	}
	const medianTimeToFirstViral = ttc.length ? quantile(ttc, 0.5) : null
	const avgFollowerDelta = totalDays? totalFollowers / byCreator.size : 0
	const successRate = totalDays? viralEvents / totalDays : 0
	const templateWinRate = Object.fromEntries(Object.entries(templateCounts).map(([k,v])=>[k, v.total? v.viral/v.total : 0]))
	const coachUpliftAvg = upliftCount? upliftSum / upliftCount : 0
	return { viralEvents, medianTimeToFirstViral, avgFollowerDelta, successRate, templateWinRate, coachUpliftAvg }
}

function quantile(arr: number[], q: number): number {
	const a = [...arr].sort((x,y)=>x-y)
	const pos = (a.length - 1) * q
	const base = Math.floor(pos)
	const rest = pos - base
	if (a[base+1] !== undefined) return a[base] + rest * (a[base+1]-a[base])
	return a[base]
}


