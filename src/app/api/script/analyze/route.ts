import { NextRequest, NextResponse } from 'next/server'
import { extractScriptFeatures } from '@/lib/script/features'
import { matchPatterns } from '@/lib/script/match'
import { scoreScript } from '@/lib/script/score'
import { scriptRecommendations } from '@/lib/script/recommend'
import { appendNdjson } from '@/lib/script/store'

export async function POST(req: NextRequest) {
  try {
    const { text, platform, niche } = await req.json()
    const features = extractScriptFeatures(String(text||''))
    const matched = matchPatterns(features)
    const score = await scoreScript({ features, platform: platform || 'tiktok', niche, matchedPatterns: matched, recipeSupport: 0.6 })
    const recommendations = scriptRecommendations(features, platform || 'tiktok')

    const res = { ...score, features, recommendations }
    if (process.env.MOCK === '1') {
      appendNdjson('analyses.ndjson', { ts: new Date().toISOString(), platform: platform||'tiktok', niche, ...res })
    }
    return NextResponse.json(res)
  } catch (e:any) {
    return NextResponse.json({ error: String(e?.message||e) }, { status: 400 })
  }
}

export async function GET() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }) }








































































































































