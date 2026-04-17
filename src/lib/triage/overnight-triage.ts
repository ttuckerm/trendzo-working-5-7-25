/**
 * Overnight Triage Job — Phase 1 Turn 4
 *
 * Runs nightly at 06:00 UTC (scheduler.ts). For each agency, scans:
 *   - Overdue briefs (delivered + not acknowledged past 24h)
 *   - Performance highlights (positive delta >30% in last 7 days)
 *   - Trend opportunities (agency_events with active trend windows)
 *
 * Scores urgency per design doc formulas (intelligent-clay-registry.ts),
 * caps at 5 items per agency, writes to agency_triage table with
 * UNIQUE(agency_id, triage_date) so same-day reruns overwrite.
 *
 * Read path: /api/triage/today or /api/triage/run for manual trigger.
 */

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import {
  TRIAGE_MAX_ITEMS,
  TRIAGE_TYPE_PRIORITY,
  TRIAGE_RETENTION_DAYS,
  type TriageItem,
} from '@/lib/clay/intelligent-clay-registry'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any

const MS_PER_DAY = 86_400_000
const MS_PER_HOUR = 3_600_000

export interface TriageRunResult {
  success: boolean
  agencies_processed: number
  items_written: number
  errors: string[]
  ran_at: string
}

/**
 * Run triage for ALL agencies. Used by the nightly cron.
 */
export async function runTriageForAllAgencies(): Promise<TriageRunResult> {
  const db: DB = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const errors: string[] = []
  let agencies = 0
  let itemsWritten = 0

  // Find all distinct agency_ids from onboarding_profiles (canonical source).
  const { data: profiles, error: profErr } = await db
    .from('onboarding_profiles')
    .select('agency_id')
    .not('agency_id', 'is', null)
  if (profErr) {
    return {
      success: false,
      agencies_processed: 0,
      items_written: 0,
      errors: [`Failed to list agencies: ${profErr.message}`],
      ran_at: new Date().toISOString(),
    }
  }

  const uniqueAgencyIds = Array.from(
    new Set(((profiles || []) as any[]).map((p) => p.agency_id).filter(Boolean)),
  ) as string[]

  for (const agencyId of uniqueAgencyIds) {
    try {
      const count = await runTriageForAgency(db, agencyId)
      itemsWritten += count
      agencies++
    } catch (e: any) {
      errors.push(`agency ${agencyId}: ${e?.message || String(e)}`)
    }
  }

  // Retention: delete triage rows older than TRIAGE_RETENTION_DAYS.
  const cutoff = new Date(Date.now() - TRIAGE_RETENTION_DAYS * MS_PER_DAY).toISOString().split('T')[0]
  try {
    await db.from('agency_triage').delete().lt('triage_date', cutoff)
  } catch (e: any) {
    errors.push(`retention cleanup failed: ${e?.message || String(e)}`)
  }

  return {
    success: errors.length === 0,
    agencies_processed: agencies,
    items_written: itemsWritten,
    errors,
    ran_at: new Date().toISOString(),
  }
}

/**
 * Run triage for a single agency. Returns count of items written.
 */
export async function runTriageForAgency(db: DB, agencyId: string): Promise<number> {
  // Get the set of user_ids that belong to this agency.
  const { data: agencyProfiles } = await db
    .from('onboarding_profiles')
    .select('user_id, business_name, selected_niche, niche_key')
    .eq('agency_id', agencyId)
  const profiles = (agencyProfiles as any[]) || []
  const userIdSet = new Set(profiles.map((p) => p.user_id).filter(Boolean))
  const nameByUserId = new Map(profiles.map((p) => [p.user_id, p.business_name || 'Unknown']))
  const nicheByUserId = new Map(profiles.map((p) => [p.user_id, p.selected_niche || p.niche_key || 'general']))

  const allItems: TriageItem[] = []

  // ── 1. Overdue briefs ─────────────────────────────────────────────────
  // A brief is "overdue" when delivery_status='delivered' AND completion_status
  // is NOT 'published' AND it's been > 24h since created_at. Best proxy until
  // we add a delivered_at column.
  const overdueCutoff = new Date(Date.now() - MS_PER_DAY).toISOString()
  if (userIdSet.size > 0) {
    const { data: overdue } = await db
      .from('content_briefs')
      .select('id, user_id, created_at, delivery_status, completion_status, brief_content, opened_at, last_nudged_at')
      .in('user_id', Array.from(userIdSet))
      .eq('delivery_status', 'delivered')
      .lt('created_at', overdueCutoff)

    for (const b of (overdue as any[]) || []) {
      if (b.completion_status === 'published') continue
      const daysOverdue = Math.max(0, (Date.now() - new Date(b.created_at).getTime()) / MS_PER_DAY - 1)
      const urgency = Math.min(10, Math.round(daysOverdue * 2))
      const title = b.brief_content?.title || b.brief_content?.campaign_name || 'Untitled brief'
      const creatorName = nameByUserId.get(b.user_id) || 'Unknown'
      const opened = b.opened_at ? ' (opened, no response)' : ' (no open signal)'

      allItems.push({
        type: 'overdue_brief',
        urgency,
        creator_id: b.user_id,
        creator_name: creatorName,
        summary: `${creatorName}'s brief "${title}" is ${Math.ceil(daysOverdue)}d overdue${opened}`,
        data: {
          brief_id: b.id,
          days_overdue: Math.ceil(daysOverdue),
          opened: !!b.opened_at,
          last_nudged_at: b.last_nudged_at,
        },
        suggested_actions: ['nudge_creator', 'update_brief_status', 'check_push_status'],
      })
    }
  }

  // ── 2. Performance highlights ────────────────────────────────────────
  // Briefs published in the last 7 days with performance_delta captured.
  // Low urgency (2) by default, boosted to 5 when delta > 30% above prediction.
  const sevenDaysAgo = new Date(Date.now() - 7 * MS_PER_DAY).toISOString()
  if (userIdSet.size > 0) {
    const { data: perf } = await db
      .from('content_briefs')
      .select('id, user_id, brief_content, predicted_vps, vps_prediction, actual_views, performance_delta, performance_measured_at')
      .in('user_id', Array.from(userIdSet))
      .not('performance_delta', 'is', null)
      .gte('performance_measured_at', sevenDaysAgo)
      .order('performance_measured_at', { ascending: false })
      .limit(20)

    for (const b of (perf as any[]) || []) {
      const prediction = b.vps_prediction || b.predicted_vps
      if (!prediction || prediction === 0) continue
      const pctDelta = (b.performance_delta / prediction) * 100
      const urgency = Math.abs(pctDelta) > 30 ? 5 : 2
      // Only surface positive surprises (>0% delta) in morning brief wins strip.
      if (b.performance_delta <= 0) continue

      const title = b.brief_content?.title || b.brief_content?.campaign_name || 'A video'
      const creatorName = nameByUserId.get(b.user_id) || 'Unknown'
      const sign = pctDelta >= 0 ? '+' : ''
      allItems.push({
        type: 'performance_highlight',
        urgency,
        creator_id: b.user_id,
        creator_name: creatorName,
        summary: `${creatorName}'s "${title}" hit ${b.actual_views?.toLocaleString() || '—'} views (${sign}${pctDelta.toFixed(0)}% vs prediction)`,
        data: {
          brief_id: b.id,
          actual_views: b.actual_views,
          prediction,
          performance_delta: b.performance_delta,
          pct_delta: pctDelta,
        },
        suggested_actions: ['generate_brief', 'analyze_creator'],
      })
    }
  }

  // ── 3. Trend opportunities ───────────────────────────────────────────
  // agency_events where trend_window_end is in the future but closing within
  // ~48h. urgency = 10 * (1 - hours_left / 48).
  const now = Date.now()
  const windowHorizon = 48 * MS_PER_HOUR
  const { data: events } = await db
    .from('agency_events')
    .select('id, event_name, category, description, trend_window_end')
    .eq('agency_id', agencyId)
    .not('trend_window_end', 'is', null)
    .gte('trend_window_end', new Date(now).toISOString())
    .lte('trend_window_end', new Date(now + windowHorizon).toISOString())

  for (const e of (events as any[]) || []) {
    const hoursLeft = Math.max(0, (new Date(e.trend_window_end).getTime() - now) / MS_PER_HOUR)
    const urgency = Math.max(1, Math.round(10 * (1 - hoursLeft / 48)))

    // Pick a creator matched by niche, if any.
    let matchedCreator: { user_id: string; name: string; niche: string } | null = null
    if (e.category) {
      for (const p of profiles) {
        const niche = (p.selected_niche || p.niche_key || '').toLowerCase()
        if (niche && (niche === e.category.toLowerCase() || niche.includes(e.category.toLowerCase()))) {
          matchedCreator = { user_id: p.user_id, name: p.business_name || 'Unknown', niche }
          break
        }
      }
    }

    const creatorName = matchedCreator?.name || (profiles[0]?.business_name || 'your roster')
    const creatorId = matchedCreator?.user_id || profiles[0]?.user_id || ''

    allItems.push({
      type: 'trend_opportunity',
      urgency,
      creator_id: creatorId,
      creator_name: creatorName,
      summary: `"${e.event_name}" trend closes in ${Math.ceil(hoursLeft)}h${matchedCreator ? ` — ${creatorName} matches` : ''}`,
      data: {
        event_id: e.id,
        event_name: e.event_name,
        category: e.category,
        hours_left: hoursLeft,
        matched_creator: matchedCreator,
      },
      suggested_actions: matchedCreator ? ['generate_brief', 'match_creators_to_event'] : ['match_creators_to_event'],
    })
  }

  // ── Sort, cap, write ─────────────────────────────────────────────────
  allItems.sort((a, b) => {
    if (b.urgency !== a.urgency) return b.urgency - a.urgency
    // Tie-break by type priority: overdue > trend > performance
    return TRIAGE_TYPE_PRIORITY[b.type] - TRIAGE_TYPE_PRIORITY[a.type]
  })
  const topItems = allItems.slice(0, TRIAGE_MAX_ITEMS)

  const today = new Date().toISOString().split('T')[0]
  const { error: upsertErr } = await db
    .from('agency_triage')
    .upsert(
      {
        agency_id: agencyId,
        triage_date: today,
        items: topItems,
        item_count: topItems.length,
        computed_at: new Date().toISOString(),
      },
      { onConflict: 'agency_id,triage_date' },
    )
  if (upsertErr) throw new Error(`upsert failed: ${upsertErr.message}`)

  return topItems.length
}

/**
 * Read today's triage for an agency. Used by /api/triage/today.
 * Falls back to most recent row if today's doesn't exist (with stale flag).
 */
export async function readTriageForAgency(
  agencyId: string,
): Promise<{ items: TriageItem[]; triage_date: string | null; stale: boolean }> {
  const db: DB = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const today = new Date().toISOString().split('T')[0]

  const { data: todayRow } = await db
    .from('agency_triage')
    .select('items, triage_date')
    .eq('agency_id', agencyId)
    .eq('triage_date', today)
    .maybeSingle()

  if (todayRow) {
    return { items: (todayRow.items as TriageItem[]) || [], triage_date: todayRow.triage_date, stale: false }
  }

  // Fall back to most recent row (per design review decision 2A: last-known-good).
  const { data: recentRow } = await db
    .from('agency_triage')
    .select('items, triage_date')
    .eq('agency_id', agencyId)
    .order('triage_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recentRow) {
    return { items: (recentRow.items as TriageItem[]) || [], triage_date: recentRow.triage_date, stale: true }
  }

  return { items: [], triage_date: null, stale: false }
}
