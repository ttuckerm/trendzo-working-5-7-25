import { NextRequest, NextResponse } from 'next/server'
import { ensureFiles, listCreators, listSessions } from '@/lib/scale/store'
import { computeMetrics } from '@/lib/scale/metrics'

export async function GET(_req: NextRequest){
	try{
		ensureFiles()
		const creators = listCreators()
		const sessions = listSessions()
		const metrics = computeMetrics(sessions)
		const followerGrowth = sessions.reduce((a,s)=>a+(s.outcomes.followersDelta||0),0)
		return NextResponse.json({ creators: creators.length, metrics, followerGrowth })
	} catch (e:any) {
		return NextResponse.json({ creators:0, metrics:{ viralEvents:0, medianTimeToFirstViral:null, avgFollowerDelta:0, successRate:0, templateWinRate:{}, coachUpliftAvg:0 }, followerGrowth:0, error:String(e?.message||e) })
	}
}


