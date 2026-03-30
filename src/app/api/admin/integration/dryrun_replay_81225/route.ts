import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { UnifiedPredictionEngine } from '@/lib/services/viral-prediction/unified-prediction-engine'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const from = '2025-08-12T00:00:00.000Z'
  const to = '2025-08-12T23:59:59.999Z'
  const { data: raws } = await db.from('raw_videos').select('id,caption,views_1h,likes_1h,uploaded_at').gte('created_at', from).lte('created_at', to).limit(200)
  const scanned = (raws||[]).length
  let promoted = 0, predicted = 0
  const engine = new UnifiedPredictionEngine()
  for (const r of (raws||[])) {
    // DRYRUN: do not write videos; only run prediction and count
    const res = await engine.predict({
      viewCount: Number((r as any).views_1h||0),
      likeCount: Number((r as any).likes_1h||0),
      commentCount: 0,
      shareCount: 0,
      followerCount: 5000,
      platform: 'tiktok',
      hoursSinceUpload: 2,
      frameworkScores: { overallScore: 0.6, topFrameworks: [] }
    } as any)
    if (res) predicted++
  }
  return NextResponse.json({ ok:true, dryrun:true, window:{ from, to }, scanned, promoted, predicted, ui_targets: { apify_recent: scanned, validation_rows: predicted } })
}







