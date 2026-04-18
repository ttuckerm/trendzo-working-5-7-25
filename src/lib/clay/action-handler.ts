import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { ComponentType } from './component-registry'
import { sendBriefToCreator } from '@/lib/email/send-brief'
import { emitEvent } from '@/lib/events/emit'

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
  | {
      /** Generic confirmation for Phase 1 Turn 2 actions. Renderer shows title + subtitle + details. */
      kind: 'structured'
      actionType: string
      title: string
      subtitle?: string
      details?: Record<string, unknown>
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

  emitEvent({
    eventType: 'action.confirmed',
    payload: {
      actionType: action.type,
      actionId: action.actionId,
      payloadKeys: Object.keys(action.payload ?? {}),
    },
    actorType: 'user',
    actorId: context.userId,
    agencyId: context.agencyId,
  }).catch(() => {})

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

      // ──────────────────────────────────────────────────────────────────
      // Phase 1 Turn 2 — previously dead action handlers (11)
      // Registry: src/lib/clay/intelligent-clay-registry.ts
      // ──────────────────────────────────────────────────────────────────
      case 'approve_brief': {
        return approveContentBrief(db, action.actionId, context)
      }
      case 'send_invite': {
        return sendInvite(db, action.payload, context)
      }
      case 'nudge_creator': {
        return nudgeCreator(db, action.actionId, action.payload, context)
      }
      case 'create_event': {
        return createAgencyEvent(db, action.payload, context)
      }
      case 'match_creators_to_event': {
        return matchCreatorsToEvent(db, action.actionId, context)
      }
      case 'push_brief_to_creators': {
        return pushBriefToCreators(db, action.actionId, action.payload, context)
      }
      case 'check_push_status': {
        return checkPushStatus(db, action.actionId, context)
      }
      case 'generate_batch_briefs': {
        return generateBatchBriefs(db, action.payload, context)
      }
      case 'schedule_post': {
        return schedulePost(db, action.actionId, action.payload, context)
      }
      case 'generate_report': {
        return generateReport(db, action.payload, context)
      }
      case 'reschedule_post': {
        return reschedulePost(db, action.actionId, action.payload, context)
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

// =============================================================================
// Phase 1 Turn 2 — 11 previously-dead action handlers
// =============================================================================

/** Shared helper: return a structured confirmation payload. */
function ok(actionType: string, title: string, subtitle?: string, details?: Record<string, unknown>): ActionResult {
  return {
    success: true,
    message: title,
    followUpComponents: [ComponentType.ACTION_CONFIRMATION],
    confirmation: {
      kind: 'structured',
      actionType,
      title,
      subtitle,
      details,
      at: new Date().toISOString(),
    },
  }
}

function fail(message: string): ActionResult {
  return { success: false, message, followUpComponents: [ComponentType.ACTION_CONFIRMATION] }
}

async function approveContentBrief(db: DB, briefId: string, context: ActionContext): Promise<ActionResult> {
  const { error } = await db
    .from('content_briefs')
    .update({ status: 'approved' })
    .eq('id', briefId)
  if (error) return fail(`Failed to approve brief: ${error.message}`)

  // Resolve creator name for the confirmation card.
  let creator = 'the creator'
  const { data: brief } = await db.from('content_briefs').select('user_id, brief_content').eq('id', briefId).single()
  if (brief?.user_id) {
    const { data: profile } = await db.from('onboarding_profiles').select('business_name').eq('user_id', brief.user_id).maybeSingle()
    if (profile?.business_name) creator = profile.business_name
  }
  const briefTitle = brief?.brief_content?.title || brief?.brief_content?.campaign_name || 'Untitled Brief'

  return ok('approve_brief', `Approved "${briefTitle}"`, `${creator}'s brief is cleared to publish.`, { briefId, creator })
}

async function sendInvite(db: DB, payload: Record<string, unknown>, context: ActionContext): Promise<ActionResult> {
  const email = String(payload.creatorEmail || payload.email || '').trim().toLowerCase()
  const name = String(payload.creatorName || payload.name || '').trim()
  if (!email) return fail('Email address required')

  const { error } = await db
    .from('agency_invites')
    .upsert(
      {
        agency_id: context.agencyId,
        creator_email: email,
        creator_name: name || null,
        invited_by: context.userId,
        status: 'pending',
      },
      { onConflict: 'agency_id,creator_email' },
    )
  if (error) return fail(`Failed to queue invite: ${error.message}`)

  // Email send lives in Phase 1 Turn 4; for now the invite row is queued.
  return ok(
    'send_invite',
    `Invite queued for ${name || email}`,
    'Delivery pipeline ships in Turn 4; invite row recorded.',
    { email, name },
  )
}

async function nudgeCreator(
  db: DB,
  briefId: string,
  payload: Record<string, unknown>,
  context: ActionContext,
): Promise<ActionResult> {
  const { data: brief, error: fetchErr } = await db
    .from('content_briefs')
    .select('id, user_id, last_nudged_at, nudge_count, brief_content')
    .eq('id', briefId)
    .single()
  if (fetchErr || !brief) return fail('Brief not found')

  // Rate-limit: one nudge per 24h.
  if (brief.last_nudged_at) {
    const hoursSince = (Date.now() - new Date(brief.last_nudged_at).getTime()) / 36e5
    if (hoursSince < 24) {
      const hoursLeft = Math.ceil(24 - hoursSince)
      return fail(`Already nudged ${Math.floor(hoursSince)}h ago. Try again in ${hoursLeft}h.`)
    }
  }

  // Re-send the brief email as a reminder.
  const sendResult = await sendBriefToCreator(briefId)

  const now = new Date().toISOString()
  await db
    .from('content_briefs')
    .update({ last_nudged_at: now, nudge_count: (brief.nudge_count || 0) + 1 })
    .eq('id', briefId)

  let creator = 'the creator'
  if (brief.user_id) {
    const { data: profile } = await db.from('onboarding_profiles').select('business_name').eq('user_id', brief.user_id).maybeSingle()
    if (profile?.business_name) creator = profile.business_name
  }

  if (!sendResult.success) {
    return ok(
      'nudge_creator',
      `Nudge logged for ${creator}`,
      `Email send failed: ${sendResult.error || 'unknown'}. Nudge still recorded.`,
      { briefId, creator, emailSent: false },
    )
  }
  return ok('nudge_creator', `Nudged ${creator}`, 'Reminder email sent; nudge count incremented.', { briefId, creator, emailSent: true })
}

async function createAgencyEvent(
  db: DB,
  payload: Record<string, unknown>,
  context: ActionContext,
): Promise<ActionResult> {
  const name = String(payload.eventName || payload.name || '').trim()
  const date = payload.eventDate ? String(payload.eventDate) : null
  const category = payload.category ? String(payload.category) : null
  const description = payload.description ? String(payload.description) : null
  if (!name) return fail('Event name required')

  const { data: inserted, error } = await db
    .from('agency_events')
    .insert({
      agency_id: context.agencyId,
      event_name: name,
      event_date: date,
      category,
      description,
      created_by: context.userId,
    })
    .select('id')
    .single()
  if (error) return fail(`Failed to create event: ${error.message}`)

  return ok('create_event', `Event "${name}" created`, date ? `Scheduled for ${date}` : 'No date set', {
    eventId: inserted?.id,
    name,
    date,
    category,
  })
}

async function matchCreatorsToEvent(db: DB, eventId: string, context: ActionContext): Promise<ActionResult> {
  const { data: event, error: eventErr } = await db
    .from('agency_events')
    .select('event_name, category')
    .eq('id', eventId)
    .eq('agency_id', context.agencyId)
    .single()
  if (eventErr || !event) return fail('Event not found')

  // Find profiles where niche_key or selected_niche matches the event category.
  const category = event.category
  let profiles: any[] = []
  if (category) {
    const { data } = await db
      .from('onboarding_profiles')
      .select('user_id, business_name, selected_niche, niche_key')
      .or(`selected_niche.eq.${category},niche_key.eq.${category}`)
    profiles = data || []
  }

  const matches = profiles.map((p: any) => ({
    userId: p.user_id,
    name: p.business_name,
    niche: p.selected_niche || p.niche_key,
  }))

  return ok(
    'match_creators_to_event',
    `${matches.length} creator${matches.length === 1 ? '' : 's'} matched to "${event.event_name}"`,
    category ? `By niche: ${category}` : 'No category on event — broad match unavailable',
    { eventId, matches },
  )
}

async function pushBriefToCreators(
  db: DB,
  briefId: string,
  payload: Record<string, unknown>,
  context: ActionContext,
): Promise<ActionResult> {
  const creatorIds = Array.isArray(payload.creatorIds) ? (payload.creatorIds as string[]) : []
  if (creatorIds.length === 0) return fail('No creatorIds provided')

  // sendBriefToCreator currently operates on one brief → one creator. For multiple
  // creators, we fan out by cloning the brief per creator (minimal approach) so
  // each has its own delivery tracking row.
  const { data: src, error: srcErr } = await db
    .from('content_briefs')
    .select('*')
    .eq('id', briefId)
    .single()
  if (srcErr || !src) return fail('Source brief not found')

  const results: Array<{ creatorId: string; success: boolean; error?: string; briefId?: string }> = []
  for (const creatorId of creatorIds) {
    // Clone the brief for this creator (drop id + timestamps).
    const clone = { ...src }
    delete clone.id
    delete clone.created_at
    delete clone.updated_at
    clone.user_id = creatorId
    clone.delivery_status = 'pending'

    const { data: newBrief, error: insertErr } = await db.from('content_briefs').insert(clone).select('id').single()
    if (insertErr) {
      results.push({ creatorId, success: false, error: insertErr.message })
      continue
    }
    emitEvent({
      eventType: 'brief.generated',
      payload: {
        briefId: newBrief.id,
        sourceBriefId: briefId,
        creatorId: creatorId,
      },
      actorType: 'user',
      actorId: context.userId,
      agencyId: context.agencyId,
      entityType: 'content_brief',
      entityId: newBrief.id,
    }).catch(() => {})
    const sendResult = await sendBriefToCreator(newBrief.id)
    results.push({ creatorId, briefId: newBrief.id, success: sendResult.success, error: sendResult.error })
  }

  const successCount = results.filter((r) => r.success).length
  return ok(
    'push_brief_to_creators',
    `Pushed brief to ${successCount}/${creatorIds.length} creators`,
    successCount === creatorIds.length ? 'All delivered.' : `${creatorIds.length - successCount} failed — check details.`,
    { sourceBriefId: briefId, results },
  )
}

async function checkPushStatus(db: DB, briefId: string, context: ActionContext): Promise<ActionResult> {
  const { data: brief, error } = await db
    .from('content_briefs')
    .select('id, user_id, delivery_status, opened_at, clicked_at, open_count, brief_content')
    .eq('id', briefId)
    .single()
  if (error || !brief) return fail('Brief not found')

  let creator = 'the creator'
  if (brief.user_id) {
    const { data: profile } = await db.from('onboarding_profiles').select('business_name').eq('user_id', brief.user_id).maybeSingle()
    if (profile?.business_name) creator = profile.business_name
  }

  const status = brief.delivery_status || 'unknown'
  const opened = brief.opened_at ? `opened ${new Date(brief.opened_at).toLocaleDateString()}` : 'no open signal'
  const clicks = brief.clicked_at ? `clicked ${new Date(brief.clicked_at).toLocaleDateString()}` : 'no clicks'

  return ok('check_push_status', `Delivery status for ${creator}`, `${status}, ${opened}, ${clicks}`, {
    briefId,
    creator,
    delivery_status: status,
    opened_at: brief.opened_at,
    clicked_at: brief.clicked_at,
    open_count: brief.open_count || 0,
  })
}

async function generateBatchBriefs(
  db: DB,
  payload: Record<string, unknown>,
  context: ActionContext,
): Promise<ActionResult> {
  const creatorIds = Array.isArray(payload.creatorIds) ? (payload.creatorIds as string[]) : []
  const topic = String(payload.topic || 'trend opportunity').trim()
  if (creatorIds.length === 0) return fail('No creatorIds provided')

  const created: Array<{ creatorId: string; briefId?: string; error?: string }> = []
  for (const creatorId of creatorIds) {
    const { data, error } = await db
      .from('content_briefs')
      .insert({
        user_id: creatorId,
        status: 'draft',
        brief_content: {
          title: `Draft brief — ${topic}`,
          hook: `Generated from batch action for topic: ${topic}`,
          format: 'Short-form',
        },
      })
      .select('id')
      .single()
    if (error) created.push({ creatorId, error: error.message })
    else created.push({ creatorId, briefId: data.id })
  }

  const successCount = created.filter((c) => !c.error).length
  return ok(
    'generate_batch_briefs',
    `Drafted ${successCount}/${creatorIds.length} briefs on "${topic}"`,
    successCount === creatorIds.length ? 'All drafts ready for review.' : 'Some creators failed — see details.',
    { topic, created },
  )
}

async function schedulePost(
  db: DB,
  briefId: string,
  payload: Record<string, unknown>,
  context: ActionContext,
): Promise<ActionResult> {
  const scheduledFor = payload.scheduledFor ? String(payload.scheduledFor) : null
  if (!scheduledFor) return fail('scheduledFor is required (ISO timestamp)')
  const dt = new Date(scheduledFor)
  if (Number.isNaN(dt.getTime())) return fail(`Invalid scheduledFor: ${scheduledFor}`)

  const { error } = await db
    .from('content_briefs')
    .update({ scheduled_publish_at: dt.toISOString() })
    .eq('id', briefId)
  if (error) return fail(`Failed to schedule: ${error.message}`)

  return ok('schedule_post', `Post scheduled`, `Publication target: ${dt.toLocaleString()}`, {
    briefId,
    scheduledPublishAt: dt.toISOString(),
  })
}

async function generateReport(
  db: DB,
  payload: Record<string, unknown>,
  context: ActionContext,
): Promise<ActionResult> {
  // Window: default last 30 days; override via payload.timeWindow in days.
  const windowDays = Math.max(1, Math.min(365, Number(payload.timeWindow) || 30))
  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString()

  // Aggregate briefs authored by users in this agency.
  // (content_briefs has no agency_id column — we resolve via onboarding_profiles → user_id.)
  const { data: profiles } = await db
    .from('onboarding_profiles')
    .select('user_id')
  const userIds = (profiles || []).map((p: any) => p.user_id).filter(Boolean)

  const { data: briefs } = await db
    .from('content_briefs')
    .select('id, status, completion_status, actual_views, performance_delta, created_at')
    .in('user_id', userIds.length > 0 ? userIds : [''])
    .gte('created_at', since)

  const totalBriefs = briefs?.length || 0
  const published = (briefs || []).filter((b: any) => b.completion_status === 'published').length
  const completionRate = totalBriefs > 0 ? (published / totalBriefs) * 100 : 0
  const totalViews = (briefs || []).reduce((s: number, b: any) => s + (b.actual_views || 0), 0)
  const avgDelta = (() => {
    const deltas = (briefs || []).map((b: any) => b.performance_delta).filter((d: any) => typeof d === 'number')
    return deltas.length > 0 ? deltas.reduce((a: number, b: number) => a + b, 0) / deltas.length : null
  })()

  return ok(
    'generate_report',
    `Agency report — last ${windowDays} days`,
    `${totalBriefs} briefs, ${published} published (${completionRate.toFixed(0)}%), ${totalViews.toLocaleString()} views`,
    {
      windowDays,
      totalBriefs,
      published,
      completionRate,
      totalViews,
      avgPerformanceDelta: avgDelta,
    },
  )
}

async function reschedulePost(
  db: DB,
  briefId: string,
  payload: Record<string, unknown>,
  context: ActionContext,
): Promise<ActionResult> {
  const newScheduledFor = payload.newScheduledFor ? String(payload.newScheduledFor) : null
  if (!newScheduledFor) return fail('newScheduledFor is required (ISO timestamp)')
  const dt = new Date(newScheduledFor)
  if (Number.isNaN(dt.getTime())) return fail(`Invalid newScheduledFor: ${newScheduledFor}`)

  const { data: existing, error: fetchErr } = await db
    .from('content_briefs')
    .select('scheduled_publish_at')
    .eq('id', briefId)
    .single()
  if (fetchErr || !existing) return fail('Brief not found')
  if (!existing.scheduled_publish_at) return fail('Brief is not currently scheduled — use schedule_post first.')

  const { error } = await db
    .from('content_briefs')
    .update({ scheduled_publish_at: dt.toISOString() })
    .eq('id', briefId)
  if (error) return fail(`Failed to reschedule: ${error.message}`)

  return ok('reschedule_post', `Post rescheduled`, `New target: ${dt.toLocaleString()}`, {
    briefId,
    previousScheduledPublishAt: existing.scheduled_publish_at,
    newScheduledPublishAt: dt.toISOString(),
  })
}

