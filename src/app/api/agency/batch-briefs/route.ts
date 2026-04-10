/**
 * Batch Brief Generation — "Generate This Week's Briefs"
 * Atlas subsystems 4+5+tools — Coordinator pattern (parallel Promise.all)
 *
 * POST /api/agency/batch-briefs
 * Body: { agency_id: string }
 *
 * Pipeline:
 * 1. Surface existing pre_generated_briefs from autoDream overnight (Prompt 26)
 * 2. For clients without overnight briefs, generate new ones in PARALLEL
 * 3. Each brief uses: client context + cultural events + niche trends + VPS scoring
 * 4. All briefs land in pre_generated_briefs with status='draft' for review
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { adversarialEvaluateBrief, storeEvaluationRounds } from '@/lib/content/adversarial-evaluator'
import { generateBriefVariants, storeVariants } from '@/lib/content/variant-generator'
import { assembleContext } from '@/lib/context/assemble-context'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// ── Types ───────────────────────────────────────────────────────────────

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
  event_title: string
  event_summary: string
  velocity_score: number
  confidence: number
  decay_rate_estimate: number
  keywords: string[]
  activated_niches: string[]
  niche: string
  expires_at: string | null
}

// ── Brief Generation (single client) ────────────────────────────────────

async function generateBriefsForClient(
  client: ClientProfile,
  events: CulturalEvent[],
  agencyId: string,
  apiKey: string,
  contextPrompt: string,
): Promise<Array<{
  agency_id: string
  client_id: string
  cultural_event_id: number
  brief_content: any
  vps_score: number
  confidence: number
  priority_type: string
  niche: string
  expires_at: string
}>> {
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })

  const clientName = client.business_name || 'Unknown Creator'
  const niche = client.niche_key || 'general'

  // Find events relevant to this client (normalize underscores/hyphens for matching)
  const normalizeNiche = (n: string) => n.replace(/_/g, '-').replace(/[-_]reviews?$/, '')
  const normalizedNiche = normalizeNiche(niche)
  const relevantEvents = events.filter(e => {
    const eNiche = normalizeNiche(e.niche)
    const activated = (e.activated_niches || []).map(normalizeNiche)
    return eNiche === normalizedNiche || activated.includes(normalizedNiche)
  }).slice(0, 3)

  if (relevantEvents.length === 0) return []

  const eventDescs = relevantEvents.map((e, i) =>
    `${i + 1}. "${e.event_title}" (velocity: ${e.velocity_score}, decay: ${e.decay_rate_estimate})\n   ${e.event_summary}\n   Keywords: ${e.keywords.slice(0, 5).join(', ')}`
  ).join('\n\n')

  const prompt = `${contextPrompt}

Generate content briefs for a short-form video creator.

## Creator
- Name: ${clientName}
- Niche: ${niche}
- Tone: ${(client.brand_tone || []).join(', ') || 'not specified'}
- Strategy: ${client.content_strategy_summary || 'none defined'}
- Hook styles: ${(client.recommended_hooks || []).slice(0, 3).join(', ') || 'none'}

## Cultural Events to Address
${eventDescs}

For EACH event, generate one content brief tailored to this creator. Return ONLY a JSON array (no markdown, no code fences) with:
- "event_index": 0, 1, or 2
- "title": catchy brief title (5-10 words)
- "hook": opening hook text (first 3 seconds)
- "angle": specific take for this creator
- "format": suggested format (talking head, b-roll montage, etc.)
- "talking_points": array of 3-4 key points
- "cta": call to action
- "estimated_vps": 0-100 viral potential
- "reasoning": one sentence why this fits`

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

    return briefs.map((b: any) => {
      const event = relevantEvents[b.event_index || 0]
      if (!event) return null

      const vps = Math.max(0, Math.min(100, b.estimated_vps || 50))
      const priority = (vps >= 70 && event.velocity_score >= 0.8) ? 'outperformance_alert'
        : event.decay_rate_estimate >= 0.6 ? 'decay_warning' : 'trend_opportunity'

      return {
        agency_id: agencyId,
        client_id: client.user_id,
        cultural_event_id: event.id,
        brief_content: {
          title: b.title, hook: b.hook, angle: b.angle, format: b.format,
          talking_points: b.talking_points || [], cta: b.cta,
          estimated_vps: vps, reasoning: b.reasoning || '',
        },
        vps_score: vps,
        confidence: event.confidence,
        priority_type: priority,
        niche,
        expires_at: event.expires_at || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      }
    }).filter(Boolean)
  } catch (err: any) {
    console.error(`[BatchBriefs] Generation failed for ${clientName}:`, err.message)
    return []
  }
}

// ── Main Handler ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { agency_id } = body

  if (!agency_id) {
    return NextResponse.json({ error: 'agency_id required' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  const apiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 })
  }
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 500 })
  }

  const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  const startTime = Date.now()
  const today = new Date().toISOString().split('T')[0]

  // 1. Load active cultural events
  const { data: events } = await db
    .from('cultural_events')
    .select('*')
    .eq('status', 'approved')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('velocity_score', { ascending: false })
    .limit(20)

  if (!events || events.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No active cultural events to generate briefs from',
      surfaced_overnight: 0,
      newly_generated: 0,
    })
  }

  // 2. Load clients
  const { data: clients } = await db
    .from('onboarding_profiles')
    .select('id, user_id, business_name, niche_key, brand_tone, content_strategy_summary, recommended_hooks')
    .not('niche_key', 'is', null)
    .limit(50)

  if (!clients || clients.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No clients with niche data',
      surfaced_overnight: 0,
      newly_generated: 0,
    })
  }

  // 3. Check for existing overnight briefs (from autoDream)
  const { data: overnightBriefs } = await db
    .from('pre_generated_briefs')
    .select('id, client_id, cultural_event_id')
    .eq('agency_id', agency_id)
    .eq('status', 'draft')
    .gte('generated_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())

  const overnightClientEventPairs = new Set(
    (overnightBriefs || []).map((b: any) => `${b.client_id}:${b.cultural_event_id}`)
  )
  const surfacedOvernight = (overnightBriefs || []).length

  // 4. Identify clients that need new briefs (no overnight coverage)
  const clientsNeedingBriefs = clients.filter(c => {
    const hasAnyOvernight = (overnightBriefs || []).some((b: any) => b.client_id === c.user_id)
    return !hasAnyOvernight
  })

  console.log(`[BatchBriefs] ${surfacedOvernight} overnight briefs surfaced, ${clientsNeedingBriefs.length} clients need generation`)

  // 5. PARALLEL generation for all clients that need briefs
  // Assemble per-client context (includes warm memory) in parallel with generation
  const generationPromises = clientsNeedingBriefs.map(async (client) => {
    const ctx = await assembleContext(db, agency_id, 'BatchBriefGeneration', client.user_id)
    return generateBriefsForClient(client, events, agency_id, apiKey, ctx.systemPrompt)
  })

  const generationResults = await Promise.all(generationPromises)

  // 6. Flatten, adversarial-evaluate, and insert all new briefs
  let newlyGenerated = 0
  const allNewBriefs = generationResults.flat()
  const errors: string[] = []

  for (const brief of allNewBriefs) {
    // Skip if overnight already covers this client+event
    const key = `${brief.client_id}:${brief.cultural_event_id}`
    if (overnightClientEventPairs.has(key)) continue

    // Run adversarial Critic/Synthesizer pipeline
    const evalResult = await adversarialEvaluateBrief(
      brief.brief_content,
      brief.niche || 'general',
      brief.client_id,
      db,
      agency_id,
    )

    const finalBriefContent = {
      ...evalResult.brief,
      _low_confidence: evalResult.low_confidence || undefined,
    }

    const { data: inserted, error } = await db
      .from('pre_generated_briefs')
      .insert({
        ...brief,
        brief_content: finalBriefContent,
        vps_score: evalResult.final_vps,
        status: 'draft',
        generated_at: new Date().toISOString(),
        final_critic_score: evalResult.final_critic_score,
        adversarial_rounds: evalResult.adversarial_rounds,
        generated_by_agent: 'Brief Architect',
      })
      .select('id')
      .single()

    if (error) {
      errors.push(error.message)
    } else {
      newlyGenerated++
      // Store adversarial evaluation rounds
      if (inserted?.id && evalResult.rounds.length > 0) {
        await storeEvaluationRounds(db, inserted.id, evalResult.rounds)
      }

      // Generate A/B/C variants for this brief
      if (inserted?.id) {
        try {
          const clientProfile = clientsNeedingBriefs.find(c => c.user_id === brief.client_id)
          const variantResult = await generateBriefVariants(
            evalResult.brief,
            brief.niche || 'general',
            {
              name: clientProfile?.business_name || 'Unknown',
              tone: (clientProfile?.brand_tone || []).join(', ') || 'not specified',
              strategy: clientProfile?.content_strategy_summary || 'none',
            },
          )
          await storeVariants(db, inserted.id, variantResult.variants)
        } catch (varErr: any) {
          console.error(`[BatchBriefs] Variant generation failed:`, varErr.message)
          // Non-fatal — the primary brief is already stored
        }
      }
    }
  }

  const elapsed = Date.now() - startTime
  console.log(`[BatchBriefs] Done: ${surfacedOvernight} surfaced + ${newlyGenerated} new in ${(elapsed / 1000).toFixed(1)}s (parallel)`)

  return NextResponse.json({
    success: true,
    surfaced_overnight: surfacedOvernight,
    newly_generated: newlyGenerated,
    total_available: surfacedOvernight + newlyGenerated,
    clients_processed: clients.length,
    clients_skipped_overnight: clients.length - clientsNeedingBriefs.length,
    parallel_generation: true,
    elapsed_ms: elapsed,
    errors: errors.length > 0 ? errors : undefined,
  })
}
