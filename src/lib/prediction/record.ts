import { getServerDb, ensureP1AccuracyTables } from '@/lib/db/ensure'

type RecordPredictionParams = {
  templateId: string
  variantId?: string | null
  cohortSnapshot: any
  predictedProb: number
  modelVersion?: string | null
  force?: boolean
}

/**
 * Best-effort recorder for prediction_event rows with a small dedupe window.
 * - Dedupe: at most 1 row per (templateId, variantId) per 10 minutes unless force=true
 */
export async function recordPrediction(params: RecordPredictionParams): Promise<void> {
  const db = getServerDb()
  if (!db) return
  await ensureP1AccuracyTables()

  const templateId = String(params.templateId)
  const variantId = params.variantId ? String(params.variantId) : null
  const predictedProb = Number(params.predictedProb)
  const modelVersion = params.modelVersion ? String(params.modelVersion) : null
  const cohortSnapshot = params.cohortSnapshot || null
  const force = Boolean(params.force)

  try {
    if (!force) {
      const sinceISO = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      let query = db
        .from('prediction_event')
        .select('id')
        .eq('template_id', templateId)
        .gte('created_at', sinceISO)
        .limit(1)

      query = variantId ? query.eq('variant_id', variantId) : (query as any).is('variant_id', null)

      const { data } = await query
      if (Array.isArray(data) && data.length) return
    }

    await db.from('prediction_event').insert({
      template_id: templateId,
      variant_id: variantId,
      cohort_snapshot: cohortSnapshot,
      predicted_prob: predictedProb,
      model_version: modelVersion
    } as any)
  } catch {}
}


