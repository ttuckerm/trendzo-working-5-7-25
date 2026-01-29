import { NextRequest, NextResponse } from 'next/server'
import { ensureFiles, listCreators, listPlans, writeAllPlans, appendNdjsonLine } from '@/lib/scale/store'
import { make30DayPlan } from '@/lib/scale/plan'

export async function POST(req: NextRequest){
	try{
		ensureFiles()
		const body = await req.json().catch(()=>({})) as any
		const creatorId = String(body?.creatorId||'')
		if (!creatorId) return NextResponse.json({ error:'missing_creatorId' }, { status: 400 })
		const creator = listCreators().find(c=>c.id===creatorId)
		if (!creator) return NextResponse.json({ error:'not_found' }, { status: 404 })
		const plan = await make30DayPlan(creator, { seed: 20250813 })
		// upsert in plans.ndjson by replacing entire file to keep single row per creator
		const existing = listPlans().filter(p=>p.creatorId !== creatorId)
		writeAllPlans([...existing, plan])
		return NextResponse.json({ plan })
	} catch (e:any) {
		return NextResponse.json({ plan:null, error:String(e?.message||e) })
	}
}


