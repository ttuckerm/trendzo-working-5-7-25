import { NextRequest, NextResponse } from 'next/server'
import { computeQualityReasons } from '@/lib/quality/anti_gaming'

export async function GET(_req: NextRequest) {
  const sample = computeQualityReasons({
    platform: 'tiktok',
    viewCount: 20000,
    likeCount: 150,
    commentCount: 2,
    shareCount: 3,
    hoursSinceUpload: 1,
    window: { points: [
      { ts: new Date(Date.now()-3600*1000*3).toISOString(), views: 1000, likes: 30, comments: 1, shares: 1 },
      { ts: new Date(Date.now()-3600*1000*2).toISOString(), views: 1200, likes: 25, comments: 1, shares: 1 },
      { ts: new Date(Date.now()-3600*1000*1).toISOString(), views: 9000, likes: 28, comments: 1, shares: 1 },
      { ts: new Date().toISOString(), views: 9500, likes: 29, comments: 1, shares: 0 },
    ] }
  } as any)
  return NextResponse.json({ ok: true, sample })
}


