import { NextRequest, NextResponse } from 'next/server'
import { predictForSeed } from '@/lib/cross/service'
import { getSource } from '@/lib/data'
import { ensureFixtures } from '@/lib/data/init-fixtures'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const platform = body?.platform
    if (!platform || !['tiktok','instagram','youtube'].includes(platform)) return NextResponse.json({ probIG:0, probYT:0, confidence:'low', recommendedLags:{ toIG:12, toYT:36 }, features:{} })
    if (process.env.MOCK === '1') ensureFixtures()
    try {
      const src = getSource()
      const out = await predictForSeed(src as any, { platform, videoId: body?.videoId, templateId: body?.templateId, niche: body?.niche })
      return NextResponse.json(out)
    } catch {
      ensureFixtures()
      const out = await predictForSeed('mock', { platform, videoId: body?.videoId, templateId: body?.templateId, niche: body?.niche })
      return NextResponse.json(out)
    }
  } catch {
    return NextResponse.json({ probIG:0, probYT:0, confidence:'low', recommendedLags:{ toIG:12, toYT:36 }, features:{} })
  }
}


