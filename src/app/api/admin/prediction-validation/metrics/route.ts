import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'

// This endpoint powers the Studio → "🎯 Accuracy Validation" tab
// It aggregates validation metrics from the `prediction_validation` table.

const supabase = getServerSupabase()

export async function GET(_req: NextRequest) {
  try {
    // Pull recent validations. We compute counts and averages in JS to avoid
    // depending on DB-specific aggregate functions.
    const { data: rows, error } = await supabase
      .from('prediction_validation')
      .select(
        [
          'id',
          'prediction_id',
          'video_id',
          'predicted_viral_score',
          'actual_viral_score',
          'accuracy_percentage',
          'validation_status',
          'validation_timestamp',
          'created_at',
          'platform'
        ].join(',')
      )
      .order('validation_timestamp', { ascending: false })
      .limit(500)

    if (error) {
      throw new Error(error.message)
    }

    const all = Array.isArray(rows) ? rows : []
    const validated = all.filter(r => (r as any).validation_status === 'validated')
    const pending = all.filter(r => (r as any).validation_status === 'pending')

    // Overall accuracy = mean of accuracy_percentage across validated rows
    const accuracyValues = validated
      .map(r => Number((r as any).accuracy_percentage))
      .filter(v => Number.isFinite(v)) as number[]

    const overallAccuracy = accuracyValues.length
      ? accuracyValues.reduce((a, b) => a + b, 0) / accuracyValues.length
      : 0

    // Simple trend: last 20 vs previous 20 validated accuracy delta
    const recentValidated = validated.slice(0, 20)
    const previousValidated = validated.slice(20, 40)
    const avg = (arr: any[]) =>
      arr.length
        ? arr
            .map(r => Number((r as any).accuracy_percentage))
            .filter(v => Number.isFinite(v))
            .reduce((a, b) => a + b, 0) / arr.length
        : 0
    const accuracyTrend = Math.round((avg(recentValidated) - avg(previousValidated)) * 10) / 10

    const lastValidationTs = validated.length
      ? (validated[0] as any).validation_timestamp || (validated[0] as any).created_at
      : null

    // Recent validations payload for the UI table/list
    const recentValidations = validated.slice(0, 25).map(v => ({
      prediction_id: (v as any).prediction_id,
      video_id: (v as any).video_id,
      predicted_score: Number((v as any).predicted_viral_score ?? 0),
      actual_score: Number((v as any).actual_viral_score ?? 0),
      accuracy_percentage: Number((v as any).accuracy_percentage ?? 0),
      is_accurate: Number((v as any).accuracy_percentage ?? 0) >= 90,
      validation_timestamp: (v as any).validation_timestamp || (v as any).created_at,
      platform: (v as any).platform || 'tiktok'
    }))

    const payload = {
      overall_accuracy: Math.round(overallAccuracy * 10) / 10,
      total_predictions: all.length,
      validated_predictions: validated.length,
      pending_validations: pending.length,
      accuracy_trend: accuracyTrend, // percentage points vs previous cohort
      last_validation_run: lastValidationTs ? new Date(lastValidationTs).toISOString() : null,
      recent_validations: recentValidations
    }

    return NextResponse.json(payload)
  } catch (err: any) {
    // Provide a safe fallback that keeps the UI functional if DB is empty.
    return NextResponse.json(
      {
        overall_accuracy: 0,
        total_predictions: 0,
        validated_predictions: 0,
        pending_validations: 0,
        accuracy_trend: 0,
        last_validation_run: null,
        recent_validations: []
      },
      { status: 200 }
    )
  }
}