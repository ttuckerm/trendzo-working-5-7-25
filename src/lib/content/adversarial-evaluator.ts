/**
 * Adversarial Brief Evaluator — Critic + Synthesizer Pipeline
 *
 * Three-agent architecture:
 * 1. Generator (existing) — creates the draft brief
 * 2. Critic (new) — attacks the brief using DPS signal thresholds
 * 3. Synthesizer (new) — rewrites the brief incorporating Critic objections
 *
 * Flow:
 * - Critic scores the brief (0-100 survival probability)
 * - If score < 60: Synthesizer rewrites, then VPS re-scored, loop (max 3 rounds)
 * - If score >= 60: brief passes through
 * - If still < 60 after 3 rounds: pass through flagged as low confidence
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { assembleContext } from '@/lib/context/assemble-context'

// ── Types ───────────────────────────────────────────────────────────────

export interface GeneratedBrief {
  title: string
  hook: string
  angle: string
  format: string
  talking_points: string[]
  cta: string
  estimated_vps: number
  reasoning: string
}

export interface CriticObjection {
  element: string        // e.g. "hook_structure", "pacing", "format_choice", "cultural_timing"
  weakness: string       // specific description of the weakness
  threshold_violated?: string  // e.g. "completion_rate below niche avg 0.42"
}

export interface CriticResult {
  score: number          // 0-100 survival probability
  objections: CriticObjection[]
  summary: string        // one-line verdict
}

export interface EvaluationRound {
  round_number: number
  critic_score: number
  objections: CriticObjection[]
  revised: boolean
}

export interface AdversarialResult {
  brief: GeneratedBrief         // final brief (original or revised)
  rounds: EvaluationRound[]     // all evaluation rounds
  final_critic_score: number    // score from last round
  adversarial_rounds: number    // total rounds used
  low_confidence: boolean       // true if still < 60 after 3 rounds
  original_vps: number          // VPS of original brief
  final_vps: number             // VPS of final brief
}

interface DpsThresholds {
  avg_completion_rate: number
  avg_share_rate: number
  avg_save_rate: number
  avg_velocity_score: number
  video_count: number           // how many videos these averages are based on
}

interface ClientMemory {
  business_name: string
  brand_tone: string[]
  content_strategy_summary: string
  recommended_hooks: string[]
  recent_formats: string[]      // formats used in recent briefs
}

// ── Global Fallback Thresholds ──────────────────────────────────────────

const GLOBAL_FALLBACK_THRESHOLDS: DpsThresholds = {
  avg_completion_rate: 0.35,
  avg_share_rate: 0.02,
  avg_save_rate: 0.03,
  avg_velocity_score: 0.5,
  video_count: 0,
}

// ── DPS Threshold Lookup ────────────────────────────────────────────────

async function getNicheThresholds(
  db: SupabaseClient,
  niche: string,
): Promise<DpsThresholds> {
  try {
    // Query scraped_videos for this niche to compute average signal rates
    // We use raw metrics + views to compute rates
    const { data, error } = await db
      .from('scraped_videos')
      .select('views_count, likes_count, shares_count, saves_count, dps_breakdown')
      .eq('niche', niche)
      .gt('views_count', 0)
      .order('scraped_at', { ascending: false })
      .limit(200)

    if (error || !data || data.length === 0) {
      console.log(`[Critic] No scraped_videos for niche "${niche}", using global fallbacks`)
      return { ...GLOBAL_FALLBACK_THRESHOLDS }
    }

    // Compute average rates from raw metrics
    let totalCompletionRate = 0
    let totalShareRate = 0
    let totalSaveRate = 0
    let totalVelocity = 0
    let completionCount = 0

    for (const v of data) {
      const views = v.views_count || 1
      totalShareRate += (v.shares_count || 0) / views
      totalSaveRate += (v.saves_count || 0) / views

      // completion_rate and velocity may be in dps_breakdown JSONB
      const breakdown = v.dps_breakdown as any
      if (breakdown?.completion_rate != null) {
        totalCompletionRate += breakdown.completion_rate
        completionCount++
      }
      if (breakdown?.velocity_score != null) {
        totalVelocity += breakdown.velocity_score
      } else {
        // Fallback: approximate velocity from like ratio
        totalVelocity += Math.min(1, (v.likes_count || 0) / views * 10)
      }
    }

    const n = data.length
    return {
      avg_completion_rate: completionCount > 0 ? totalCompletionRate / completionCount : GLOBAL_FALLBACK_THRESHOLDS.avg_completion_rate,
      avg_share_rate: totalShareRate / n,
      avg_save_rate: totalSaveRate / n,
      avg_velocity_score: totalVelocity / n,
      video_count: n,
    }
  } catch (err: any) {
    console.error(`[Critic] Threshold lookup failed for "${niche}":`, err.message)
    return { ...GLOBAL_FALLBACK_THRESHOLDS }
  }
}

// ── Client Memory Loader ────────────────────────────────────────────────

export async function loadClientMemory(
  db: SupabaseClient,
  clientId: string,
  niche: string,
): Promise<ClientMemory> {
  // Load onboarding profile
  const { data: profile } = await db
    .from('onboarding_profiles')
    .select('business_name, brand_tone, content_strategy_summary, recommended_hooks')
    .eq('user_id', clientId)
    .single()

  // Load recent brief formats to detect staleness
  const { data: recentBriefs } = await db
    .from('pre_generated_briefs')
    .select('brief_content')
    .eq('client_id', clientId)
    .order('generated_at', { ascending: false })
    .limit(5)

  const recentFormats = (recentBriefs || [])
    .map((b: any) => b.brief_content?.format)
    .filter(Boolean)

  return {
    business_name: profile?.business_name || 'Unknown Creator',
    brand_tone: profile?.brand_tone || [],
    content_strategy_summary: profile?.content_strategy_summary || '',
    recommended_hooks: profile?.recommended_hooks || [],
    recent_formats: recentFormats,
  }
}

// ── Critic Agent ────────────────────────────────────────────────────────

async function runCritic(
  brief: GeneratedBrief,
  niche: string,
  thresholds: DpsThresholds,
  clientMemory: ClientMemory,
  apiKey: string,
  contextPrefix: string = '',
): Promise<CriticResult> {
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })

  const thresholdSource = thresholds.video_count > 0
    ? `Based on ${thresholds.video_count} scraped videos in this niche`
    : 'Using global averages (no niche-specific data available)'

  const recentFormatsNote = clientMemory.recent_formats.length > 0
    ? `Recent formats used by this creator: ${clientMemory.recent_formats.join(', ')}. Flag if the brief repeats a stale format.`
    : ''

  const prompt = `${contextPrefix}You are evaluating a content brief for the "${niche}" niche. Your job is to identify weaknesses using quantified evidence. Score against these DPS signal thresholds:

## DPS Signal Thresholds (${thresholdSource})
- Average completion rate: ${thresholds.avg_completion_rate.toFixed(3)}
- Average share rate: ${thresholds.avg_share_rate.toFixed(4)}
- Average save rate: ${thresholds.avg_save_rate.toFixed(4)}
- Average velocity score: ${thresholds.avg_velocity_score.toFixed(3)}

## Creator Context
- Name: ${clientMemory.business_name}
- Brand tone: ${clientMemory.brand_tone.join(', ') || 'not specified'}
- Strategy: ${clientMemory.content_strategy_summary || 'none'}
- Preferred hooks: ${clientMemory.recommended_hooks.join(', ') || 'none'}
${recentFormatsNote}

## Brief Under Evaluation
- Title: ${brief.title}
- Hook: ${brief.hook}
- Angle: ${brief.angle}
- Format: ${brief.format}
- Talking Points: ${brief.talking_points.join('; ')}
- CTA: ${brief.cta}
- Estimated VPS: ${brief.estimated_vps}

## Instructions
Attack the hook structure, pacing recommendation, format choice, and cultural timing. Be specific: which element is weakest and why, citing the threshold it falls below. Consider whether this brief would actually drive completion, shares, and saves above the niche averages.

If the brief contradicts the creator's brand tone or strategy, flag that as a weakness.

Return ONLY a JSON object (no markdown, no code fences):
{
  "score": <0-100 survival probability>,
  "objections": [
    { "element": "<hook_structure|pacing|format_choice|cultural_timing|brand_fit|cta|originality>", "weakness": "<specific description>", "threshold_violated": "<which metric and why>" }
  ],
  "summary": "<one sentence verdict>"
}`

  const start = Date.now()
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { temperature: 0.3 },
  })

  const text = result.text || ''
  const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()

  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) parsed = JSON.parse(match[0])
    else throw new Error('Failed to parse Critic response')
  }

  const latency = Date.now() - start
  console.log(`[Critic] Score: ${parsed.score}, Objections: ${(parsed.objections || []).length}, Latency: ${latency}ms`)

  return {
    score: Math.max(0, Math.min(100, parsed.score || 0)),
    objections: (parsed.objections || []).map((o: any) => ({
      element: o.element || 'unknown',
      weakness: o.weakness || '',
      threshold_violated: o.threshold_violated || undefined,
    })),
    summary: parsed.summary || '',
  }
}

// ── Synthesizer Agent ───────────────────────────────────────────────────

async function runSynthesizer(
  originalBrief: GeneratedBrief,
  criticResult: CriticResult,
  niche: string,
  clientMemory: ClientMemory,
  apiKey: string,
  contextPrefix: string = '',
): Promise<GeneratedBrief> {
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })

  const objectionsText = criticResult.objections.map((o, i) =>
    `${i + 1}. [${o.element}] ${o.weakness}${o.threshold_violated ? ` (${o.threshold_violated})` : ''}`
  ).join('\n')

  const prompt = `${contextPrefix}You are a content brief Synthesizer. A Critic has identified specific weaknesses in a draft brief. Your job is to rewrite the brief to address every objection while preserving the creative core.

## Original Brief
- Title: ${originalBrief.title}
- Hook: ${originalBrief.hook}
- Angle: ${originalBrief.angle}
- Format: ${originalBrief.format}
- Talking Points: ${originalBrief.talking_points.join('; ')}
- CTA: ${originalBrief.cta}
- Reasoning: ${originalBrief.reasoning}

## Critic Score: ${criticResult.score}/100
## Critic Objections
${objectionsText}

## Critic Verdict
${criticResult.summary}

## Creator Context
- Niche: ${niche}
- Brand tone: ${clientMemory.brand_tone.join(', ') || 'not specified'}
- Strategy: ${clientMemory.content_strategy_summary || 'none'}
- Preferred hooks: ${clientMemory.recommended_hooks.join(', ') || 'none'}

## Instructions
Rewrite the brief to resolve EACH objection specifically. Do not produce vague improvements — address the exact weaknesses cited. If the Critic and the original Generator disagree (e.g. Critic says format is wrong but Generator chose it for a reason), resolve the contradiction by picking the approach that best serves this specific creator's audience and tone, and explain your resolution in the reasoning field.

Keep the same JSON structure. Return ONLY a JSON object (no markdown, no code fences):
{
  "title": "...",
  "hook": "...",
  "angle": "...",
  "format": "...",
  "talking_points": ["..."],
  "cta": "...",
  "estimated_vps": <0-100>,
  "reasoning": "... (include what you changed and why)"
}`

  const start = Date.now()
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { temperature: 0.5 },
  })

  const text = result.text || ''
  const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()

  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) parsed = JSON.parse(match[0])
    else throw new Error('Failed to parse Synthesizer response')
  }

  const latency = Date.now() - start
  console.log(`[Synthesizer] Revised brief "${parsed.title}", Latency: ${latency}ms`)

  return {
    title: parsed.title || originalBrief.title,
    hook: parsed.hook || originalBrief.hook,
    angle: parsed.angle || originalBrief.angle,
    format: parsed.format || originalBrief.format,
    talking_points: parsed.talking_points || originalBrief.talking_points,
    cta: parsed.cta || originalBrief.cta,
    estimated_vps: Math.max(0, Math.min(100, parsed.estimated_vps || originalBrief.estimated_vps)),
    reasoning: parsed.reasoning || originalBrief.reasoning,
  }
}

// ── Main Entry Point ────────────────────────────────────────────────────

/**
 * Adversarial evaluation pipeline for a generated brief.
 *
 * Runs up to 3 Critic rounds. If Critic scores < 60, Synthesizer rewrites
 * and the brief is re-evaluated. Returns the final brief with all evaluation
 * metadata.
 *
 * Does NOT insert into the database — the caller handles that.
 * The caller should insert evaluation rounds into brief_evaluations AFTER
 * inserting the brief (since we need the brief_id FK).
 */
export async function adversarialEvaluateBrief(
  brief: GeneratedBrief,
  niche: string,
  clientId: string,
  db: SupabaseClient,
  agencyId?: string,
): Promise<AdversarialResult> {
  const apiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    // No API key — skip adversarial evaluation entirely
    console.log('[Adversarial] No Gemini API key, skipping evaluation')
    return {
      brief,
      rounds: [],
      final_critic_score: 0,
      adversarial_rounds: 0,
      low_confidence: false,
      original_vps: brief.estimated_vps,
      final_vps: brief.estimated_vps,
    }
  }

  // Load niche thresholds, client memory, and centralized context in parallel
  const contextPromise = agencyId
    ? assembleContext(db, agencyId, 'AdversarialCritic', clientId)
    : Promise.resolve(null)

  const [thresholds, clientMemory, centralContext] = await Promise.all([
    getNicheThresholds(db, niche),
    loadClientMemory(db, clientId, niche),
    contextPromise,
  ])

  const contextPrefix = centralContext?.systemPrompt
    ? `${centralContext.systemPrompt}\n\n`
    : ''

  const MAX_ROUNDS = 3
  const PASS_THRESHOLD = 60
  const rounds: EvaluationRound[] = []
  let currentBrief = { ...brief }
  const originalVps = brief.estimated_vps

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    // Run Critic
    let criticResult: CriticResult
    try {
      criticResult = await runCritic(currentBrief, niche, thresholds, clientMemory, apiKey, contextPrefix)
    } catch (err: any) {
      console.error(`[Adversarial] Critic failed round ${round}:`, err.message)
      // If Critic fails, pass the brief through — don't block on evaluation errors
      rounds.push({
        round_number: round,
        critic_score: 0,
        objections: [{ element: 'system', weakness: `Critic error: ${err.message}` }],
        revised: false,
      })
      break
    }

    const passed = criticResult.score >= PASS_THRESHOLD
    const isLastRound = round === MAX_ROUNDS

    if (passed || isLastRound) {
      // Brief passes or we've exhausted rounds — record and stop
      rounds.push({
        round_number: round,
        critic_score: criticResult.score,
        objections: criticResult.objections,
        revised: false,
      })
      break
    }

    // Score < 60 and rounds remaining — Synthesizer rewrites
    let revisedBrief: GeneratedBrief
    try {
      revisedBrief = await runSynthesizer(currentBrief, criticResult, niche, clientMemory, apiKey, contextPrefix)
    } catch (err: any) {
      console.error(`[Adversarial] Synthesizer failed round ${round}:`, err.message)
      rounds.push({
        round_number: round,
        critic_score: criticResult.score,
        objections: criticResult.objections,
        revised: false,
      })
      break
    }

    rounds.push({
      round_number: round,
      critic_score: criticResult.score,
      objections: criticResult.objections,
      revised: true,
    })

    currentBrief = revisedBrief
  }

  const lastRound = rounds[rounds.length - 1]
  const finalScore = lastRound?.critic_score ?? 0
  const lowConfidence = finalScore < PASS_THRESHOLD && rounds.length >= MAX_ROUNDS

  if (lowConfidence) {
    console.log(`[Adversarial] Brief "${currentBrief.title}" flagged as low confidence after ${rounds.length} rounds (score: ${finalScore})`)
  }

  return {
    brief: currentBrief,
    rounds,
    final_critic_score: finalScore,
    adversarial_rounds: rounds.length,
    low_confidence: lowConfidence,
    original_vps: originalVps,
    final_vps: currentBrief.estimated_vps,
  }
}

// ── Database Helper: Store Evaluation Rounds ────────────────────────────

/**
 * Inserts evaluation rounds into brief_evaluations table.
 * Call this AFTER inserting the brief into pre_generated_briefs (need brief_id).
 */
export async function storeEvaluationRounds(
  db: SupabaseClient,
  briefId: number,
  rounds: EvaluationRound[],
): Promise<void> {
  if (rounds.length === 0) return

  const rows = rounds.map(r => ({
    brief_id: briefId,
    round_number: r.round_number,
    critic_score: r.critic_score,
    objections: r.objections,
    revised: r.revised,
  }))

  const { error } = await db.from('brief_evaluations').insert(rows)
  if (error) {
    console.error(`[Adversarial] Failed to store evaluation rounds for brief ${briefId}:`, error.message)
  }
}
