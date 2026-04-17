import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { ComponentType } from './component-registry'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any

interface ActionInput {
  actionId: string
  type: string
  payload: Record<string, unknown>
}

interface ActionContext {
  agencyId: string
  userId: string
}

export type ActionConfirmationPayload =
  | {
      kind: 'brief_status'
      briefId: string
      briefTitle: string
      creator: string
      previousStatus: string
      newStatus: string
      publishedUrl?: string
      at: string
    }
  | {
      kind: 'performance'
      briefId: string
      briefTitle: string
      creator: string
      vpsPrediction: number | null
      actualViews: number | null
      actualEngagementRate: number | null
      performanceDelta: number | null
      at: string
    }

interface ActionResult {
  success: boolean
  message: string
  followUpComponents?: ComponentType[]
  confirmation?: ActionConfirmationPayload
}

function getServiceClient(): DB {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

/**
 * Handle Clay component actions — DB mutations triggered by operator clicks.
 * Returns a result with optional follow-up components to render.
 */
export async function handleComponentAction(
  action: ActionInput,
  context: ActionContext,
): Promise<ActionResult> {
  const db = getServiceClient()

  try {
    switch (action.type) {
      case 'approve': {
        // Could be a brief or a trainer experiment
        if (action.payload.experimentId || action.payload.type === 'approve-trainer') {
          return approveTrainerExperiment(db, action.actionId)
        }
        return approveBrief(db, action.actionId, context)
      }

      case 'reject': {
        if (action.payload.experimentId || action.payload.type === 'reject-trainer') {
          return rejectTrainerExperiment(db, action.actionId)
        }
        return rejectBrief(db, action.actionId, context)
      }

      case 'generate-brief': {
        return generateBriefFromTrend(db, action.actionId, context)
      }

      case 'generate-recovery-brief': {
        return generateRecoveryBrief(db, action.actionId, context)
      }

      case 'select-variant': {
        const briefId = action.payload.briefId as string
        return selectVariant(db, action.actionId, briefId)
      }

      case 'confirm': {
        // Generic confirmation — no additional DB action needed
        return { success: true, message: 'Action confirmed', followUpComponents: [ComponentType.ACTION_CONFIRMATION] }
      }

      case 'cancel': {
        return { success: true, message: 'Action cancelled', followUpComponents: [ComponentType.ACTION_CONFIRMATION] }
      }

      case 'acknowledge_alert':
      case 'dismiss_alert': {
        return dismissAlert(db, action.actionId, action.type)
      }

      case 'update_brief_status': {
        const newStatus = String(action.payload.new_status || '') as 'acknowledged' | 'in_production' | 'published'
        const publishedUrl = typeof action.payload.published_url === 'string' ? action.payload.published_url : undefined
        return updateBriefStatus(db, action.actionId, newStatus, publishedUrl)
      }

      case 'log_performance': {
        const views = action.payload.actual_views
        const engagement = action.payload.actual_engagement_rate
        return logBriefPerformance(db, action.actionId, views, engagement)
      }

      case 'upgrade': {
        // Upgrade CTA — no DB mutation, return a redirect hint
        return { success: true, message: 'Redirecting to upgrade page' }
      }

      default:
        return { success: false, message: `Unknown action type: ${action.type}` }
    }
  } catch (error) {
    console.error('[action-handler] Error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Action failed',
      followUpComponents: [ComponentType.ACTION_CONFIRMATION],
    }
  }
}

async function approveBrief(
  db: DB,
  briefId: string,
  context: ActionContext,
): Promise<ActionResult> {
  const { error } = await db
    .from('pre_generated_briefs')
    .update({ status: 'approved', approved_by: context.userId, approved_at: new Date().toISOString() })
    .eq('id', briefId)
    .eq('agency_id', context.agencyId)

  if (error) {
    return { success: false, message: `Failed to approve brief: ${error.message}`, followUpComponents: [ComponentType.ACTION_CONFIRMATION] }
  }

  return {
    success: true,
    message: 'Brief approved',
    followUpComponents: [ComponentType.ACTION_CONFIRMATION],
  }
}

async function rejectBrief(
  db: DB,
  briefId: string,
  context: ActionContext,
): Promise<ActionResult> {
  const { error } = await db
    .from('pre_generated_briefs')
    .update({ status: 'rejected', rejected_by: context.userId, rejected_at: new Date().toISOString() })
    .eq('id', briefId)
    .eq('agency_id', context.agencyId)

  if (error) {
    return { success: false, message: `Failed to reject brief: ${error.message}`, followUpComponents: [ComponentType.ACTION_CONFIRMATION] }
  }

  return {
    success: true,
    message: 'Brief rejected',
    followUpComponents: [ComponentType.ACTION_CONFIRMATION],
  }
}

async function generateBriefFromTrend(
  db: DB,
  eventId: string,
  context: ActionContext,
): Promise<ActionResult> {
  // Fetch the event to build a brief seed
  let eventData: Record<string, unknown> = {}
  const { data: event } = await db
    .from('cultural_events')
    .select('event_name, category, description, event_date')
    .eq('id', eventId)
    .single()

  if (event) {
    eventData = event
  } else {
    // Try agency_events fallback
    const { data: altEvent } = await db
      .from('agency_events')
      .select('event_name, category, description, event_date')
      .eq('id', eventId)
      .single()

    if (!altEvent) {
      return { success: false, message: 'Event not found' }
    }
    eventData = altEvent
  }

  const { error } = await db
    .from('pre_generated_briefs')
    .insert({
      agency_id: context.agencyId,
      cultural_event_id: eventId,
      status: 'draft',
      priority_type: 'trend_opportunity',
      niche: 'general',
      brief_content: {
        title: `Brief for ${eventData.event_name || 'trend'}`,
        hook: eventData.description || '',
        format: 'Short-form',
      },
      vps_score: 0,
    })

  if (error) {
    return { success: false, message: `Failed to generate brief: ${error.message}` }
  }

  return {
    success: true,
    message: 'Brief draft created from trend — ready for review',
    followUpComponents: [ComponentType.ACTION_CONFIRMATION, ComponentType.CONTENT_BRIEF],
  }
}

async function generateRecoveryBrief(
  db: DB,
  creatorId: string,
  context: ActionContext,
): Promise<ActionResult> {
  const { error } = await db
    .from('pre_generated_briefs')
    .insert({
      agency_id: context.agencyId,
      client_id: creatorId,
      status: 'draft',
      priority_type: 'decay_warning',
      niche: 'general',
      brief_content: {
        title: 'Momentum Recovery Brief',
        hook: 'Re-engage audience with trending format',
        format: 'Short-form',
      },
      vps_score: 0,
    })

  if (error) {
    return { success: false, message: `Failed to create recovery brief: ${error.message}` }
  }

  return {
    success: true,
    message: 'Recovery brief created — ready for review',
    followUpComponents: [ComponentType.ACTION_CONFIRMATION, ComponentType.CONTENT_BRIEF],
  }
}

async function approveTrainerExperiment(
  db: DB,
  experimentId: string,
): Promise<ActionResult> {
  // Update experiment status
  const { data: experiment, error: fetchError } = await db
    .from('training_experiments')
    .select('niche_scope')
    .eq('id', experimentId)
    .single()

  if (fetchError || !experiment) {
    return { success: false, message: 'Experiment not found', followUpComponents: [ComponentType.ACTION_CONFIRMATION] }
  }

  const { error: updateError } = await db
    .from('training_experiments')
    .update({ result: 'approved', approved_at: new Date().toISOString() })
    .eq('id', experimentId)

  if (updateError) {
    return { success: false, message: `Failed to approve: ${updateError.message}`, followUpComponents: [ComponentType.ACTION_CONFIRMATION] }
  }

  // Promote the model variant
  const niche = experiment.niche_scope
  // Deactivate current active variant for this niche
  if (niche) {
    await db.from('model_variants').update({ is_active: false }).eq('niche', niche).eq('is_active', true)
  } else {
    await db.from('model_variants').update({ is_active: false }).is('niche', null).eq('is_active', true)
  }

  // Activate the experiment's variant
  await db
    .from('model_variants')
    .update({ is_active: true })
    .eq('experiment_id', experimentId)

  return {
    success: true,
    message: 'Model variant approved and deployed',
    followUpComponents: [ComponentType.ACTION_CONFIRMATION],
  }
}

async function rejectTrainerExperiment(
  db: DB,
  experimentId: string,
): Promise<ActionResult> {
  const { error } = await db
    .from('training_experiments')
    .update({ result: 'rejected', rejected_at: new Date().toISOString() })
    .eq('id', experimentId)

  if (error) {
    return { success: false, message: `Failed to reject: ${error.message}`, followUpComponents: [ComponentType.ACTION_CONFIRMATION] }
  }

  return {
    success: true,
    message: 'Model variant rejected',
    followUpComponents: [ComponentType.ACTION_CONFIRMATION],
  }
}

async function selectVariant(
  db: DB,
  variantId: string,
  briefId: string,
): Promise<ActionResult> {
  // Deselect all variants for this brief
  const { error: deselectError } = await db
    .from('brief_variants')
    .update({ was_selected: false })
    .eq('brief_id', briefId)

  if (deselectError) {
    return { success: false, message: `Failed to update variants: ${deselectError.message}` }
  }

  // Select the chosen variant
  const { error: selectError } = await db
    .from('brief_variants')
    .update({ was_selected: true })
    .eq('id', variantId)
    .eq('brief_id', briefId)

  if (selectError) {
    return { success: false, message: `Failed to select variant: ${selectError.message}` }
  }

  return {
    success: true,
    message: 'Variant selected',
    followUpComponents: [ComponentType.ACTION_CONFIRMATION],
  }
}

async function updateBriefStatus(
  db: DB,
  briefId: string,
  newStatus: 'acknowledged' | 'in_production' | 'published',
  publishedUrl?: string,
): Promise<ActionResult> {
  const VALID: Record<string, string[]> = {
    acknowledged: ['delivered'],
    in_production: ['acknowledged'],
    published: ['in_production'],
  }
  if (!VALID[newStatus]) {
    return { success: false, message: `Invalid status: ${newStatus}`, followUpComponents: [ComponentType.ACTION_CONFIRMATION] }
  }

  const { data: brief, error: fetchErr } = await db
    .from('content_briefs')
    .select('id, user_id, brief_content, completion_status')
    .eq('id', briefId)
    .single()

  if (fetchErr || !brief) {
    return { success: false, message: 'Brief not found', followUpComponents: [ComponentType.ACTION_CONFIRMATION] }
  }

  const current = brief.completion_status || 'delivered'
  if (!VALID[newStatus].includes(current)) {
    return {
      success: false,
      message: `Invalid transition: ${current} -> ${newStatus}`,
      followUpComponents: [ComponentType.ACTION_CONFIRMATION],
    }
  }

  const now = new Date().toISOString()
  const update: Record<string, unknown> = { completion_status: newStatus }
  if (newStatus === 'acknowledged') update.acknowledged_at = now
  if (newStatus === 'in_production') update.in_production_at = now
  if (newStatus === 'published') {
    update.published_at = now
    if (publishedUrl && publishedUrl.trim()) update.published_url = publishedUrl.trim()
  }

  const { error: updateErr } = await db.from('content_briefs').update(update).eq('id', briefId)
  if (updateErr) {
    return { success: false, message: `Failed to update: ${updateErr.message}`, followUpComponents: [ComponentType.ACTION_CONFIRMATION] }
  }

  // Resolve creator name for the confirmation card
  let creator = 'Unknown'
  if (brief.user_id) {
    const { data: profile } = await db
      .from('onboarding_profiles')
      .select('business_name')
      .eq('user_id', brief.user_id)
      .maybeSingle()
    if (profile?.business_name) creator = profile.business_name
  }

  const briefTitle = brief.brief_content?.title || brief.brief_content?.campaign_name || 'Untitled Brief'
  const label = newStatus === 'in_production' ? 'In Production' : newStatus === 'published' ? 'Published' : 'Acknowledged'

  return {
    success: true,
    message: `Brief marked ${label}`,
    followUpComponents: [ComponentType.ACTION_CONFIRMATION],
    confirmation: {
      kind: 'brief_status',
      briefId,
      briefTitle,
      creator,
      previousStatus: current,
      newStatus,
      publishedUrl: publishedUrl && publishedUrl.trim() ? publishedUrl.trim() : undefined,
      at: now,
    },
  }
}

async function logBriefPerformance(
  db: DB,
  briefId: string,
  rawViews: unknown,
  rawEngagement: unknown,
): Promise<ActionResult> {
  const toNum = (v: unknown): number | null => {
    if (v === null || v === undefined || v === '') return null
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) ? n : null
  }
  const views = toNum(rawViews)
  const engagement = toNum(rawEngagement)
  if (views === null && engagement === null) {
    return {
      success: false,
      message: 'Provide at least actual views or engagement rate',
      followUpComponents: [ComponentType.ACTION_CONFIRMATION],
    }
  }

  const { data: brief, error: fetchErr } = await db
    .from('content_briefs')
    .select('id, user_id, brief_content, vps_prediction, predicted_vps')
    .eq('id', briefId)
    .single()

  if (fetchErr || !brief) {
    return { success: false, message: 'Brief not found', followUpComponents: [ComponentType.ACTION_CONFIRMATION] }
  }

  const prediction = toNum(brief.vps_prediction) ?? toNum(brief.predicted_vps)
  const delta = prediction !== null && views !== null ? views - prediction : null
  const now = new Date().toISOString()

  const { error: updateErr } = await db
    .from('content_briefs')
    .update({
      actual_views: views,
      actual_engagement_rate: engagement,
      performance_delta: delta,
      performance_measured_at: now,
      performance_source: 'manual',
    })
    .eq('id', briefId)

  if (updateErr) {
    return { success: false, message: `Failed to log performance: ${updateErr.message}`, followUpComponents: [ComponentType.ACTION_CONFIRMATION] }
  }

  let creator = 'Unknown'
  if (brief.user_id) {
    const { data: profile } = await db
      .from('onboarding_profiles')
      .select('business_name')
      .eq('user_id', brief.user_id)
      .maybeSingle()
    if (profile?.business_name) creator = profile.business_name
  }

  const briefTitle = brief.brief_content?.title || brief.brief_content?.campaign_name || 'Untitled Brief'
  const deltaStr = delta === null ? 'no prediction on record' : `delta ${delta >= 0 ? '+' : ''}${delta}`

  return {
    success: true,
    message: `Performance logged (${deltaStr})`,
    followUpComponents: [ComponentType.ACTION_CONFIRMATION],
    confirmation: {
      kind: 'performance',
      briefId,
      briefTitle,
      creator,
      vpsPrediction: prediction,
      actualViews: views,
      actualEngagementRate: engagement,
      performanceDelta: delta,
      at: now,
    },
  }
}

async function dismissAlert(
  db: DB,
  alertId: string,
  actionType: string,
): Promise<ActionResult> {
  const newStatus = actionType === 'acknowledge_alert' ? 'acknowledged' : 'dismissed'

  try {
    await db
      .from('chairman_alerts')
      .update({ status: newStatus })
      .eq('id', alertId)
  } catch {
    // Table may not exist — that's fine
  }

  return {
    success: true,
    message: actionType === 'acknowledge_alert' ? 'Alert acknowledged' : 'Alert dismissed',
    followUpComponents: [ComponentType.ACTION_CONFIRMATION],
  }
}
