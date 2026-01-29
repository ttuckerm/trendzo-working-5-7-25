import { NextRequest, NextResponse } from 'next/server'
import { ensureFiles, listPlans } from '@/lib/scale/store'
import { runDay } from '@/lib/scale/simulate'
import { listCreators } from '@/lib/scale/store'

export async function POST(req: NextRequest){
	try{
		ensureFiles()
		const body = await req.json().catch(()=>({})) as any
		const creatorId = String(body?.creatorId||'')
		const day = Number(body?.day||0)
		if (!creatorId || !day || day<1 || day>30) return NextResponse.json({ error:'invalid_input' }, { status: 400 })
		const plan = listPlans().find(p=>p.creatorId===creatorId)
		if (!plan) return NextResponse.json({ error:'plan_missing' }, { status: 404 })
		const creator = listCreators().find(c=>c.id===creatorId)
		if (!creator) return NextResponse.json({ error:'creator_missing' }, { status: 404 })
		const items = (plan as any)[`day${day}`] || []
		const session = await runDay(creatorId, day, items, { niche: creator.niche })
		return NextResponse.json({ session })
	} catch (e:any) {
		return NextResponse.json({ session:null, error:String(e?.message||e) })
	}
}


