/**
 * Centralized Context Assembly — assembleContext()
 *
 * Every LLM call in the system routes through this function to ensure
 * consistent, budget-aware context injection. Queries multiple sources
 * in parallel and assembles a structured system prompt string.
 *
 * Token budgets:
 *   Hot memory:       2000 tokens max
 *   Warm memory:       500 tokens max (only if clientId provided)
 *   Cultural events:   ~400 tokens
 *   Accuracy stats:    ~200 tokens
 *   Tool-specific:     ~400 tokens
 *   Skill set config:  ~500 tokens
 *   ─────────────────────────────
 *   Total budget:     4000 tokens max
 *
 * Trimming order (reverse priority — trim tool-specific first):
 *   tool-specific → accuracy stats → cultural events → warm memory
 *   Hot memory is NEVER trimmed below its 2000-token cap.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ── Types ───────────────────────────────────────────────────────────────

export interface AssembledContext {
  systemPrompt: string
  meta: {
    total_tokens: number
    hot_tokens: number
    warm_tokens: number
    cultural_tokens: number
    accuracy_tokens: number
    skill_tokens: number
    tool_tokens: number
  }
}

interface MemoryFact {
  id: number
  fact: string
  confidence: number
  source: string
}

interface CulturalEvent {
  event_title: string
  event_summary: string
  velocity_score: number
  keywords: string[]
}

interface AccuracyStats {
  total_predictions: number
  with_feedback: number
  avg_delta: number | null
}

// ── Token Estimation ────────────────────────────────────────────────────

/** Rough token count: ~4 chars per token for English text */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// ── Token Budgets ───────────────────────────────────────────────────────

const BUDGET = {
  hot: 2000,
  warm: 500,
  total: 4000,
} as const

// ── Tool-Specific Context Map ───────────────────────────────────────────

const TOOL_CONTEXT_MAP: Record<string, string> = {
  GenerateContentBrief: `## Tool: Content Brief Generation
Format the brief with: hook suggestion, content structure, recommended duration, VPS prediction.
Use the creator's content personality from warm memory if available.
Each brief must be actionable — the creator could film it today.
Include a reasoning field explaining why this brief fits this creator.`,

  FetchMorningBrief: `## Tool: Morning Brief Assembly
Prioritize cards in this order:
1. Outperformance alerts (high VPS + high velocity events)
2. Decay warnings (events expiring soon — act now or miss it)
3. Trend opportunities (new cultural events matching agency niches)
Surface the top 3 cards. Include agent attribution for each card.`,

  FetchTrendRadar: `## Tool: Trend Radar
Filter to trends relevant to this agency's niche(s).
Include velocity scores and decay rate estimates for each trend.
Flag flash trends (decay_rate >= 0.6) that need immediate action.
Order by velocity_score descending.`,

  AgencyChat: `## Tool: Agency Dashboard Chat
You are the Trendzo Intelligent Clay engine. Confident, data-driven, slightly edgy.
Use the agency's hot memory to personalize responses.
Reference cultural events when relevant to the conversation.
When discussing predictions, cite accuracy stats honestly.`,

  AgentCardChat: `## Tool: Agent Card Chat
You are a niche-specific AI advisor. Keep responses under 250 words.
Be warm, knowledgeable, and conversational.
When referencing trending data, attribute to "Trend Scout".
When referencing VPS or performance, attribute to "Performance Analyst".`,

  AdversarialCritic: `## Tool: Adversarial Brief Evaluation
You are evaluating brief quality against DPS signal thresholds.
Use hot memory to understand agency-specific quality standards.
Consider cultural event velocity and decay when scoring timing.
Be specific in objections — cite thresholds and metrics.`,

  BatchBriefGeneration: `## Tool: Batch Brief Generation
Generating briefs in parallel for multiple clients.
Avoid duplicate angles across clients in the same niche.
Each brief should address a different cultural event or angle.
Prioritize events with highest velocity and lowest decay.`,

  RunVPSPrediction: `## Tool: VPS Prediction (Creator Path)
You are scoring a short-form video for an authenticated creator inside an agency.
Use the agency's hot memory to understand quality standards and recurring patterns.
Consider active cultural events when judging timing, novelty, and shareability.
Reference warm memory (creator-specific calibration) when available for audience fit.
Your score and rationale should remain grounded in the rubric — context informs judgement, it does not override the rubric thresholds.`,
}

// ── Data Fetchers (run in parallel) ─────────────────────────────────────

async function fetchHotMemory(
  db: SupabaseClient,
  agencyId: string,
): Promise<MemoryFact[]> {
  const { data, error } = await db
    .from('memory_extractions')
    .select('id, fact, confidence, source')
    .eq('agency_id', agencyId)
    .eq('tier', 'hot')
    .is('superseded_by', null)
    .order('confidence', { ascending: false })
    .limit(100)

  if (error || !data) return []
  return data as MemoryFact[]
}

async function fetchWarmMemory(
  db: SupabaseClient,
  agencyId: string,
  clientId: string,
): Promise<MemoryFact[]> {
  const { data, error } = await db
    .from('memory_extractions')
    .select('id, fact, confidence, source')
    .eq('agency_id', agencyId)
    .eq('creator_id', clientId)
    .eq('tier', 'warm')
    .is('superseded_by', null)
    .order('confidence', { ascending: false })
    .limit(50)

  if (error || !data) return []
  return data as MemoryFact[]
}

async function fetchSkillSetConfig(
  db: SupabaseClient,
  agencyId: string,
): Promise<string> {
  // Get agency's niches, content goals, and metrics from onboarding profiles
  const { data: profiles } = await db
    .from('onboarding_profiles')
    .select('niche_key, primary_niche, content_goals, subtopics, platform')
    .eq('agency_id', agencyId)
    .not('niche_key', 'is', null)
    .limit(50)

  if (!profiles || profiles.length === 0) return ''

  const niches = [...new Set(
    profiles.map(p => p.primary_niche || p.niche_key).filter(Boolean)
  )]
  const allGoals = [...new Set(
    profiles.flatMap(p => p.content_goals || [])
  )]
  const platforms = [...new Set(
    profiles.map(p => p.platform).filter(Boolean)
  )]
  const subtopics = [...new Set(
    profiles.flatMap(p => {
      if (Array.isArray(p.subtopics)) return p.subtopics.map((s: any) => typeof s === 'string' ? s : s?.label || s?.name || '')
      return []
    }).filter(Boolean)
  )].slice(0, 10)

  const parts: string[] = ['## Agency Skill Set']
  parts.push(`Niches: ${niches.join(', ')}`)
  if (platforms.length > 0) parts.push(`Platforms: ${platforms.join(', ')}`)
  if (allGoals.length > 0) parts.push(`Content goals: ${allGoals.slice(0, 8).join(', ')}`)
  if (subtopics.length > 0) parts.push(`Key subtopics: ${subtopics.join(', ')}`)
  parts.push(`Active creators: ${profiles.length}`)

  return parts.join('\n')
}

async function fetchCulturalEvents(
  db: SupabaseClient,
  agencyNiches: string[],
): Promise<CulturalEvent[]> {
  if (agencyNiches.length === 0) return []

  const { data, error } = await db
    .from('cultural_events')
    .select('event_title, event_summary, velocity_score, keywords, activated_niches')
    .eq('status', 'approved')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('velocity_score', { ascending: false })
    .limit(20)

  if (error || !data) return []

  // Filter to events relevant to agency niches
  const normalizeNiche = (n: string) => n.replace(/_/g, '-').replace(/[-_]reviews?$/, '')
  const normalizedAgencyNiches = agencyNiches.map(normalizeNiche)

  const relevant = data.filter((e: any) => {
    const activated = (e.activated_niches || []).map((a: string) => normalizeNiche(a))
    return activated.some((a: string) => normalizedAgencyNiches.includes(a))
  })

  return relevant.slice(0, 3) as CulturalEvent[]
}

async function fetchAccuracyStats(
  db: SupabaseClient,
  agencyId: string,
): Promise<AccuracyStats> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()

  // prediction_log doesn't have agency_id directly — join through creator_id → profiles
  // For now, query all recent predictions (agency filtering via creator_id if needed)
  const { data, error } = await db
    .from('prediction_log')
    .select('predicted_vps, actual_performance, delta, feedback_collected')
    .gte('predicted_at', sevenDaysAgo)
    .limit(200)

  if (error || !data || data.length === 0) {
    return { total_predictions: 0, with_feedback: 0, avg_delta: null }
  }

  const withFeedback = data.filter((p: any) => p.feedback_collected && p.delta != null)
  const avgDelta = withFeedback.length > 0
    ? withFeedback.reduce((sum: number, p: any) => sum + Math.abs(Number(p.delta)), 0) / withFeedback.length
    : null

  return {
    total_predictions: data.length,
    with_feedback: withFeedback.length,
    avg_delta: avgDelta != null ? Math.round(avgDelta * 100) / 100 : null,
  }
}

async function fetchAgencyNiches(
  db: SupabaseClient,
  agencyId: string,
): Promise<string[]> {
  const { data } = await db
    .from('onboarding_profiles')
    .select('niche_key, primary_niche')
    .eq('agency_id', agencyId)
    .not('niche_key', 'is', null)
    .limit(50)

  if (!data) return []
  return [...new Set(data.map(p => p.primary_niche || p.niche_key).filter(Boolean))]
}

// ── Memory Trimming ─────────────────────────────────────────────────────

/** Trim memory facts to fit within a token budget, dropping lowest confidence first */
function trimMemoryToBudget(facts: MemoryFact[], budget: number): { text: string; tokens: number } {
  if (facts.length === 0) return { text: '', tokens: 0 }

  // Facts are already ordered by confidence DESC
  const lines: string[] = []
  let totalTokens = 0

  for (const fact of facts) {
    const line = `- ${fact.fact} (confidence: ${fact.confidence}, source: ${fact.source})`
    const lineTokens = estimateTokens(line)

    if (totalTokens + lineTokens > budget) break
    lines.push(line)
    totalTokens += lineTokens
  }

  return { text: lines.join('\n'), tokens: totalTokens }
}

// ── Main Entry Point ────────────────────────────────────────────────────

/**
 * Assembles a structured context string from multiple data sources
 * for injection into LLM system prompts.
 *
 * @param db - Supabase service-role client
 * @param agencyId - The agency to assemble context for
 * @param toolName - Which tool/feature is requesting context
 * @param clientId - Optional: specific creator for warm memory injection
 * @returns AssembledContext with prompt string and token metadata
 */
export async function assembleContext(
  db: SupabaseClient,
  agencyId: string,
  toolName: string,
  clientId?: string,
): Promise<AssembledContext> {
  const startTime = Date.now()

  // Validate agencyId
  if (!agencyId) {
    return emptyContext('No agency ID provided')
  }

  // ── Parallel data fetch ──────────────────────────────────────────────
  // Fetch agency niches first (needed for cultural events query)
  const agencyNiches = await fetchAgencyNiches(db, agencyId)

  const fetchPromises = [
    fetchHotMemory(db, agencyId),
    fetchSkillSetConfig(db, agencyId),
    fetchCulturalEvents(db, agencyNiches),
    fetchAccuracyStats(db, agencyId),
    clientId ? fetchWarmMemory(db, agencyId, clientId) : Promise.resolve([]),
  ] as const

  const [hotFacts, skillConfig, culturalEvents, accuracyStats, warmFacts] = await Promise.all(fetchPromises)

  // ── Assemble sections with token tracking ────────────────────────────

  // 1. Hot memory (highest priority — never trimmed below budget)
  const hot = trimMemoryToBudget(hotFacts as MemoryFact[], BUDGET.hot)
  const hotSection = hot.text
    ? `## Agency Memory (Hot)\n${hot.text}`
    : ''

  // 2. Skill set config
  const skillSection = skillConfig as string
  const skillTokens = estimateTokens(skillSection)

  // 3. Warm memory (only if clientId provided)
  const warm = clientId
    ? trimMemoryToBudget(warmFacts as MemoryFact[], BUDGET.warm)
    : { text: '', tokens: 0 }
  const warmSection = warm.text
    ? `## Creator Memory (Warm — ${clientId})\n${warm.text}`
    : ''

  // 4. Cultural events
  let culturalSection = ''
  const events = culturalEvents as CulturalEvent[]
  if (events.length > 0) {
    const eventLines = events.map(e =>
      `- "${e.event_title}" (velocity: ${e.velocity_score}): ${e.event_summary.slice(0, 120)}${e.event_summary.length > 120 ? '...' : ''}`
    )
    culturalSection = `## Active Cultural Events\n${eventLines.join('\n')}`
  }
  const culturalTokens = estimateTokens(culturalSection)

  // 5. Accuracy stats
  const stats = accuracyStats as AccuracyStats
  let accuracySection = ''
  if (stats.total_predictions > 0) {
    const parts = [`## Prediction Accuracy (Last 7 Days)`, `Total predictions: ${stats.total_predictions}`]
    if (stats.with_feedback > 0) {
      parts.push(`With feedback: ${stats.with_feedback}`)
      if (stats.avg_delta != null) {
        parts.push(`Average VPS delta: ${stats.avg_delta} points`)
      }
    } else {
      parts.push('No feedback collected yet — accuracy unknown')
    }
    accuracySection = parts.join('\n')
  }
  const accuracyTokens = estimateTokens(accuracySection)

  // 6. Tool-specific context
  const toolSection = TOOL_CONTEXT_MAP[toolName] || ''
  const toolTokens = estimateTokens(toolSection)

  // ── Budget enforcement (trim in reverse priority order) ──────────────
  let sections = [
    { key: 'hot', text: hotSection, tokens: hot.tokens, priority: 0 },       // never trim
    { key: 'skill', text: skillSection, tokens: skillTokens, priority: 1 },   // never trim
    { key: 'warm', text: warmSection, tokens: warm.tokens, priority: 2 },
    { key: 'cultural', text: culturalSection, tokens: culturalTokens, priority: 3 },
    { key: 'accuracy', text: accuracySection, tokens: accuracyTokens, priority: 4 },
    { key: 'tool', text: toolSection, tokens: toolTokens, priority: 5 },
  ]

  let totalTokens = sections.reduce((sum, s) => sum + s.tokens, 0)

  // Trim from highest priority number (lowest importance) first
  if (totalTokens > BUDGET.total) {
    const trimOrder = [...sections].sort((a, b) => b.priority - a.priority)
    for (const section of trimOrder) {
      if (totalTokens <= BUDGET.total) break
      if (section.priority <= 1) break // never trim hot memory or skill set

      totalTokens -= section.tokens
      section.text = ''
      section.tokens = 0
    }
  }

  // ── Compose final prompt ─────────────────────────────────────────────
  const finalSections = sections
    .filter(s => s.text.length > 0)
    .map(s => s.text)

  const systemPrompt = finalSections.join('\n\n')
  const finalTotalTokens = estimateTokens(systemPrompt)

  // ── Optional logging (fire-and-forget) ───────────────────────────────
  const elapsed = Date.now() - startTime
  logContextAssembly(db, {
    agency_id: agencyId,
    tool_name: toolName,
    total_tokens: finalTotalTokens,
    hot_tokens: sections.find(s => s.key === 'hot')!.tokens,
    warm_tokens: sections.find(s => s.key === 'warm')!.tokens,
    cultural_tokens: sections.find(s => s.key === 'cultural')!.tokens,
    accuracy_tokens: sections.find(s => s.key === 'accuracy')!.tokens,
    skill_tokens: sections.find(s => s.key === 'skill')!.tokens,
    tool_tokens: sections.find(s => s.key === 'tool')!.tokens,
    latency_ms: elapsed,
  }).catch(() => {}) // never let logging crash the pipeline

  if (elapsed > 500) {
    console.warn(`[assembleContext] Slow context assembly: ${elapsed}ms for agency ${agencyId}, tool ${toolName}`)
  }

  return {
    systemPrompt,
    meta: {
      total_tokens: finalTotalTokens,
      hot_tokens: sections.find(s => s.key === 'hot')!.tokens,
      warm_tokens: sections.find(s => s.key === 'warm')!.tokens,
      cultural_tokens: sections.find(s => s.key === 'cultural')!.tokens,
      accuracy_tokens: sections.find(s => s.key === 'accuracy')!.tokens,
      skill_tokens: sections.find(s => s.key === 'skill')!.tokens,
      tool_tokens: sections.find(s => s.key === 'tool')!.tokens,
    },
  }
}

// ── Empty Context Helper ────────────────────────────────────────────────

function emptyContext(reason: string): AssembledContext {
  return {
    systemPrompt: `## Context\n${reason}`,
    meta: {
      total_tokens: estimateTokens(reason),
      hot_tokens: 0,
      warm_tokens: 0,
      cultural_tokens: 0,
      accuracy_tokens: 0,
      skill_tokens: 0,
      tool_tokens: 0,
    },
  }
}

// ── Logging ─────────────────────────────────────────────────────────────

async function logContextAssembly(
  db: SupabaseClient,
  row: {
    agency_id: string
    tool_name: string
    total_tokens: number
    hot_tokens: number
    warm_tokens: number
    cultural_tokens: number
    accuracy_tokens: number
    skill_tokens: number
    tool_tokens: number
    latency_ms: number
  },
): Promise<void> {
  try {
    await db.from('context_assembly_log').insert({
      agency_id: row.agency_id,
      tool_name: row.tool_name,
      total_tokens: row.total_tokens,
      hot_tokens: row.hot_tokens,
      warm_tokens: row.warm_tokens,
      cultural_tokens: row.cultural_tokens,
      accuracy_tokens: row.accuracy_tokens,
      skill_tokens: row.skill_tokens,
      tool_tokens: row.tool_tokens,
      latency_ms: row.latency_ms,
    })
  } catch {
    // Swallow — never let logging block the pipeline
  }
}
