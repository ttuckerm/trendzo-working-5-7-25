import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'
import { chooseSnapshotAtHorizon } from '@/lib/validation/actuals_join'

// Triggers a lightweight validation cycle: it finds pending records in
// `prediction_validation` and attempts to validate them using currently
// available "actual" metrics. This keeps the flow non-blocking and safe.

const supabase = getServerSupabase()

export async function POST(_req: NextRequest) {
  try {
    // Fetch a page of pending validations
    const { data: pending, error } = await supabase
      .from('prediction_validation')
      .select('*')
      .eq('validation_status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) throw new Error(error.message)

    let validated = 0
    let failed = 0
    let accuracySum = 0

    for (const row of pending || []) {
      try {
        // Attempt to fetch actual performance. We probe a few likely sources.
        // If no source exists, we skip gracefully.
        let actualScore: number | null = null

        // 1) Try a "videos" table if present
        try {
          const { data: video } = await supabase
            .from('videos')
            .select('viral_score, view_count')
            .eq('id', (row as any).video_id)
            .single()
          if (video) {
            actualScore = Number((video as any).viral_score ?? (video as any).view_count ?? null)
          }
        } catch {}

        // 2) Preferred: try a windowed rollup and pick deterministic 48h snapshot
        if (actualScore == null) {
          try {
            const { data: wins } = await supabase
              .from('video_engagement_windows' as any)
              .select('captured_at,views')
              .eq('video_id', (row as any).video_id)
              .order('captured_at', { ascending: true })
            const baseISO = (row as any).created_at || (row as any).prediction_time || new Date().toISOString()
            const snap = chooseSnapshotAtHorizon((wins||[]) as any[], baseISO, 48)
            if (snap) actualScore = Number((snap as any).views ?? null)
          } catch {}
        }

        // If we still have nothing, leave pending for a future cycle
        if (actualScore == null) continue

        const predicted = Number((row as any).predicted_viral_score ?? 0)
        const accuracy = computeAccuracy(predicted, Number(actualScore))

        const { error: updateErr } = await supabase
          .from('prediction_validation')
          .update({
            actual_viral_score: actualScore,
            accuracy_percentage: accuracy,
            validation_status: 'validated',
            validation_timestamp: new Date().toISOString()
          })
          .eq('id', (row as any).id)

        if (updateErr) throw new Error(updateErr.message)

        validated += 1
        accuracySum += accuracy
      } catch {
        failed += 1
      }
    }

    const accuracy_update = validated > 0 ? Math.round((accuracySum / validated) * 10) / 10 : null

    return NextResponse.json({ validated, failed, accuracy_update })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Trigger failed' }, { status: 500 })
  }
}

function computeAccuracy(predicted: number, actual: number): number {
  if (predicted === 0 && actual === 0) return 100
  if (predicted === 0 || actual === 0) return 0
  const difference = Math.abs(predicted - actual)
  const average = (predicted + actual) / 2
  const accuracy = Math.max(0, 100 - (difference / average) * 100)
  return Math.round(accuracy * 100) / 100
}
// duplicate handler removed