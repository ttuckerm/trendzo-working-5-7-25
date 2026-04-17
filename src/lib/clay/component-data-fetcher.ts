import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { ComponentType } from './component-registry'
import type { MorningBriefData } from '@/components/clay/MorningBriefCard'
import type { ContentBriefData } from '@/components/clay/ContentBriefCard'
import type { CreatorProfileData } from '@/components/clay/CreatorProfileCard'
import type { KPISummaryData } from '@/components/clay/KPISummaryCard'
import type { TrendCardData } from '@/components/clay/TrendCard'
import type { PerformanceTimelineData } from '@/components/clay/PerformanceTimelineCard'
import type { MomentumDecayData } from '@/components/clay/MomentumDecayCard'
import type { TrainerResultData } from '@/components/clay/TrainerResultCard'
import type { ProactiveAlertData } from '@/components/clay/ProactiveAlertCard'
import type { NetworkInsightData } from '@/components/clay/NetworkInsightCard'
import type { MemoryFactData } from '@/components/clay/MemoryFactCard'
import type { CalendarSnippetData } from '@/components/clay/CalendarSnippetCard'
import type { AgencyScorecardData } from '@/components/clay/AgencyScorecardCard'
import type { VariantComparisonData } from '@/components/clay/VariantComparisonCard'

function getServiceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

interface FetchContext {
  agencyId?: string
  creatorId?: string
  date?: string
  briefId?: string
}

/**
 * Fetch shaped data for a given Clay component type.
 * Server-side only — uses service client to bypass RLS.
 */
export async function fetchComponentData(
  type: ComponentType,
  context: FetchContext,
): Promise<Record<string, unknown> | null> {
  switch (type) {
    case ComponentType.MORNING_BRIEF:
      return fetchMorningBrief(context) as Promise<Record<string, unknown> | null>
    case ComponentType.CONTENT_BRIEF:
      return fetchContentBrief(context) as Promise<Record<string, unknown> | null>
    case ComponentType.CREATOR_PROFILE:
      return fetchCreatorProfile(context) as Promise<Record<string, unknown> | null>
    case ComponentType.KPI_SUMMARY:
      return fetchKPISummary(context) as Promise<Record<string, unknown> | null>
    case ComponentType.TREND_CARD:
      return fetchTrendCard(context) as Promise<Record<string, unknown> | null>
    case ComponentType.PERFORMANCE_TIMELINE:
      return fetchPerformanceTimeline(context) as Promise<Record<string, unknown> | null>
    case ComponentType.MOMENTUM_DECAY:
      return fetchMomentumDecay(context) as Promise<Record<string, unknown> | null>
    case ComponentType.TRAINER_RESULT:
      return fetchTrainerResult(context) as Promise<Record<string, unknown> | null>
    case ComponentType.PROACTIVE_ALERT:
      return fetchProactiveAlert(context) as Promise<Record<string, unknown> | null>
    case ComponentType.NETWORK_INSIGHT:
      return fetchNetworkInsight(context) as Promise<Record<string, unknown> | null>
    case ComponentType.MEMORY_FACT:
      return fetchMemoryFact(context) as Promise<Record<string, unknown> | null>
    case ComponentType.CALENDAR_SNIPPET:
      return fetchCalendarSnippet(context) as Promise<Record<string, unknown> | null>
    case ComponentType.AGENCY_SCORECARD:
      return fetchAgencyScorecard(context) as Promise<Record<string, unknown> | null>
    case ComponentType.ACTION_CONFIRMATION:
      // Rendered reactively after action taken — no DB query
      return null
    case ComponentType.VARIANT_COMPARISON:
      return fetchVariantComparison(context) as Promise<Record<string, unknown> | null>
    default:
      return null
  }
}

async function fetchMorningBrief(ctx: FetchContext): Promise<MorningBriefData | null> {
  const db = getServiceClient()
  const today = ctx.date || new Date().toISOString().split('T')[0]

  // Try morning_briefs table first
  const { data: brief } = await db
    .from('morning_briefs')
    .select('*')
    .eq('agency_id', ctx.agencyId || '')
    .eq('brief_date', today)
    .single()

  if (brief && brief.cards && Array.isArray(brief.cards) && brief.cards.length > 0) {
    const topCard = brief.cards[0]
    return {
      date: today,
      agentName: brief.generated_by_agent || 'Brief Architect',
      detectedAt: new Date(brief.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
      variant: mapPriorityToVariant(topCard.priority_type),
      headline: topCard.brief_summary?.split('.')[0] || 'Your morning update is ready',
      summary: topCard.brief_summary || 'No summary available.',
      creatorsAffected: brief.cards.map((c: { client_name?: string }) => c.client_name).filter(Boolean).slice(0, 4),
      vpsScore: topCard.vps_score || 0,
      actions: [
        { label: 'Review briefs', actionId: 'review_briefs', variant: 'view' as const },
        { label: 'Dismiss', actionId: 'dismiss_brief', variant: 'dismiss' as const },
      ],
    }
  }

  // Fallback: build from pre_generated_briefs
  const { data: preBriefs } = await db
    .from('pre_generated_briefs')
    .select('id, client_id, brief_content, vps_score, priority_type, status, niche')
    .eq('agency_id', ctx.agencyId || '')
    .in('status', ['draft', 'presented'])
    .order('vps_score', { ascending: false })
    .limit(1)

  if (preBriefs && preBriefs.length > 0) {
    const top = preBriefs[0]
    const content = top.brief_content || {}
    return {
      date: today,
      agentName: 'Brief Architect',
      detectedAt: 'overnight',
      variant: mapPriorityToVariant(top.priority_type),
      headline: content.title || 'New brief generated overnight',
      summary: content.hook || content.angle || 'A new content brief is ready for your review.',
      creatorsAffected: [top.niche || 'Unknown'].filter(Boolean),
      vpsScore: top.vps_score || 0,
      actions: [
        { label: 'Approve', actionId: 'approve_brief', variant: 'approve' as const },
        { label: 'Review', actionId: 'review_briefs', variant: 'view' as const },
        { label: 'Dismiss', actionId: 'dismiss_brief', variant: 'dismiss' as const },
      ],
    }
  }

  // No data at all — return a clean empty state
  return {
    date: today,
    agentName: 'Brief Architect',
    detectedAt: 'just now',
    variant: 'opportunity' as const,
    headline: 'No alerts this morning',
    summary: 'Everything is running smoothly. No urgent briefs or decay warnings.',
    creatorsAffected: [],
    vpsScore: 0,
    actions: [
      { label: 'Generate briefs', actionId: 'generate_briefs', variant: 'view' as const },
    ],
  }
}

async function fetchContentBrief(ctx: FetchContext): Promise<ContentBriefData | null> {
  const db = getServiceClient()

  const { data: briefs } = await db
    .from('pre_generated_briefs')
    .select('id, client_id, brief_content, vps_score, priority_type, status, niche, final_critic_score')
    .eq('agency_id', ctx.agencyId || '')
    .in('status', ['draft', 'presented'])
    .order('vps_score', { ascending: false })
    .limit(1)

  if (!briefs || briefs.length === 0) return null

  const brief = briefs[0]
  const content = brief.brief_content || {}

  // Get creator name
  const { data: profile } = await db
    .from('onboarding_profiles')
    .select('business_name')
    .eq('user_id', brief.client_id)
    .single()

  // Get variant count
  const { count } = await db
    .from('brief_variants')
    .select('id', { count: 'exact', head: true })
    .eq('brief_id', brief.id)

  return {
    briefId: String(brief.id),
    creatorName: profile?.business_name || 'Unknown Creator',
    niche: brief.niche || 'general',
    title: content.title || 'Untitled Brief',
    hook: content.hook || '',
    format: content.format || 'Short-form',
    vpsScore: brief.vps_score || 0,
    criticScore: brief.final_critic_score || undefined,
    battleTested: (brief.vps_score || 0) >= 80 && brief.final_critic_score != null,
    variantCount: count || 0,
    agentAttribution: `VPS ${Math.round(brief.vps_score || 0)}`,
    status: brief.status === 'draft' || brief.status === 'presented' ? 'pending' : brief.status,
  }
}

async function fetchCreatorProfile(ctx: FetchContext): Promise<CreatorProfileData | null> {
  const db = getServiceClient()

  // Build query — if creatorId given, use it; otherwise get first creator in agency
  let profileQuery = db
    .from('onboarding_profiles')
    .select('id, user_id, business_name, tiktok_handle, selected_niche, niche_key, follower_count, actual_follower_count, creator_stage')

  if (ctx.creatorId) {
    profileQuery = profileQuery.eq('user_id', ctx.creatorId)
  } else if (ctx.agencyId) {
    // Get agency member IDs first
    const { data: members } = await db
      .from('agency_members')
      .select('user_id')
      .eq('agency_id', ctx.agencyId)
      .eq('is_active', true)
      .limit(1)

    if (!members || members.length === 0) return null
    profileQuery = profileQuery.eq('user_id', members[0].user_id)
  } else {
    return null
  }

  const { data: profile } = await profileQuery.single()
  if (!profile) return null

  // Get VPS scores from scripts
  const { data: scripts } = await db
    .from('generated_scripts')
    .select('vps_score, created_at')
    .eq('onboarding_profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const vpsScores = (scripts || []).map((s: { vps_score: number }) => s.vps_score).filter((v: number) => v > 0)
  const avgVPS = vpsScores.length > 0
    ? Math.round(vpsScores.reduce((a: number, b: number) => a + b, 0) / vpsScores.length)
    : 0
  const recentScore = vpsScores[0] || 0

  // Determine trend from recent 2 scores
  let trend: 'up' | 'down' | 'flat' = 'flat'
  if (vpsScores.length >= 2) {
    if (vpsScores[0] > vpsScores[1] + 2) trend = 'up'
    else if (vpsScores[0] < vpsScores[1] - 2) trend = 'down'
  }

  // Get briefs this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { count: briefCount } = await db
    .from('content_briefs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.user_id)
    .gte('created_at', weekAgo.toISOString())

  // Get memory facts (hot tier)
  let memoryFacts: string[] = []
  try {
    const { data: memories } = await db
      .from('memory_extractions')
      .select('fact')
      .eq('agency_id', ctx.agencyId || '')
      .eq('tier', 'hot')
      .order('updated_at', { ascending: false })
      .limit(2)

    memoryFacts = (memories || []).map((m: { fact: string }) => m.fact)
  } catch {
    // Table may not exist yet
  }

  // Get agency name
  let agencyName = ''
  if (ctx.agencyId) {
    try {
      const { data: agency } = await db
        .from('agencies')
        .select('name')
        .eq('id', ctx.agencyId)
        .single()
      agencyName = agency?.name || ''
    } catch {
      // Table may not exist
    }
  }

  return {
    creatorId: profile.user_id,
    name: profile.business_name || 'Unknown',
    handle: profile.tiktok_handle || `@${(profile.business_name || 'unknown').toLowerCase().replace(/\s/g, '')}`,
    niche: profile.selected_niche || profile.niche_key || 'general',
    followerCount: profile.follower_count || profile.actual_follower_count || 0,
    avgVPS,
    trend,
    topFormats: ['Short-form', 'Educational', 'Story-driven'].slice(0, 3), // Placeholder until format tracking exists
    recentScore,
    briefsThisWeek: briefCount || 0,
    agencyName,
    memoryFacts,
  }
}

async function fetchKPISummary(ctx: FetchContext): Promise<KPISummaryData | null> {
  const db = getServiceClient()

  if (!ctx.agencyId) return null

  // Get member IDs
  const { data: members } = await db
    .from('agency_members')
    .select('user_id')
    .eq('agency_id', ctx.agencyId)
    .eq('is_active', true)

  const memberIds = (members || []).map((m: { user_id: string }) => m.user_id)
  if (memberIds.length === 0) {
    return {
      agencyName: '',
      period: 'Last 7 days',
      metrics: [
        { label: 'Creators', value: '0', change: 0 },
        { label: 'Avg VPS', value: '--', change: 0 },
        { label: 'Briefs', value: '0', change: 0 },
      ],
    }
  }

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  // Get scripts for VPS (this week vs last week)
  const { data: recentScripts } = await db
    .from('generated_scripts')
    .select('vps_score, created_at')
    .in('user_id', memberIds)
    .gte('created_at', weekAgo.toISOString())

  const { data: priorScripts } = await db
    .from('generated_scripts')
    .select('vps_score')
    .in('user_id', memberIds)
    .gte('created_at', twoWeeksAgo.toISOString())
    .lt('created_at', weekAgo.toISOString())

  const recentVPS = (recentScripts || []).filter((s: { vps_score: number }) => s.vps_score > 0)
  const priorVPS = (priorScripts || []).filter((s: { vps_score: number }) => s.vps_score > 0)

  const avgVPSCurrent = recentVPS.length > 0
    ? Math.round(recentVPS.reduce((sum: number, s: { vps_score: number }) => sum + s.vps_score, 0) / recentVPS.length)
    : 0
  const avgVPSPrior = priorVPS.length > 0
    ? Math.round(priorVPS.reduce((sum: number, s: { vps_score: number }) => sum + s.vps_score, 0) / priorVPS.length)
    : 0
  const vpsChange = avgVPSPrior > 0 ? Math.round(((avgVPSCurrent - avgVPSPrior) / avgVPSPrior) * 100) : 0

  // Briefs count
  const { count: briefsThisWeek } = await db
    .from('content_briefs')
    .select('id', { count: 'exact', head: true })
    .in('user_id', memberIds)
    .gte('created_at', weekAgo.toISOString())

  const { count: briefsLastWeek } = await db
    .from('content_briefs')
    .select('id', { count: 'exact', head: true })
    .in('user_id', memberIds)
    .gte('created_at', twoWeeksAgo.toISOString())
    .lt('created_at', weekAgo.toISOString())

  const briefChange = (briefsLastWeek || 0) > 0
    ? Math.round((((briefsThisWeek || 0) - (briefsLastWeek || 0)) / (briefsLastWeek || 1)) * 100)
    : 0

  // Prediction runs count
  const { count: predictionsThisWeek } = await db
    .from('prediction_runs')
    .select('id', { count: 'exact', head: true })
    .in('creator_id', memberIds)
    .gte('created_at', weekAgo.toISOString())

  // Agency name
  let agencyName = ''
  try {
    const { data: agency } = await db
      .from('agencies')
      .select('name')
      .eq('id', ctx.agencyId)
      .single()
    agencyName = agency?.name || ''
  } catch {
    // Fine
  }

  return {
    agencyName,
    period: 'Last 7 days',
    metrics: [
      { label: 'Creators', value: String(memberIds.length), change: 0 },
      { label: 'Avg VPS', value: avgVPSCurrent > 0 ? String(avgVPSCurrent) : '--', change: vpsChange },
      { label: 'Briefs', value: String(briefsThisWeek || 0), change: briefChange },
      { label: 'Predictions', value: String(predictionsThisWeek || 0), change: 0 },
      { label: 'Scripts', value: String(recentVPS.length), change: 0 },
    ],
  }
}

async function fetchTrendCard(ctx: FetchContext): Promise<TrendCardData | null> {
  const db = getServiceClient()

  if (!ctx.agencyId) return null

  // Get agency niches
  const { data: profiles } = await db
    .from('onboarding_profiles')
    .select('selected_niche, niche_key')
    .in('user_id', (
      await db.from('agency_members').select('user_id').eq('agency_id', ctx.agencyId).eq('is_active', true)
    ).data?.map((m: { user_id: string }) => m.user_id) || [''])

  const niches = [...new Set((profiles || []).map((p: { selected_niche?: string; niche_key?: string }) => p.selected_niche || p.niche_key).filter(Boolean))]

  // Try cultural_events first
  let event: Record<string, unknown> | null = null
  try {
    const { data } = await db
      .from('cultural_events')
      .select('*')
      .eq('agency_id', ctx.agencyId)
      .order('created_at', { ascending: false })
      .limit(1)
    if (data && data.length > 0) event = data[0]
  } catch {
    // Table may not exist
  }

  // Try agency_events as fallback
  if (!event) {
    try {
      const { data } = await db
        .from('agency_events')
        .select('*')
        .eq('agency_id', ctx.agencyId)
        .order('created_at', { ascending: false })
        .limit(1)
      if (data && data.length > 0) event = data[0]
    } catch {
      // Table may not exist
    }
  }

  if (!event) return null

  const eventDate = new Date(event.event_date as string)
  const now = new Date()
  const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Check if brief already generated for this event
  let briefGenerated = false
  try {
    const { count } = await db
      .from('pre_generated_briefs')
      .select('id', { count: 'exact', head: true })
      .eq('cultural_event_id', event.id)
    briefGenerated = (count || 0) > 0
  } catch {
    // Fine
  }

  return {
    eventId: String(event.id),
    trendName: (event.event_name as string) || 'Unnamed Trend',
    niche: niches[0] || 'general',
    detectedAt: new Date(event.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    velocity: daysUntil <= 2 ? 'peak' : daysUntil <= 7 ? 'rising' : 'fading',
    confidenceScore: (event.relevance_score as number) || 75,
    sourceSummary: (event.description as string) || `Upcoming ${event.category || 'cultural'} event in ${daysUntil} days`,
    affectedFormats: ['Short-form', 'Story-driven', 'Educational'].slice(0, 2),
    briefGenerated,
  }
}

async function fetchPerformanceTimeline(ctx: FetchContext): Promise<PerformanceTimelineData | null> {
  const db = getServiceClient()

  // Find the target creator
  let creatorUserId: string | null = ctx.creatorId || null
  let creatorName = 'Unknown'

  if (!creatorUserId && ctx.agencyId) {
    const { data: members } = await db
      .from('agency_members')
      .select('user_id')
      .eq('agency_id', ctx.agencyId)
      .eq('is_active', true)
      .limit(1)
    if (members && members.length > 0) creatorUserId = members[0].user_id
  }

  if (!creatorUserId) return null

  // Get creator name
  const { data: profile } = await db
    .from('onboarding_profiles')
    .select('business_name')
    .eq('user_id', creatorUserId)
    .single()
  creatorName = profile?.business_name || 'Unknown'

  // Get scripts with VPS scores (last 14 days)
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const { data: scripts } = await db
    .from('generated_scripts')
    .select('vps_score, created_at')
    .eq('user_id', creatorUserId)
    .gte('created_at', twoWeeksAgo.toISOString())
    .order('created_at', { ascending: true })

  const dataPoints = (scripts || [])
    .filter((s: { vps_score: number }) => s.vps_score > 0)
    .map((s: { vps_score: number; created_at: string }) => ({
      date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      vpsScore: s.vps_score,
    }))

  if (dataPoints.length === 0) return null

  const scores = dataPoints.map((dp: { vpsScore: number }) => dp.vpsScore)
  const peakScore = Math.max(...scores)
  const avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)

  // Determine trend from first half vs second half
  const mid = Math.floor(scores.length / 2)
  const firstHalf = scores.slice(0, mid || 1)
  const secondHalf = scores.slice(mid || 1)
  const firstAvg = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length

  let trend: 'improving' | 'declining' | 'stable' = 'stable'
  if (secondAvg > firstAvg + 3) trend = 'improving'
  else if (secondAvg < firstAvg - 3) trend = 'declining'

  return {
    creatorName,
    period: 'Last 14 days',
    dataPoints,
    trend,
    peakScore,
    avgScore,
  }
}

async function fetchMomentumDecay(ctx: FetchContext): Promise<MomentumDecayData | null> {
  const db = getServiceClient()

  if (!ctx.agencyId) return null

  // Get all agency members
  const { data: members } = await db
    .from('agency_members')
    .select('user_id')
    .eq('agency_id', ctx.agencyId)
    .eq('is_active', true)

  if (!members || members.length === 0) return null

  const memberIds = members.map((m: { user_id: string }) => m.user_id)

  // Find creator with the oldest last prediction run
  const { data: latestRuns } = await db
    .from('prediction_runs')
    .select('creator_id, created_at')
    .in('creator_id', memberIds)
    .order('created_at', { ascending: false })

  if (!latestRuns || latestRuns.length === 0) return null

  // Group by creator, find the one with the oldest most-recent run
  const lastRunByCreator = new Map<string, string>()
  for (const run of latestRuns) {
    if (!lastRunByCreator.has(run.creator_id)) {
      lastRunByCreator.set(run.creator_id, run.created_at)
    }
  }

  let oldestCreatorId = ''
  let oldestDate = new Date()
  for (const [creatorId, dateStr] of lastRunByCreator) {
    const d = new Date(dateStr)
    if (d < oldestDate) {
      oldestDate = d
      oldestCreatorId = creatorId
    }
  }

  if (!oldestCreatorId) return null

  const daysSince = Math.floor((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))

  // Only show if at least 3 days since last activity
  if (daysSince < 3) return null

  // Get creator name
  const { data: profile } = await db
    .from('onboarding_profiles')
    .select('business_name')
    .eq('user_id', oldestCreatorId)
    .single()

  const projectedDecay = Math.min(daysSince * 8, 100) // rough model: 8% per day
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  if (daysSince >= 14) urgencyLevel = 'critical'
  else if (daysSince >= 7) urgencyLevel = 'high'
  else if (daysSince >= 5) urgencyLevel = 'medium'

  return {
    creatorName: profile?.business_name || 'Unknown',
    creatorId: oldestCreatorId,
    lastPostDate: oldestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    daysSincePost: daysSince,
    projectedDecayPct: projectedDecay,
    urgencyLevel,
    recommendedAction: daysSince >= 7
      ? 'Generate a recovery brief with trending hooks to restart momentum.'
      : 'Schedule a brief to maintain posting consistency.',
    estimatedRecoveryDays: Math.ceil(daysSince * 0.7),
  }
}

async function fetchTrainerResult(ctx: FetchContext): Promise<TrainerResultData | null> {
  const db = getServiceClient()

  // Get latest experiment that's pending or recently completed
  let experiment: Record<string, unknown> | null = null
  try {
    const { data } = await db
      .from('training_experiments')
      .select('*')
      .in('result', ['pending_promotion', 'improved'])
      .order('created_at', { ascending: false })
      .limit(1)
    if (data && data.length > 0) experiment = data[0]
  } catch {
    return null
  }

  if (!experiment) return null

  // Get baseline from active model variant
  let baselineScore = 0
  try {
    const niche = experiment.niche_scope as string | null
    let q = db.from('model_variants').select('spearman_score').eq('is_active', true)
    if (niche) q = q.eq('niche', niche)
    else q = q.is('niche', null)
    const { data: variant } = await q.single()
    baselineScore = variant?.spearman_score || 0
  } catch {
    // Use baseline_spearman from experiment
    baselineScore = (experiment.baseline_spearman as number) || 0
  }

  const newScore = (experiment.validation_spearman as number) || 0
  const features = (experiment.features_used as string[]) || []

  return {
    experimentId: String(experiment.id),
    niche: (experiment.niche_scope as string) || 'global',
    previousScore: baselineScore,
    newScore,
    improvement: (experiment.delta as number) || (newScore - baselineScore),
    featuresAdded: features.slice(0, 6),
    samplesUsed: (experiment.training_data_rows as number) || 0,
    status: experiment.result === 'pending_promotion' ? 'pending-approval' : 'approved',
    isChairmanOnly: (experiment as Record<string, unknown>).created_by === 'chairman',
  }
}

async function fetchProactiveAlert(ctx: FetchContext): Promise<ProactiveAlertData | null> {
  const db = getServiceClient()

  try {
    const { data: alert } = await db
      .from('chairman_alerts')
      .select('*')
      .eq('status', 'active')
      .order('severity', { ascending: false })
      .limit(1)
      .single()

    if (!alert) return null

    const severityMap: Record<string, 'info' | 'warning' | 'critical'> = {
      critical: 'critical',
      high: 'critical',
      warning: 'warning',
      medium: 'warning',
      low: 'info',
      info: 'info',
    }

    return {
      alertId: String(alert.id),
      severity: severityMap[alert.severity] || 'info',
      title: alert.title || 'Platform Alert',
      body: alert.message || alert.body || '',
      affectedEntity: alert.affected_entity || alert.entity_name || 'System',
      detectedAt: new Date(alert.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
      actions: alert.actions || [
        { label: 'Acknowledge', actionId: 'acknowledge_alert' },
        { label: 'Dismiss', actionId: 'dismiss_alert' },
      ],
    }
  } catch {
    return null
  }
}

async function fetchNetworkInsight(ctx: FetchContext): Promise<NetworkInsightData | null> {
  const db = getServiceClient()

  try {
    const { data: insight } = await db
      .from('network_insights')
      .select('*')
      .order('confidence_score', { ascending: false })
      .limit(1)
      .single()

    if (!insight) return null

    return {
      insightId: String(insight.id),
      pattern: insight.pattern || insight.title || '',
      niche: insight.niche || 'general',
      agencyCount: insight.agency_count || 0,
      confidenceScore: insight.confidence_score || 0,
      anonymized: insight.anonymized ?? true,
      enterpriseOnly: insight.enterprise_only ?? false,
      recommendation: insight.recommendation || '',
    }
  } catch {
    return null
  }
}

async function fetchMemoryFact(ctx: FetchContext): Promise<MemoryFactData | null> {
  const db = getServiceClient()

  if (!ctx.agencyId) return null

  try {
    const { data: memories } = await db
      .from('memory_extractions')
      .select('fact, tier, entity_name, entity_type, created_at, source_type')
      .eq('agency_id', ctx.agencyId)
      .eq('tier', 'hot')
      .order('created_at', { ascending: false })
      .limit(3)

    if (!memories || memories.length === 0) return null

    const first = memories[0]
    return {
      tier: 'hot',
      facts: memories.map((m: { fact: string; created_at: string; source_type?: string }) => ({
        content: m.fact,
        extractedAt: new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sourceType: m.source_type || 'conversation',
      })),
      entityName: first.entity_name || 'Agency',
      entityType: first.entity_type || 'agency',
    }
  } catch {
    return null
  }
}

async function fetchCalendarSnippet(ctx: FetchContext): Promise<CalendarSnippetData | null> {
  const db = getServiceClient()

  if (!ctx.agencyId) return null

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  try {
    const { data: actions } = await db
      .from('scheduled_actions')
      .select('scheduled_for, label, type')
      .eq('agency_id', ctx.agencyId)
      .gte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(5)

    // Count upcoming briefs
    const { count: briefCount } = await db
      .from('pre_generated_briefs')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', ctx.agencyId)
      .in('status', ['draft', 'presented'])

    // Count pending approvals
    const { count: approvalCount } = await db
      .from('pre_generated_briefs')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', ctx.agencyId)
      .eq('status', 'presented')

    return {
      date: today,
      dayOfWeek: dayNames[now.getDay()],
      scheduledActions: (actions || []).map((a: { scheduled_for: string; label: string; type: string }) => ({
        time: new Date(a.scheduled_for).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase(),
        label: a.label,
        type: a.type,
      })),
      upcomingBriefs: briefCount || 0,
      pendingApprovals: approvalCount || 0,
    }
  } catch {
    // Return a minimal card even if scheduled_actions table doesn't exist
    return {
      date: today,
      dayOfWeek: dayNames[now.getDay()],
      scheduledActions: [],
      upcomingBriefs: 0,
      pendingApprovals: 0,
    }
  }
}

async function fetchAgencyScorecard(ctx: FetchContext): Promise<AgencyScorecardData | null> {
  const db = getServiceClient()

  if (!ctx.agencyId) return null

  try {
    // Get agency info
    const { data: agency } = await db
      .from('agencies')
      .select('name, tier')
      .eq('id', ctx.agencyId)
      .single()

    if (!agency) return null

    // Get members
    const { data: members } = await db
      .from('agency_members')
      .select('user_id')
      .eq('agency_id', ctx.agencyId)
      .eq('is_active', true)

    const memberIds = (members || []).map((m: { user_id: string }) => m.user_id)
    if (memberIds.length === 0) return null

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    // VPS scores this week
    const { data: recentScripts } = await db
      .from('generated_scripts')
      .select('vps_score')
      .in('user_id', memberIds)
      .gte('created_at', weekAgo.toISOString())

    const vpsScores = (recentScripts || []).filter((s: { vps_score: number }) => s.vps_score > 0).map((s: { vps_score: number }) => s.vps_score)
    const avgVPS = vpsScores.length > 0 ? Math.round(vpsScores.reduce((a: number, b: number) => a + b, 0) / vpsScores.length) : 0

    // Prior week VPS for trend
    const { data: priorScripts } = await db
      .from('generated_scripts')
      .select('vps_score')
      .in('user_id', memberIds)
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', weekAgo.toISOString())

    const priorVPS = (priorScripts || []).filter((s: { vps_score: number }) => s.vps_score > 0).map((s: { vps_score: number }) => s.vps_score)
    const priorAvg = priorVPS.length > 0 ? Math.round(priorVPS.reduce((a: number, b: number) => a + b, 0) / priorVPS.length) : 0

    let trend: 'improving' | 'declining' | 'stable' = 'stable'
    if (priorAvg > 0 && avgVPS > priorAvg + 3) trend = 'improving'
    else if (priorAvg > 0 && avgVPS < priorAvg - 3) trend = 'declining'

    // Brief counts
    const { count: briefCount } = await db
      .from('pre_generated_briefs')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', ctx.agencyId)
      .gte('created_at', weekAgo.toISOString())

    // Prediction runs
    const { count: predCount } = await db
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .in('creator_id', memberIds)
      .gte('created_at', weekAgo.toISOString())

    // Build scores
    const vpsMax = 100
    const briefsMax = Math.max(memberIds.length * 5, 10)
    const predsMax = Math.max(memberIds.length * 10, 20)

    const scores = [
      { label: 'Avg VPS', score: avgVPS, maxScore: vpsMax, color: '#00d4ff' },
      { label: 'Briefs Created', score: briefCount || 0, maxScore: briefsMax, color: '#2dd4a8' },
      { label: 'Predictions Run', score: predCount || 0, maxScore: predsMax, color: '#7b2ff7' },
      { label: 'Active Creators', score: memberIds.length, maxScore: Math.max(memberIds.length, 10), color: '#f4b942' },
    ]

    // Grade
    const normalized = scores.reduce((sum, s) => sum + (s.maxScore > 0 ? s.score / s.maxScore : 0), 0) / scores.length
    let grade = 'D'
    if (normalized >= 0.8) grade = 'A'
    else if (normalized >= 0.6) grade = 'B'
    else if (normalized >= 0.4) grade = 'C'

    // Top win / risk
    const topWin = avgVPS >= 70 ? `Average VPS at ${avgVPS} — strong content quality` : (briefCount || 0) > 0 ? `${briefCount} briefs created this week` : ''
    const topRisk = avgVPS > 0 && avgVPS < 50 ? `VPS averaging ${avgVPS} — needs attention` : memberIds.length <= 1 ? 'Single creator — agency growth needed' : ''

    return {
      agencyName: agency.name || 'Agency',
      period: 'Last 7 days',
      tier: agency.tier || 'Standard',
      scores,
      overallGrade: grade,
      trend,
      topWin,
      topRisk,
    }
  } catch {
    return null
  }
}

async function fetchVariantComparison(ctx: FetchContext): Promise<VariantComparisonData | null> {
  const db = getServiceClient()

  if (!ctx.briefId) return null

  try {
    // Get the primary brief
    const { data: brief } = await db
      .from('pre_generated_briefs')
      .select('id, brief_content')
      .eq('id', ctx.briefId)
      .single()

    if (!brief) return null

    const content = brief.brief_content || {}

    // Get unselected variants
    const { data: variants } = await db
      .from('brief_variants')
      .select('id, title, hook, vps_delta')
      .eq('brief_id', ctx.briefId)
      .eq('was_selected', false)

    if (!variants || variants.length === 0) return null

    return {
      briefId: String(brief.id),
      primaryTitle: content.title || 'Original Brief',
      variants: variants.map((v: { id: string; title: string; hook: string; vps_delta: number }) => ({
        variantId: String(v.id),
        title: v.title || 'Untitled Variant',
        hook: v.hook || '',
        vpsDelta: v.vps_delta || 0,
      })),
    }
  } catch {
    return null
  }
}

function mapPriorityToVariant(priorityType?: string): 'outperformance' | 'decay' | 'opportunity' {
  switch (priorityType) {
    case 'outperformance_alert': return 'outperformance'
    case 'decay_warning': return 'decay'
    case 'trend_opportunity': return 'opportunity'
    default: return 'opportunity'
  }
}
