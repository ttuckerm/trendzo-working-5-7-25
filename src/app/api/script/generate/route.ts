import { NextRequest, NextResponse } from 'next/server'
import { generateScript } from '@/lib/script/generate'
import { appendNdjson } from '@/lib/script/store'
import { extractScriptFeatures } from '@/lib/script/features'
import { matchPatterns } from '@/lib/script/match'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { seedIdea, platform, niche, tone, lengthSecTarget, patternId } = body || {}
    if (!seedIdea || !platform) return NextResponse.json({ error: 'seedIdea and platform are required' }, { status: 400 })
    const draft = generateScript({ seedIdea, platform, niche, tone, lengthSecTarget, patternId })
    const features = extractScriptFeatures([draft.hook, draft.body, draft.cta].join('\n'))
    const matchedPatterns = matchPatterns(features)
    const out = { ...draft, matchedPatterns }
    if (process.env.MOCK === '1') appendNdjson('generated.ndjson', { ts: new Date().toISOString(), platform, niche, ...out })
    return NextResponse.json(out)
  } catch (e:any) {
    return NextResponse.json({ error: String(e?.message||e) }, { status: 400 })
  }
}

export async function GET() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }) }








































































































































