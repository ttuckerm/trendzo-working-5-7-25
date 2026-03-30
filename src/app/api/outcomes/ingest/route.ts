import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { ensureP1AccuracyTables } from '@/lib/db/ensure'
import { computeDpsV2FromRows, type DpsV2RawMetrics } from '@/lib/training/dps-v2'
import { devAddOutcome, devUpsertLabel } from '@/lib/dev/accuracyStore'
import { thresholdFor } from '@/lib/calibration/thresholds'

 

export async function POST(req: NextRequest) {
  try {
    await ensureP1AccuracyTables()
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const body = await req.json().catch(()=> ({}))
    const templateId = String(body?.templateId || '')
    const variantId = body?.variantId ? String(body.variantId) : null
    const platform = String(body?.platform || '')
    const metrics = body?.metrics || {}
    const capturedAt = String(body?.capturedAt || new Date().toISOString())
    if (!templateId || !platform || !metrics?.views || !metrics?.watchTimePct || metrics?.retention3s == null) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }

    // Insert outcome
    const row = {
      template_id: templateId,
      variant_id: variantId,
      platform,
      views: Number(metrics.views||0),
      watch_time_pct: Number(metrics.watchTimePct||0),
      retention_3s: Number(metrics.retention3s||0),
      retention_8s: metrics.retention8s != null ? Number(metrics.retention8s) : null,
      ctr: metrics.ctr != null ? Number(metrics.ctr) : null,
      shares_per_1k: metrics.sharesPer1k != null ? Number(metrics.sharesPer1k) : null,
      saves_per_1k: metrics.savesPer1k != null ? Number(metrics.savesPer1k) : null,
      completion_rate: metrics.completionRate != null ? Number(metrics.completionRate) : null,
      captured_at: capturedAt,
      window_hours: Number(body?.windowHours || 48)
    }
    try { await db.from('post_publish_outcome').insert(row as any) } catch { devAddOutcome(row as any) }

    // Compute percentile via DPS v2 (display_score is 0-100)
    let percentile = 50
    try {
      const rawMetrics: DpsV2RawMetrics = {
        views: Number(metrics.views || 0),
        likes: Number(metrics.likes || 0),
        comments: Number(metrics.comments || 0),
        shares: Number(metrics.shares || 0),
        saves: Number(metrics.saves || 0),
        follower_count: 1000,
        hours_since_post: Number(body?.windowHours || 48),
      }
      const v2Result = computeDpsV2FromRows(rawMetrics, [])
      percentile = Math.round(v2Result.display_score)
    } catch {}

    const label = percentile >= thresholdFor(platform)
    const labelRow = {
      template_id: templateId,
      variant_id: variantId,
      platform,
      label,
      percentile: percentile,
      computed_at: new Date().toISOString(),
      cohort_key: null
    }
    try { await db.from('viral_label').upsert(labelRow as any, { onConflict: 'template_id,variant_id,platform' } as any) } catch { devUpsertLabel(labelRow as any) }

    return NextResponse.json({ label, percentile })
  } catch (e: any) {
    return NextResponse.json({ error: 'server_error', message: String(e?.message || e) }, { status: 500 })
  }
}



