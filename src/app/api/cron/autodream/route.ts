/**
 * autoDream — Overnight Pipeline
 * Atlas subsystem 5 — forked sub-agent pattern
 *
 * GET /api/cron/autodream                  — process all active agencies
 * GET /api/cron/autodream?agency_id=UUID   — process one agency
 *
 * Pipeline per agency:
 * 1. Load agency context + active cultural events
 * 2. For each client (onboarding profile with niche):
 *    a. Load client warm memory (calibration, channel data, brief history)
 *    b. Find cultural events the client hasn't addressed
 *    c. Generate draft briefs via LLM for top 1-2 mismatches
 *    d. Score each brief concept with estimated VPS
 *    e. Store in pre_generated_briefs
 * 3. Compose morning brief cards (top 3 by priority)
 * 4. Store in morning_briefs
 *
 * CRITICAL: Each agency runs as a separate invocation context.
 * Never a continuation of any user session.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { adversarialEvaluateBrief, storeEvaluationRounds } from '@/lib/content/adversarial-evaluator'
import { assembleContext } from '@/lib/context/assemble-context'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// ── Types ───────────────────────────────────────────────────────────────

interface AgencyRow {
  id: string
  name: string
  tier: string
  status: string
}

interface ClientProfile {
  id: string
  user_id: string
  business_name: string | null
  niche_key: string | null
  brand_tone: string[] | null
  content_strategy_summary: string | null
  recommended_hooks: string[] | null
}

interface CulturalEvent {
  id: number
  niche: string
  event_title: string
  event_summary: string
  velocity_score: number
  confidence: number
  decay_rate_estimate: number
  keywords: string[]
  activated_niches: string[]
  expires_at: string | null
}

interface GeneratedBrief {
  title: string
  hook: string
  angle: string
  format: string
  talking_points: string[]
  cta: string
  estimated_vps: number
  reasoning: string
}

// ── LLM Brief Generation ────────────────────────────────────────────────

async function generateBriefs(
  client: ClientProfile,
  events: CulturalEvent[],
  clientHistory: any[],
  contextPrompt: string,
): Promise<Array<{ event: CulturalEvent; brief: GeneratedBrief }>> {
  const apiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey) return []

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })

  // Build client context
  const clientName = client.business_name || 'Unknown Creator'
  const niche = client.niche_key || 'general'
  const tones = (client.brand_tone || []).join(', ') || 'not specified'
  const strategy = client.content_strategy_summary || 'no strategy defined'
  const hooks = (client.recommended_hooks || []).slice(0, 3).join(', ') || 'none'
  const recentBriefTitles = clientHistory.slice(0, 5).map((b: any) => b.brief_content?.title || 'untitled').join('; ')

  // Build event descriptions
  const eventDescs = events.slice(0, 2).map((e, i) =>
    `${i + 1}. "${e.event_title}" (velocity: ${e.velocity_score}, decay: ${e.decay_rate_estimate})\n   ${e.event_summary}\n   Keywords: ${e.keywords.slice(0, 5).join(', ')}`
  ).join('\n\n')

  const prompt = `${contextPrompt}

You are an overnight content strategist for the Trendzo platform. Generate a draft brief for a short-form video creator.

## Creator Profile
- Name: ${clientName}
- Niche: ${niche}
- Brand Tone: ${tones}
- Strategy: ${strategy}
- Preferred Hook Styles: ${hooks}
- Recent Briefs (avoid repeating): ${recentBriefTitles || 'none yet'}

## Cultural Events to Address
${eventDescs}

## Instructions
For EACH cultural event above, generate one content brief. Each brief should be:
- Tailored to this specific creator's niche, tone, and audience
- Actionable (the creator could film this today)
- Different from their recent briefs

Return ONLY a JSON array (no markdown, no code fences) with objects:
- "event_index": 0 or 1 (which event this brief addresses)
- "title": Brief title (catchy, 5-10 words)
- "hook": Opening hook text (first 3 seconds of the video)
- "angle": The specific angle/take for this creator
- "format": Suggested format (talking head, b-roll montage, before/after, etc.)
- "talking_points": Array of 3-4 key talking points
- "cta": Suggested call to action
- "estimated_vps": 0-100 estimated viral potential score based on event velocity + niche fit
- "reasoning": One sentence explaining why this brief fits this creator`

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.5 },
    })

    const text = result.text || ''
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()

    let briefs: any[]
    try { briefs = JSON.parse(cleaned) } catch {
      const match = cleaned.match(/\[[\s\S]*\]/)
      if (match) briefs = JSON.parse(match[0])
      else return []
    }

    return briefs.map((b: any) => ({
      event: events[b.event_index || 0],
      brief: {
        title: b.title,
        hook: b.hook,
        angle: b.angle,
        format: b.format,
        talking_points: b.talking_points || [],
        cta: b.cta,
        estimated_vps: Math.max(0, Math.min(100, b.estimated_vps || 50)),
        reasoning: b.reasoning || '',
      },
    })).filter((b: any) => b.event) // filter out invalid event indexes
  } catch (err: any) {
    console.error(`[autoDream] Brief generation failed for ${clientName}:`, err.message)
    return []
  }
}

// ── Priority Classification ─────────────────────────────────────────────

function classifyPriority(
  event: CulturalEvent,
  vpsScore: number
): 'outperformance_alert' | 'decay_warning' | 'trend_opportunity' {
  // High VPS + high velocity = outperformance alert
  if (vpsScore >= 70 && event.velocity_score >= 0.8) return 'outperformance_alert'
  // High decay rate = decay warning (act now or miss it)
  if (event.decay_rate_estimate >= 0.6) return 'decay_warning'
  // Default: opportunity
  return 'trend_opportunity'
}

// ── Process One Agency ──────────────────────────────────────────────────

async function processAgency(
  db: SupabaseClient,
  agency: AgencyRow,
  today: string
): Promise<{ briefs_generated: number; morning_cards: number; errors: string[] }> {
  const errors: string[] = []
  let briefsGenerated = 0

  // 1. Load active cultural events (approved, not expired)
  const { data: events } = await db
    .from('cultural_events')
    .select('*')
    .eq('status', 'approved')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('velocity_score', { ascending: false })
    .limit(20)

  if (!events || events.length === 0) {
    return { briefs_generated: 0, morning_cards: 0, errors: ['No active cultural events'] }
  }

  // 2. Load clients (onboarding profiles with niche_key set)
  const { data: clients } = await db
    .from('onboarding_profiles')
    .select('id, user_id, business_name, niche_key, brand_tone, content_strategy_summary, recommended_hooks')
    .not('niche_key', 'is', null)
    .limit(50)

  if (!clients || clients.length === 0) {
    return { briefs_generated: 0, morning_cards: 0, errors: ['No clients with niche data'] }
  }

  const allBriefCards: any[] = []

  // Assemble centralized context for this agency (once per agency, reused for all clients)
  const agencyContext = await assembleContext(db, agency.id, 'GenerateContentBrief')

  for (const client of clients) {
    try {
      // 3a. Load client's brief history (to avoid repeats)
      const { data: briefHistory } = await db
        .from('pre_generated_briefs')
        .select('brief_content, cultural_event_id')
        .eq('client_id', client.user_id)
        .order('generated_at', { ascending: false })
        .limit(10)

      // 3b. Find events relevant to this client's niche that haven't been addressed
      const addressedEventIds = new Set(
        (briefHistory || []).map((b: any) => b.cultural_event_id).filter(Boolean)
      )

      // Normalize niche keys for matching (underscores/hyphens, strip -reviews suffix)
      const normalizeNiche = (n: string) => n.replace(/_/g, '-').replace(/[-_]reviews?$/, '')
      const clientNiche = normalizeNiche(client.niche_key || '')

      const relevantEvents = events.filter((e: any) => {
        const eNiche = normalizeNiche(e.niche)
        const activated = (e.activated_niches || []).map((a: string) => normalizeNiche(a))
        return (eNiche === clientNiche || activated.includes(clientNiche)) && !addressedEventIds.has(e.id)
      })

      if (relevantEvents.length === 0) continue

      // Get per-client context (adds warm memory if available)
      const clientContext = await assembleContext(db, agency.id, 'GenerateContentBrief', client.user_id)

      // 3c. Generate briefs for top 1-2 unaddressed events
      const topEvents = relevantEvents.slice(0, 2)
      const generated = await generateBriefs(client, topEvents, briefHistory || [], clientContext.systemPrompt)

      // 3d. Adversarial evaluation + store each brief
      for (const { event, brief } of generated) {
        // Run adversarial Critic/Synthesizer pipeline before storing
        const evalResult = await adversarialEvaluateBrief(
          brief,
          client.niche_key || 'general',
          client.user_id,
          db,
          agency.id,
        )

        const finalBrief = evalResult.brief
        const priority = classifyPriority(event, finalBrief.estimated_vps)
        const expiresAt = event.expires_at || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()

        const { data: inserted, error: insertErr } = await db
          .from('pre_generated_briefs')
          .insert({
            agency_id: agency.id,
            client_id: client.user_id,
            cultural_event_id: event.id,
            brief_content: {
              ...finalBrief,
              _low_confidence: evalResult.low_confidence || undefined,
            },
            vps_score: finalBrief.estimated_vps,
            confidence: event.confidence,
            priority_type: priority,
            status: 'draft',
            expires_at: expiresAt,
            niche: client.niche_key,
            final_critic_score: evalResult.final_critic_score,
            adversarial_rounds: evalResult.adversarial_rounds,
            generated_by_agent: 'Brief Architect',
          })
          .select('id')
          .single()

        if (insertErr) {
          errors.push(`Brief insert for ${client.business_name}: ${insertErr.message}`)
        } else {
          briefsGenerated++

          // Store adversarial evaluation rounds
          if (inserted?.id && evalResult.rounds.length > 0) {
            await storeEvaluationRounds(db, inserted.id, evalResult.rounds)
          }

          // Determine agent attribution based on card priority type
          const agentAttribution = priority === 'outperformance_alert' ? 'Performance Analyst'
            : priority === 'decay_warning' ? 'Performance Analyst'
            : 'Trend Scout'

          allBriefCards.push({
            client_id: client.user_id,
            client_name: client.business_name || 'Unknown',
            niche: client.niche_key,
            event_title: event.event_title,
            brief_title: finalBrief.title,
            brief_summary: finalBrief.angle,
            hook: finalBrief.hook,
            vps_score: finalBrief.estimated_vps,
            priority_type: priority,
            cultural_event_id: event.id,
            final_critic_score: evalResult.final_critic_score,
            adversarial_rounds: evalResult.adversarial_rounds,
            generated_by_agent: agentAttribution,
            decay_warning: event.decay_rate_estimate >= 0.6
              ? `This event expires ${new Date(expiresAt).toLocaleDateString()} — act fast`
              : null,
          })
        }
      }

      // Rate limit between clients
      await new Promise(r => setTimeout(r, 1000))
    } catch (err: any) {
      errors.push(`Client ${client.business_name}: ${err.message}`)
    }
  }

  // 4. Compose morning brief — top 3 cards by priority
  const priorityOrder = { outperformance_alert: 0, decay_warning: 1, trend_opportunity: 2 }
  const sortedCards = allBriefCards
    .sort((a, b) => {
      const pDiff = (priorityOrder[a.priority_type as keyof typeof priorityOrder] || 2) -
                    (priorityOrder[b.priority_type as keyof typeof priorityOrder] || 2)
      if (pDiff !== 0) return pDiff
      return (b.vps_score || 0) - (a.vps_score || 0)
    })
    .slice(0, 3)

  if (sortedCards.length > 0) {
    const { error: morningErr } = await db
      .from('morning_briefs')
      .upsert({
        agency_id: agency.id,
        brief_date: today,
        cards: sortedCards,
        card_count: sortedCards.length,
        status: 'ready',
        generated_by_agent: 'Brief Architect',
      }, { onConflict: 'agency_id,brief_date' })

    if (morningErr) {
      errors.push(`Morning brief insert: ${morningErr.message}`)
    }
  }

  return {
    briefs_generated: briefsGenerated,
    morning_cards: sortedCards.length,
    errors,
  }
}

// ── Main Handler ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetAgencyId = searchParams.get('agency_id') || null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 })
  }

  const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  const startTime = Date.now()
  const today = new Date().toISOString().split('T')[0]

  // Load agencies
  let agencyQuery = db.from('agencies').select('id, name, tier, status')
  if (targetAgencyId) {
    agencyQuery = agencyQuery.eq('id', targetAgencyId)
  }
  const { data: agencies, error: agencyErr } = await agencyQuery.limit(50)

  if (agencyErr || !agencies || agencies.length === 0) {
    return NextResponse.json({
      success: false,
      error: agencyErr?.message || 'No agencies found',
    }, { status: 404 })
  }

  console.log(`[autoDream] Processing ${agencies.length} agency(ies)...`)

  const results: Record<string, any> = {}
  let totalBriefs = 0
  let totalCards = 0
  const allErrors: string[] = []

  for (const agency of agencies) {
    console.log(`[autoDream] Agency: ${agency.name} (${agency.id})`)
    const result = await processAgency(db, agency, today)
    results[agency.name] = result
    totalBriefs += result.briefs_generated
    totalCards += result.morning_cards
    allErrors.push(...result.errors)
  }

  // Track job run
  try {
    await db.from('integration_job_runs').upsert({ job: 'autodream', last_run: new Date().toISOString() } as any)
  } catch {}

  const elapsed = Date.now() - startTime
  console.log(`[autoDream] Done: ${totalBriefs} briefs, ${totalCards} morning cards in ${(elapsed / 1000).toFixed(1)}s`)

  return NextResponse.json({
    success: true,
    agencies_processed: agencies.length,
    total_briefs_generated: totalBriefs,
    total_morning_cards: totalCards,
    elapsed_ms: elapsed,
    results,
    errors: allErrors.length > 0 ? allErrors : undefined,
  })
}
