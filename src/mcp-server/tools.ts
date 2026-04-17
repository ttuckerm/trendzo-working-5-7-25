/**
 * Prompt 43 — MCP tool handlers.
 *
 * Each handler receives:
 *   db    — Supabase service-key client (bypasses RLS)
 *   ctx   — McpAuthContext (already-verified agency id + tier)
 *   input — Zod-parsed, validated input
 *
 * Each handler MUST scope every query to ctx.agency_id. The service
 * client has no RLS enforcement, so agency isolation is the handler's
 * responsibility. Any query that could leak cross-tenant data must be
 * filtered with .eq('agency_id', ctx.agency_id) or an equivalent.
 *
 * Handlers return a plain JS object; the MCP server wraps it in a
 * text content block (JSON.stringify) for the protocol response.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { z } from 'zod'
import type { McpAuthContext } from './auth'
import type {
  FetchClientKPIsInput,
  RunVPSPredictionInput,
  FetchTrendRadarInput,
  FetchMorningBriefInput,
  GenerateContentBriefInput,
} from './schemas'
import { resolveAgencyNiches } from '@/lib/memory/agency-niches'

// ── FetchClientKPIs ────────────────────────────────────────────────────
export async function fetchClientKPIs(
  db: SupabaseClient,
  ctx: McpAuthContext,
  input: z.infer<typeof FetchClientKPIsInput>,
) {
  const { data: creators, error } = await db
    .from('creators')
    .select(
      'id, username, display_name, total_followers, total_videos, avg_dps, platforms, updated_at',
    )
    .eq('agency_id', ctx.agency_id)
    .order('total_videos', { ascending: false, nullsFirst: false })
    .limit(input.limit)

  if (error) throw new Error(`FetchClientKPIs query failed: ${error.message}`)

  const clients = (creators || []).map((c: any) => ({
    creator_id: c.id,
    username: c.username,
    display_name: c.display_name,
    total_followers: c.total_followers ?? 0,
    total_videos: c.total_videos ?? 0,
    avg_vps: c.avg_dps != null ? Number(c.avg_dps) : null,
    platforms: c.platforms ?? null,
    last_activity: c.updated_at,
  }))

  // Aggregate summary (across the agency, not just the returned page).
  const { count: totalClients } = await db
    .from('creators')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', ctx.agency_id)

  const totalPredictions = clients.reduce((s, c) => s + (c.total_videos || 0), 0)
  const avgVps =
    clients.length > 0
      ? clients
          .filter((c) => c.avg_vps != null)
          .reduce((s, c, _, arr) => s + (c.avg_vps as number) / arr.length, 0)
      : null
  const lastActivity = clients.reduce<string | null>(
    (max, c) => (c.last_activity && (!max || c.last_activity > max) ? c.last_activity : max),
    null,
  )

  return {
    agency_id: ctx.agency_id,
    agency_name: ctx.agency_name,
    summary: {
      client_count: totalClients ?? clients.length,
      total_predictions_in_page: totalPredictions,
      avg_vps: avgVps,
      last_activity: lastActivity,
      truncated: (totalClients ?? 0) > clients.length,
    },
    clients,
  }
}

// ── RunVPSPrediction ───────────────────────────────────────────────────
export async function runVpsPrediction(
  db: SupabaseClient,
  ctx: McpAuthContext,
  input: z.infer<typeof RunVPSPredictionInput>,
) {
  // 1. Confirm creator belongs to this agency.
  const { data: creator } = await db
    .from('creators')
    .select('id, username, display_name, agency_id')
    .eq('id', input.creator_id)
    .maybeSingle()

  if (!creator) {
    throw new Error(`Creator ${input.creator_id} not found`)
  }
  if (creator.agency_id !== ctx.agency_id) {
    // Don't leak existence of other-agency creators. Same error as not-found.
    throw new Error(`Creator ${input.creator_id} not found`)
  }

  // 2. Fetch videos by this creator. creators.id (uuid) vs videos.creator_id
  // (varchar) type mismatch — we match by creator.username which is the
  // canonical string key videos.creator_id uses (TikTok username).
  const { data: videos } = await db
    .from('videos')
    .select('id, tiktok_id, caption, view_count, upload_timestamp')
    .eq('creator_id', creator.username || '__never__')
    .order('upload_timestamp', { ascending: false, nullsFirst: false })
    .limit(input.limit)

  const videoIds = (videos || []).map((v: any) => v.tiktok_id).filter(Boolean)
  const videoUuids = (videos || []).map((v: any) => v.id).filter(Boolean)

  if (videoIds.length === 0 && videoUuids.length === 0) {
    return {
      agency_id: ctx.agency_id,
      creator_id: creator.id,
      creator_username: creator.username,
      runs: [],
      note: 'No videos found for this creator. Upload a video or scrape one before requesting predictions.',
    }
  }

  // prediction_runs.video_id is TEXT — try both the tiktok_id and the
  // uuid as strings, whichever matches.
  const { data: runs } = await db
    .from('prediction_runs')
    .select(
      'id, video_id, predicted_dps_7d, predicted_tier_7d, confidence, created_at, components_used, latency_ms_total, status',
    )
    .in('video_id', [...videoIds, ...videoUuids.map(String)])
    .order('created_at', { ascending: false })
    .limit(input.limit)

  const cleanRuns = (runs || []).map((r: any) => ({
    run_id: r.id,
    video_id: r.video_id,
    predicted_vps: r.predicted_dps_7d != null ? Number(r.predicted_dps_7d) : null,
    predicted_tier: r.predicted_tier_7d,
    confidence: r.confidence != null ? Number(r.confidence) : null,
    components_used: r.components_used,
    latency_ms_total: r.latency_ms_total,
    status: r.status,
    created_at: r.created_at,
  }))

  return {
    agency_id: ctx.agency_id,
    creator_id: creator.id,
    creator_username: creator.username,
    runs: cleanRuns,
    note:
      cleanRuns.length === 0
        ? 'Creator has videos but no prediction runs yet. Trigger via admin dashboard.'
        : undefined,
  }
}

// ── FetchTrendRadar ────────────────────────────────────────────────────
export async function fetchTrendRadar(
  db: SupabaseClient,
  ctx: McpAuthContext,
  input: z.infer<typeof FetchTrendRadarInput>,
) {
  // Agency niche resolution. If resolution is empty (profiles have no
  // niche_key set), we return an empty result set rather than dumping
  // all cultural_events — fail safe on scoping.
  const resolution = await resolveAgencyNiches(db, ctx.agency_id)
  const allNiches = Array.from(
    new Set([...resolution.niches, ...resolution.unknown_niches]),
  )

  if (allNiches.length === 0) {
    return {
      agency_id: ctx.agency_id,
      niches_considered: [],
      events: [],
      note: 'Agency has no niches set on its onboarding profiles. Cultural events are niche-scoped.',
    }
  }

  // cultural_events.niche uses raw niche keys (e.g. "fitness"), not
  // canonical ids. Query against raw keys from profile data. Also
  // check activated_niches which is an ARRAY of niches.
  const { data: byNiche, error: e1 } = await db
    .from('cultural_events')
    .select(
      'id, niche, event_title, event_summary, velocity_score, confidence, activated_niches, keywords, status, created_at, expires_at',
    )
    .in('niche', allNiches)
    .order('velocity_score', { ascending: false })
    .limit(input.limit * 2)

  if (e1) throw new Error(`FetchTrendRadar query failed: ${e1.message}`)

  let events = byNiche || []

  // Optionally exclude stale (velocity_score=0).
  if (!input.include_stale) {
    events = events.filter((e: any) => Number(e.velocity_score) > 0)
  }

  events = events.slice(0, input.limit)

  const shaped = events.map((e: any) => ({
    id: String(e.id),
    niche: e.niche,
    title: e.event_title,
    summary: e.event_summary,
    velocity_score: Number(e.velocity_score),
    confidence: Number(e.confidence),
    activated_niches: e.activated_niches,
    keywords: e.keywords,
    status: e.status,
    expires_at: e.expires_at,
    stale: Number(e.velocity_score) === 0,
  }))

  return {
    agency_id: ctx.agency_id,
    niches_considered: allNiches,
    events: shaped,
    note:
      shaped.length === 0
        ? input.include_stale
          ? 'No cultural events for these niches.'
          : 'No non-stale cultural events for these niches. Try include_stale=true.'
        : undefined,
  }
}

// ── FetchMorningBrief ──────────────────────────────────────────────────
export async function fetchMorningBrief(
  db: SupabaseClient,
  ctx: McpAuthContext,
  input: z.infer<typeof FetchMorningBriefInput>,
) {
  let query = db
    .from('morning_briefs')
    .select('id, brief_date, cards, card_count, status, created_at')
    .eq('agency_id', ctx.agency_id)
    .order('brief_date', { ascending: false })
    .limit(1)

  if (input.date) {
    query = query.eq('brief_date', input.date)
  }

  const { data, error } = await query
  if (error) throw new Error(`FetchMorningBrief query failed: ${error.message}`)

  const row = (data || [])[0] as any
  if (!row) {
    return {
      agency_id: ctx.agency_id,
      brief: null,
      note:
        'No morning brief found. Morning briefs are generated overnight by the autodream cron job. ' +
        'If this agency is brand new, wait until tomorrow.',
    }
  }

  return {
    agency_id: ctx.agency_id,
    brief: {
      id: row.id,
      brief_date: row.brief_date,
      card_count: row.card_count,
      status: row.status,
      created_at: row.created_at,
      cards: row.cards,
    },
  }
}

// ── GenerateContentBrief ───────────────────────────────────────────────
export async function generateContentBrief(
  db: SupabaseClient,
  ctx: McpAuthContext,
  input: z.infer<typeof GenerateContentBriefInput>,
) {
  let query = db
    .from('pre_generated_briefs')
    .select(
      'id, agency_id, client_id, cultural_event_id, brief_content, vps_score, confidence, priority_type, status, generated_at, niche, final_critic_score',
    )
    .eq('agency_id', ctx.agency_id)
    .order('generated_at', { ascending: false })
    .limit(input.limit)

  if (input.client_id) {
    query = query.eq('client_id', input.client_id)
  }

  const { data, error } = await query
  if (error) throw new Error(`GenerateContentBrief query failed: ${error.message}`)

  const briefs = (data || []).map((b: any) => ({
    brief_id: b.id,
    client_id: b.client_id,
    cultural_event_id: b.cultural_event_id != null ? String(b.cultural_event_id) : null,
    niche: b.niche,
    priority_type: b.priority_type,
    vps_score: b.vps_score != null ? Number(b.vps_score) : null,
    confidence: b.confidence != null ? Number(b.confidence) : null,
    critic_score: b.final_critic_score,
    status: b.status,
    generated_at: b.generated_at,
    brief_content: b.brief_content,
  }))

  return {
    agency_id: ctx.agency_id,
    briefs,
    note:
      briefs.length === 0
        ? 'No pre-generated briefs found. Briefs are generated overnight by the nightly pipeline. ' +
          'Live generation is intentionally not triggered through MCP.'
        : undefined,
  }
}

// ── Tool dispatch map ──────────────────────────────────────────────────
export const TOOL_HANDLERS = {
  FetchClientKPIs: fetchClientKPIs,
  RunVPSPrediction: runVpsPrediction,
  FetchTrendRadar: fetchTrendRadar,
  FetchMorningBrief: fetchMorningBrief,
  GenerateContentBrief: generateContentBrief,
} as const
