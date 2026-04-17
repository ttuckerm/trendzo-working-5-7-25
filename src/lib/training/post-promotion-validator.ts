/**
 * Post-Promotion Validator — 48h production accuracy check
 *
 * Runs on a cron (every 6h). For each model_promotion_log row with
 * action='promote' and post_validation_status='pending', computes the
 * post-promotion Spearman rho from labeled prediction_runs created
 * after the promotion timestamp, compares it to the pre-promotion
 * baseline, and writes a chairman_alerts row if accuracy degraded.
 *
 * Retry schedule (3 attempts, 24h apart):
 *   - 48h after promotion: attempt 1
 *   - 72h after promotion: attempt 2
 *   - 96h after promotion: attempt 3 (final)
 *
 * Minimum sample size: 30 labeled runs. Below 30 the Spearman
 * correlation is statistically meaningless.
 *
 * Degradation tiers (both require Chairman approval to rollback —
 * neither auto-rolls-back):
 *   - delta <= -0.05 (warning)   → severity='warning'
 *   - delta <= -0.10 (critical)  → severity='critical'
 *
 * If after 96h the sample size is still < 30, writes an
 * insufficient_data alert so the Chairman knows the feedback loop
 * is starved.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { spearmanRankCorrelation } from './spearman-evaluator'

const MIN_SAMPLE_SIZE = 30
const WARNING_THRESHOLD = -0.05
const CRITICAL_THRESHOLD = -0.10
const MIN_ELAPSED_HOURS = 48
const FINAL_ATTEMPT_HOURS = 96

export interface PostPromotionValidationResult {
  checked: number
  validated: number
  insufficient_retry: number
  insufficient_final: number
  degradation_alerts: number
  errors: number
  details: Array<{
    promotion_log_id: string
    variant_id: string | null
    niche: string | null
    outcome: 'validated_ok' | 'validated_warning' | 'validated_critical' | 'insufficient_retry' | 'insufficient_final' | 'error'
    sample_size: number
    post_spearman: number | null
    before_spearman: number | null
    delta: number | null
    error?: string
  }>
}

interface PromotionLogRow {
  id: string
  variant_id: string | null
  niche: string | null
  before_spearman: number | null
  created_at: string
  post_validation_attempts: number | null
}

function getDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function runPostPromotionValidation(
  db?: SupabaseClient,
): Promise<PostPromotionValidationResult> {
  const client = db || getDb()
  if (!client) {
    return {
      checked: 0,
      validated: 0,
      insufficient_retry: 0,
      insufficient_final: 0,
      degradation_alerts: 0,
      errors: 1,
      details: [],
    }
  }

  const result: PostPromotionValidationResult = {
    checked: 0,
    validated: 0,
    insufficient_retry: 0,
    insufficient_final: 0,
    degradation_alerts: 0,
    errors: 0,
    details: [],
  }

  // Cutoff: only look at promotions at least 48h old. Rows younger than
  // that aren't eligible for their first check yet.
  const now = Date.now()
  const eligibleBefore = new Date(now - MIN_ELAPSED_HOURS * 3600 * 1000).toISOString()

  const { data: pending, error: pendingErr } = await client
    .from('model_promotion_log')
    .select('id, variant_id, niche, before_spearman, created_at, post_validation_attempts')
    .eq('action', 'promote')
    .eq('post_validation_status', 'pending')
    .lte('created_at', eligibleBefore)
    .order('created_at', { ascending: true })
    .limit(50)

  if (pendingErr) {
    console.error('[PostPromotionValidator] Failed to fetch pending rows:', pendingErr.message)
    result.errors += 1
    return result
  }

  const rows = (pending || []) as PromotionLogRow[]
  result.checked = rows.length

  for (const row of rows) {
    try {
      const promotedAt = new Date(row.created_at)
      const elapsedHours = (now - promotedAt.getTime()) / (3600 * 1000)
      const currentAttempts = row.post_validation_attempts ?? 0
      const isFinalAttempt = elapsedHours >= FINAL_ATTEMPT_HOURS

      // Fetch labeled prediction runs created after the promotion timestamp.
      // We compare on the canonical VPS columns used by spearman-evaluator.
      const { data: runs, error: runsErr } = await client
        .from('prediction_runs')
        .select('id, predicted_dps_7d, actual_dps')
        .gte('created_at', row.created_at)
        .not('predicted_dps_7d', 'is', null)
        .not('actual_dps', 'is', null)
        .limit(5000)

      if (runsErr) {
        throw new Error(`fetch prediction_runs: ${runsErr.message}`)
      }

      const labeled = (runs || []).filter(
        r => r.predicted_dps_7d != null && r.actual_dps != null,
      )
      const sampleSize = labeled.length

      if (sampleSize < MIN_SAMPLE_SIZE) {
        // Not enough data. Either retry later or (if final) write insufficient_data alert.
        if (isFinalAttempt) {
          await client
            .from('model_promotion_log')
            .update({
              post_validation_status: 'insufficient_data',
              post_validation_sample_size: sampleSize,
              post_validation_checked_at: new Date().toISOString(),
              post_validation_attempts: currentAttempts + 1,
            })
            .eq('id', row.id)

          await writeChairmanAlert(client, {
            alert_type: 'insufficient_data',
            severity: 'warning',
            title: `Feedback loop starved: only ${sampleSize} labeled runs 96h after promotion`,
            body: `The model promoted at ${row.created_at} has only ${sampleSize} labeled prediction runs after 96 hours — below the minimum of ${MIN_SAMPLE_SIZE} needed to validate accuracy. Post-promotion accuracy cannot be confirmed.`,
            payload: {
              promotion_log_id: row.id,
              variant_id: row.variant_id,
              niche: row.niche,
              promoted_at: row.created_at,
              sample_size: sampleSize,
              min_required: MIN_SAMPLE_SIZE,
              elapsed_hours: Math.round(elapsedHours),
            },
            action_type: null,
            action_payload: null,
          })

          result.insufficient_final += 1
          result.details.push({
            promotion_log_id: row.id,
            variant_id: row.variant_id,
            niche: row.niche,
            outcome: 'insufficient_final',
            sample_size: sampleSize,
            post_spearman: null,
            before_spearman: row.before_spearman,
            delta: null,
          })
        } else {
          // Increment attempts but keep pending; leave checked_at null so
          // we know validation hasn't completed yet.
          await client
            .from('model_promotion_log')
            .update({ post_validation_attempts: currentAttempts + 1 })
            .eq('id', row.id)

          result.insufficient_retry += 1
          result.details.push({
            promotion_log_id: row.id,
            variant_id: row.variant_id,
            niche: row.niche,
            outcome: 'insufficient_retry',
            sample_size: sampleSize,
            post_spearman: null,
            before_spearman: row.before_spearman,
            delta: null,
          })
        }
        continue
      }

      // Enough samples — compute Spearman rho.
      const predicted = labeled.map(r => Number(r.predicted_dps_7d))
      const actual = labeled.map(r => Number(r.actual_dps))
      const rho = spearmanRankCorrelation(predicted, actual).rho
      const postSpearman = Math.round(rho * 10000) / 10000

      const beforeSpearman = row.before_spearman
      const delta =
        beforeSpearman != null ? Math.round((postSpearman - beforeSpearman) * 10000) / 10000 : null

      await client
        .from('model_promotion_log')
        .update({
          post_validation_status: 'validated',
          post_validation_spearman: postSpearman,
          post_validation_sample_size: sampleSize,
          post_validation_checked_at: new Date().toISOString(),
          post_validation_attempts: currentAttempts + 1,
        })
        .eq('id', row.id)

      result.validated += 1

      // Degradation check
      if (delta != null && delta <= WARNING_THRESHOLD) {
        const severity: 'warning' | 'critical' = delta <= CRITICAL_THRESHOLD ? 'critical' : 'warning'
        const tierLabel = severity === 'critical' ? 'CRITICAL' : 'Warning'
        const scope = row.niche || 'Global'

        await writeChairmanAlert(client, {
          alert_type: 'model_degradation',
          severity,
          title: `${tierLabel}: ${scope} model accuracy dropped ${delta} after promotion`,
          body: `Post-promotion Spearman (${postSpearman.toFixed(4)}) is ${Math.abs(delta).toFixed(4)} lower than the pre-promotion baseline (${beforeSpearman?.toFixed(4)}). Sample size: ${sampleSize} labeled runs over ${Math.round(elapsedHours)}h. Review and consider rollback.`,
          payload: {
            promotion_log_id: row.id,
            variant_id: row.variant_id,
            niche: row.niche,
            promoted_at: row.created_at,
            before_spearman: beforeSpearman,
            post_spearman: postSpearman,
            delta,
            sample_size: sampleSize,
            elapsed_hours: Math.round(elapsedHours),
            threshold: severity === 'critical' ? CRITICAL_THRESHOLD : WARNING_THRESHOLD,
          },
          action_type: 'rollback_model',
          action_payload: { niche: row.niche },
        })

        result.degradation_alerts += 1
        result.details.push({
          promotion_log_id: row.id,
          variant_id: row.variant_id,
          niche: row.niche,
          outcome: severity === 'critical' ? 'validated_critical' : 'validated_warning',
          sample_size: sampleSize,
          post_spearman: postSpearman,
          before_spearman: beforeSpearman,
          delta,
        })
      } else {
        result.details.push({
          promotion_log_id: row.id,
          variant_id: row.variant_id,
          niche: row.niche,
          outcome: 'validated_ok',
          sample_size: sampleSize,
          post_spearman: postSpearman,
          before_spearman: beforeSpearman,
          delta,
        })
      }
    } catch (err: any) {
      console.error(`[PostPromotionValidator] Row ${row.id} failed:`, err.message)
      result.errors += 1
      result.details.push({
        promotion_log_id: row.id,
        variant_id: row.variant_id,
        niche: row.niche,
        outcome: 'error',
        sample_size: 0,
        post_spearman: null,
        before_spearman: row.before_spearman,
        delta: null,
        error: err.message,
      })
    }
  }

  return result
}

// ── Helper: write an alert to chairman_alerts ─────────────────────────

interface ChairmanAlertInput {
  alert_type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  body: string
  payload: Record<string, any>
  action_type: string | null
  action_payload: Record<string, any> | null
}

async function writeChairmanAlert(
  db: SupabaseClient,
  alert: ChairmanAlertInput,
): Promise<void> {
  const { error } = await db.from('chairman_alerts').insert({
    alert_type: alert.alert_type,
    severity: alert.severity,
    title: alert.title,
    body: alert.body,
    payload: alert.payload,
    action_type: alert.action_type,
    action_payload: alert.action_payload,
    status: 'open',
  } as any)
  if (error) {
    console.error('[PostPromotionValidator] Failed to write chairman_alert:', error.message)
  }
}
