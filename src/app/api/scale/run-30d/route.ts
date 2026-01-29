import { NextRequest, NextResponse } from 'next/server'
import { ensureFiles, listPlans, listCreators } from '@/lib/scale/store'
import { run30Days } from '@/lib/scale/simulate'

export async function POST(req: NextRequest){
	try{
		ensureFiles()
		const body = await req.json().catch(()=>({})) as any
		const creatorId = String(body?.creatorId||'')
		if (!creatorId) return NextResponse.json({ error:'missing_creatorId' }, { status: 400 })
		const plan = listPlans().find(p=>p.creatorId===creatorId)
		if (!plan) return NextResponse.json({ error:'plan_missing' }, { status: 404 })
		const creator = listCreators().find(c=>c.id===creatorId)
		if (!creator) return NextResponse.json({ error:'creator_missing' }, { status: 404 })
		const summary = await run30Days(creatorId, plan as any, { niche: creator.niche })
		return NextResponse.json({ summary })
	} catch (e:any) {
		return NextResponse.json({ summary:null, error:String(e?.message||e) })
	}
}


