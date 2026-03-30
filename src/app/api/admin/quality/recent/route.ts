import { NextRequest, NextResponse } from 'next/server'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'
import { commonRateLimiters } from '@/lib/security/rate-limiter'
import { computeQualityReasons } from '@/lib/quality/anti_gaming'

export async function GET(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const limited = await commonRateLimiters.admin(req)
  if (limited) return limited

  const windowParam = new URL(req.url).searchParams.get('window') || '24h'
  const hours = windowParam.endsWith('h') ? Number(windowParam.replace('h','')) : 24

  // Generate sample signals for now (no PII), counts per reason and a few samples
  const samples = Array.from({ length: 25 }, (_, i) => ({
    videoId: `vid_${i}`, platform: i % 2 ? 'tiktok' : 'instagram',
    viewCount: 5000 + i * 137, likeCount: 120 + (i % 7) * 11, commentCount: 8 + (i % 5), shareCount: 6 + (i % 3), hoursSinceUpload: Math.min(hours, 48)
  }))
  const counts: Record<string, number> = {}
  const flagged: any[] = []
  for (const s of samples) {
    const reasons = computeQualityReasons(s as any)
    for (const [k, v] of Object.entries(reasons.reasons)) {
      counts[k] = (counts[k] || 0) + Number(v || 0)
    }
    if (Object.keys(reasons.reasons).length) flagged.push({ id: s.videoId, platform: s.platform, reasons: reasons.reasons, weight: reasons.weight })
  }

  return NextResponse.json({ window_hours: hours, counts, samples: flagged.slice(0, 5) })
}
// duplicate handler removed








