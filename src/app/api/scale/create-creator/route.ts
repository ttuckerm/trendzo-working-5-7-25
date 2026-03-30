import { NextRequest, NextResponse } from 'next/server'
import { Creator, Platform, appendNdjsonLine, ensureFiles, listCreators, replaceCreators } from '@/lib/scale/store'

function uid() { return 'cr_' + Math.random().toString(36).slice(2,10) }

export async function POST(req: NextRequest){
	try{
		ensureFiles()
		const body = await req.json().catch(()=>({})) as any
		const handle = String(body?.handle||'').trim()
		const niche = String(body?.niche||'general').trim()
		let platforms: Platform[] = Array.isArray(body?.platforms) && body.platforms.length ? body.platforms : ['tiktok','instagram','youtube']
		platforms = Array.from(new Set(platforms.filter((p:string)=>['tiktok','instagram','youtube'].includes(p)))) as Platform[]
		if (!handle) return NextResponse.json({ error:'missing_handle' }, { status: 400 })
		const existing = listCreators()
		if (existing.find(c=>c.handle.toLowerCase()===handle.toLowerCase())) return NextResponse.json({ error:'handle_exists' }, { status: 409 })
		const creator: Creator = { id: uid(), handle, niche, platformSet: platforms, createdAtISO: new Date().toISOString() }
		appendNdjsonLine('creators.ndjson', creator)
		return NextResponse.json({ creator })
	}catch(e:any){
		// never 500; return empty shape
		return NextResponse.json({ creator:null, error: String(e?.message||e) })
	}
}


