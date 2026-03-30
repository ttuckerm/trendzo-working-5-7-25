import { NextRequest, NextResponse } from 'next/server'
import type { CoachInput } from '@/lib/coach/types'
import { suggest } from '@/lib/coach/service'

export async function GET() {
	try {
		// Friendly GET handler: returns a demo response in MOCK or guidance otherwise
		const demoBody: CoachInput = { platform: 'tiktok', niche: 'general', scriptText: 'Stop scrolling. Here is the fastest way to…', caption: 'Quick tip to 2x results', durationSec: 25 }
		if (process.env.MOCK === '1') {
			const res = await suggest(demoBody, 5)
			return NextResponse.json({ note: 'Use POST with CoachInput for custom suggestions. This is MOCK demo output.', ...res })
		}
		return NextResponse.json({ note: 'Use POST with JSON body CoachInput. In live mode, GET provides this help message only.', baselineProb: 0, suggestions: [], features: {} })
	} catch {
		return NextResponse.json({ baselineProb: 0, suggestions: [], features: {} })
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(()=>({})) as (CoachInput & { k?: number })
		const { platform } = body || ({} as any)
		if (!platform) {
			// Default to TikTok if omitted, keep non-500 contract
			body.platform = 'tiktok' as any
		}
		const res = await suggest({
			platform: body.platform,
			niche: body.niche,
			scriptText: body.scriptText,
			caption: body.caption,
			durationSec: body.durationSec,
			templateId: body.templateId
		}, Math.max(3, Math.min(Number(body.k)||5, 5)))
		return NextResponse.json(res)
	} catch {
		return NextResponse.json({ baselineProb: 0, suggestions: [], features: { } })
	}
}


