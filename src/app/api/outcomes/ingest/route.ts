import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { ensureP1AccuracyTables } from '@/lib/db/ensure'
import { DynamicPercentileSystem } from '@/lib/services/viral-prediction/dynamic-percentile-system'
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

    // Compute percentile via DPS (fallback simple heuristic if DPS cannot access DB)
    let percentile = 50
    try {
      const dps = new DynamicPercentileSystem()
      const vit = await dps.calculateViralScore('template:'+templateId, Number(metrics.views||0), 1000, 48, platform)
      percentile = Math.round(vit.percentile)
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



