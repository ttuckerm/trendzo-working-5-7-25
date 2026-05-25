/**
 * Event Classifier — Converts detected_trends → cultural_events
 * Atlas subsystem 4 — Cultural Intelligence Pipeline
 *
 * GET /api/cron/classify-events              — classify all unprocessed trends
 * GET /api/cron/classify-events?niche=fitness — classify for one niche
 *
 * For each detected trend:
 * 1. Classifies by taxonomy (who/what/where/when/why/how)
 * 2. Estimates decay rate (how long until irrelevant)
 * 3. Determines which niches it activates
 * 4. Extracts keyword triggers for the prediction pipeline
 * 5. Auto-approves above confidence threshold (0.8)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const AUTO_APPROVE_THRESHOLD = 0.8

// ── Job-run monitoring ─────────────────────────────────────────────────

/**
 * Records that this cron invocation ran, updating integration_job_runs.last_run.
 * Called on every invocation BEFORE any work so monitoring stays observable
 * regardless of which code path the handler takes. Surfaces Supabase errors
 * instead of failing silently.
 */
async function recordJobRun(jobName: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) return

  const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  const { error } = await db
    .from('integration_job_runs')
    .upsert({ job: jobName, last_run: new Date().toISOString() } as any)

  if (error) {
    console.error(`[recordJobRun] Failed to record run for "${jobName}":`, error.message)
  }
}

// ── All known niches for cross-niche activation ────────────────────────

const ALL_NICHES = [
  'side-hustles', 'personal-finance', 'fitness', 'business', 'food-nutrition',
  'beauty', 'real-estate', 'self-improvement', 'dating', 'education',
  'career', 'parenting', 'tech', 'fashion', 'health',
  'cooking', 'psychology', 'travel', 'diy', 'language',
]

// ── LLM Classification ─────────────────────────────────────────────────

interface ClassifiedEvent {
  event_title: string
  event_summary: string
  taxonomy: {
    who: string
    what: string
    where: string
    when: string
    why: string
    how: string
  }
  decay_rate: number
  activated_niches: string[]
  keywords: string[]
  expires_in_days: number
}

async function classifyTrends(
  trends: Array<{ id: number; niche: string; trend_summary: string; velocity_score: number; confidence: number; sources: string[]; evidence: any[] }>
): Promise<ClassifiedEvent[]> {
  const apiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('No Gemini API key')

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })

  const trendDescriptions = trends.map((t, i) =>
    `${i + 1}. [${t.niche}] (velocity: ${t.velocity_score}, confidence: ${t.confidence}) ${t.trend_summary}\n   Sources: ${(t.sources || []).join(', ')}`
  ).join('\n')

  const prompt = `You are a cultural intelligence classifier for a content creation platform. Classify each detected trend into an actionable cultural event.

## Detected Trends
${trendDescriptions}

## Available Niches
${ALL_NICHES.join(', ')}

## For each trend, produce a classified event with:
- "event_title": Short, punchy title (5-10 words, like a headline)
- "event_summary": 1-2 sentence actionable summary for content creators
- "taxonomy": Classification object with:
  - "who": Who is involved/affected? (audience, demographics, influencers)
  - "what": What is the core event/trend? (be specific)
  - "where": Where is this happening? (platforms, regions, communities)
  - "when": When is this relevant? (this week, this month, seasonal, evergreen)
  - "why": Why does this matter for content creators?
  - "how": How should creators respond? (content angle, format suggestion)
- "decay_rate": 0.0-1.0 (0.0=evergreen/months, 0.3=weeks, 0.5=days, 0.8=hours, 1.0=already expired)
- "activated_niches": Array of niche keys this event is relevant to (can span multiple niches)
- "keywords": Array of 5-10 lowercase keywords that would appear in video captions/hashtags matching this event
- "expires_in_days": Estimated days until this event is no longer relevant (1-90)

Return ONLY a JSON array (no markdown, no code fences).`

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { temperature: 0.3 },
  })

  const text = result.text || ''
  const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
    throw new Error('Failed to parse classification response')
  }
}

// ── Main Handler ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const targetNiche = searchParams.get('niche') || null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 })
  }

  // Record this invocation immediately so monitoring sees every run,
  // even when there are no trends to classify (early returns below).
  await recordJobRun('event_classifier')

  const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  const startTime = Date.now()

  // Fetch detected trends that haven't been classified yet
  // (no matching cultural_event with same source_trend_id)
  let query = db
    .from('detected_trends')
    .select('id, niche, trend_summary, velocity_score, confidence, sources, evidence, detected_date')
    .order('detected_date', { ascending: false })
    .limit(20)

  if (targetNiche) {
    query = query.eq('niche', targetNiche)
  }

  const { data: trends, error: fetchErr } = await query

  if (fetchErr || !trends || trends.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No trends to classify',
      classified: 0,
      elapsed_ms: Date.now() - startTime,
    })
  }

  // Filter out trends that already have corresponding cultural_events
  const trendIds = trends.map(t => t.id)
  const { data: existingEvents } = await db
    .from('cultural_events')
    .select('source_trend_ids')

  const alreadyClassifiedIds = new Set<number>()
  ;(existingEvents || []).forEach((e: any) => {
    ;(e.source_trend_ids || []).forEach((id: number) => alreadyClassifiedIds.add(id))
  })

  const unclassified = trends.filter(t => !alreadyClassifiedIds.has(t.id))

  if (unclassified.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'All trends already classified',
      classified: 0,
      elapsed_ms: Date.now() - startTime,
    })
  }

  console.log(`[EventClassifier] Classifying ${unclassified.length} trends...`)

  const errors: string[] = []
  let classified = 0
  let autoApproved = 0

  try {
    const events = await classifyTrends(unclassified)

    for (let i = 0; i < events.length && i < unclassified.length; i++) {
      const event = events[i]
      const trend = unclassified[i]

      const shouldAutoApprove = trend.confidence >= AUTO_APPROVE_THRESHOLD
      const expiresAt = new Date(Date.now() + (event.expires_in_days || 7) * 24 * 3600 * 1000).toISOString()

      const { error: insertErr } = await db
        .from('cultural_events')
        .insert({
          niche: trend.niche,
          event_title: event.event_title,
          event_summary: event.event_summary,
          taxonomy_classification: event.taxonomy || {},
          velocity_score: trend.velocity_score,
          confidence: trend.confidence,
          decay_rate_estimate: Math.max(0, Math.min(1, event.decay_rate || 0.3)),
          activated_niches: event.activated_niches || [trend.niche],
          source_trend_ids: [trend.id],
          keywords: event.keywords || [],
          status: shouldAutoApprove ? 'approved' : 'detected',
          auto_approved: shouldAutoApprove,
          reviewed_at: shouldAutoApprove ? new Date().toISOString() : null,
          reviewed_by: shouldAutoApprove ? 'auto' : null,
          expires_at: expiresAt,
          generated_by_agent: 'Trend Scout',
        })

      if (insertErr) {
        errors.push(`${trend.niche}/${event.event_title}: ${insertErr.message}`)
      } else {
        classified++
        if (shouldAutoApprove) autoApproved++
      }
    }
  } catch (err: any) {
    errors.push(`Classification failed: ${err.message}`)
  }

  const elapsed = Date.now() - startTime
  console.log(`[EventClassifier] Done: ${classified} classified, ${autoApproved} auto-approved in ${(elapsed / 1000).toFixed(1)}s`)

  return NextResponse.json({
    success: true,
    trends_found: unclassified.length,
    classified,
    auto_approved: autoApproved,
    needs_review: classified - autoApproved,
    auto_approve_threshold: AUTO_APPROVE_THRESHOLD,
    elapsed_ms: elapsed,
    errors: errors.length > 0 ? errors : undefined,
  })
}
