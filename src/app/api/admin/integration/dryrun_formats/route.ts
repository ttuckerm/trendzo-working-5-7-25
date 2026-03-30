import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/utils/adminAuth'
import { getPredictionEngine } from '@/lib/services/viral-prediction/unified-prediction-engine'

export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req)
  if (!auth.success) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const persist = new URL(req.url).searchParams.get('persist') === 'true'
  const engine = getPredictionEngine()

  const base = { viewCount: 20000, likeCount: 1200, commentCount: 140, shareCount: 110, followerCount: 80000, platform: 'tiktok', hoursSinceUpload: 3, niche: 'general' }
  const carouselInput: any = { ...base, caption: 'photo mode carousel — save for later', hashtags: ['#photomode','#carousel'], slideCount: 6, durationSeconds: 20, format: 'carousel' }
  const longInput: any = { ...base, durationSeconds: 180, ret_30s: 0.6, ret_60s: 0.5, ret_180s: 0.35, format: 'long_video_3m' }
  const shortInput: any = { ...base, durationSeconds: 22, format: 'short_video' }

  const car = await engine.predict(carouselInput)
  const lng = await engine.predict(longInput)
  const sh = await engine.predict(shortInput)

  const proof = {
    examples: {
      carousel: { score: car.viralScore, prob: car.calibratedProbability, format: (car as any).format, breakdown: (car as any).format_breakdown },
      long_video_3m: { score: lng.viralScore, prob: lng.calibratedProbability, format: (lng as any).format, breakdown: (lng as any).format_breakdown },
      short_video: { score: sh.viralScore, prob: sh.calibratedProbability, format: (sh as any).format, breakdown: (sh as any).format_breakdown }
    }
  }
  return NextResponse.json(proof)
}


