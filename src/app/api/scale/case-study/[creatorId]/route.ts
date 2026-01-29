import { NextRequest, NextResponse } from 'next/server'
import { ensureFiles, listCreators, listPlans, listSessions } from '@/lib/scale/store'

function toCSV(rows: any[]): string {
	if (!rows.length) return ''
	const header = Object.keys(rows[0])
	const esc = (v:any)=> String(v ?? '').replace(/"/g,'""')
	const lines = [header.join(',')]
	for (const r of rows){ lines.push(header.map(h=>`"${esc((r as any)[h])}"`).join(',')) }
	return lines.join('\n')
}

export async function GET(req: NextRequest, ctx: { params: { creatorId: string } }){
	try{
		ensureFiles()
		const id = String(ctx.params.creatorId||'')
		const format = new URL(req.url).searchParams.get('format') || 'json'
		const creator = listCreators().find(c=>c.id===id)
		if (!creator) return NextResponse.json({ error:'not_found' }, { status: 404 })
		const plan = listPlans().find(p=>p.creatorId===id)
		const sessions = listSessions().filter(s=>s.creatorId===id)
		const data = { creator, plan, sessions }
		if (format==='csv'){
			const flat = sessions.map(s=>({ day: s.day, views: s.outcomes.views, viral: s.outcomes.viral, followersDelta: s.outcomes.followersDelta, convDelta: s.outcomes.convDelta||0 }))
			const csv = toCSV(flat)
			return new NextResponse(csv, { headers: { 'content-type':'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="case-study-${creator.handle}.csv"` } })
		}
		return NextResponse.json(data)
	}catch(e:any){
		return NextResponse.json({ creator:null, plan:null, sessions:[], error:String(e?.message||e) })
	}
}


