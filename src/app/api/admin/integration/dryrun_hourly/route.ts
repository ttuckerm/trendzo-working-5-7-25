import { NextRequest, NextResponse } from 'next/server'
import { upsertVideoHourly, getVideoHourlySeries } from '@/lib/video/hourly'
import { getPredictionEngine } from '@/lib/services/viral-prediction/unified-prediction-engine'

export async function GET(_req: NextRequest) {
  const video_id = `vid_${Date.now()}`
  // Seed an increasing likes series
  for (let h=0; h<6; h++) {
    await upsertVideoHourly({ video_id, hour_n: h, views: 1000+200*h, likes: 50+10*h, comments: 5+2*h, shares: 3+1*h })
  }
  const series = await getVideoHourlySeries(video_id, 8)
  const engine = getPredictionEngine()
  const base = await engine.predict({ viewCount: 5000, likeCount: 300, commentCount: 60, shareCount: 40, followerCount: 20000, platform: 'tiktok', hoursSinceUpload: 6, frameworkScores: { overallScore: 0.6, topFrameworks: [] } } as any)
  const withId = await engine.predict({ viewCount: 5000, likeCount: 300, commentCount: 60, shareCount: 40, followerCount: 20000, platform: 'tiktok', hoursSinceUpload: 6, frameworkScores: { overallScore: 0.6, topFrameworks: [] }, videoId: video_id } as any)
  return NextResponse.json({ ok:true, video_id, series, old_label: base.incubationLabel, new_label: withId.incubationLabel })
}


