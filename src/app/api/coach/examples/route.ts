import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
	try {
		const p = path.join(process.cwd(), 'fixtures', 'coach', 'examples.json')
		const txt = fs.readFileSync(p, 'utf8')
		const examples = JSON.parse(txt)
		return NextResponse.json({ examples })
	} catch {
		// fallback to inline
		const examples = [
			{ platform:'tiktok', niche:'general', scriptText:'Stop scrolling. Here is the fastest way to...', caption:'Quick tip to 2x results', durationSec:25 },
			{ platform:'instagram', niche:'beauty', scriptText:"You won't believe what this does...", caption:'Skincare routine in 3 steps', durationSec:32 },
			{ platform:'youtube', niche:'productivity', scriptText:'Do this now: first, write this...', caption:'Productivity system that works', durationSec:40 }
		]
		return NextResponse.json({ examples })
	}
}


