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
import { createClient, SupabaseClient } from '@supabase/supabase-js'

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

// ── Batch processing — timeout-safe, resumable, idempotent ───────────────
//
// The classifier pulls ONLY detected_trends with classification_status =
// 'pending', in batches of CLASSIFY_BATCH_SIZE, and marks each trend
// 'completed' / 'failed' as it goes. A trend is never re-classified once
// 'completed', so reruns cannot create duplicate cultural_events.

const CLASSIFY_BATCH_SIZE = Math.max(1, parseInt(process.env.CLASSIFY_BATCH_SIZE || '10', 10))
const CLASSIFY_STALE_MS = Math.max(60000, parseInt(process.env.CLASSIFY_STALE_MS || '600000', 10))

/** Update a trend's classification status (classified_at doubles as last-touch time). */
async function markTrend(db: SupabaseClient, id: number, status: 'pending' | 'processing' | 'completed' | 'failed') {
  const { error } = await db
    .from('detected_trends')
    .update({ classification_status: status, classified_at: new Date().toISOString() })
    .eq('id', id)
  if (error) console.error(`[EventClassifier] mark ${status} failed for trend ${id}:`, error.message)
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

  console.log(`[EventClassifier] START batch_size=${CLASSIFY_BATCH_SIZE}${targetNiche ? ` niche=${targetNiche}` : ''}`)

  // Reclaim trends stuck in 'processing' from a crashed/killed run so they retry.
  const staleCutoff = new Date(Date.now() - CLASSIFY_STALE_MS).toISOString()
  {
    let reclaim = db.from('detected_trends')
      .update({ classification_status: 'pending', classified_at: new Date().toISOString() })
      .eq('classification_status', 'processing').lt('classified_at', staleCutoff)
    if (targetNiche) reclaim = reclaim.eq('niche', targetNiche)
    const { error: reclaimErr } = await reclaim
    if (reclaimErr) console.error('[EventClassifier] stale reclaim failed:', reclaimErr.message)
  }

  // Pull ONLY pending trends, newest first, capped at the batch size.
  let query = db
    .from('detected_trends')
    .select('id, niche, trend_summary, velocity_score, confidence, sources, evidence, detected_date')
    .eq('classification_status', 'pending')
    .order('detected_date', { ascending: false })
    .limit(CLASSIFY_BATCH_SIZE)
  if (targetNiche) query = query.eq('niche', targetNiche)

  const { data: pendingTrends, error: fetchErr } = await query

  if (fetchErr) {
    console.error('[EventClassifier] fetch pending trends failed:', fetchErr.message)
    return NextResponse.json(
      { success: false, error: fetchErr.message, classified: 0, elapsed_ms: Date.now() - startTime },
      { status: 500 },
    )
  }

  if (!pendingTrends || pendingTrends.length === 0) {
    console.log('[EventClassifier] COMPLETE — no pending trends to classify')
    return NextResponse.json({
      success: true,
      message: 'No pending trends to classify',
      trends_found: 0,
      classified: 0,
      auto_approved: 0,
      failed: 0,
      skipped: 0,
      remaining: 0,
      more: false,
      done: true,
      elapsed_ms: Date.now() - startTime,
    })
  }

  console.log(`[EventClassifier] FOUND ${pendingTrends.length} pending trend(s)`)

  // Claim this batch (pending -> processing) so overlapping runs don't double-classify.
  const ids = pendingTrends.map(t => t.id)
  const { data: claimedRows, error: claimErr } = await db
    .from('detected_trends')
    .update({ classification_status: 'processing', classified_at: new Date().toISOString() })
    .in('id', ids)
    .eq('classification_status', 'pending')
    .select('id')
  if (claimErr) console.error('[EventClassifier] claim failed:', claimErr.message)
  const claimedIds = new Set<number>((claimedRows || []).map((r: any) => r.id))
  let toProcess = pendingTrends.filter(t => claimedIds.has(t.id))
  const skipped = pendingTrends.length - toProcess.length
  if (skipped > 0) console.log(`[EventClassifier] SKIP ${skipped} trend(s) — claimed by another run`)

  // Idempotency guard: drop any claimed trend that already has a cultural_event
  // (e.g. a prior run inserted the event but didn't mark the trend completed).
  if (toProcess.length > 0) {
    const { data: existing } = await db
      .from('cultural_events')
      .select('source_trend_ids')
      .overlaps('source_trend_ids', toProcess.map(t => t.id))
    const alreadyHas = new Set<number>()
    ;(existing || []).forEach((e: any) => (e.source_trend_ids || []).forEach((id: number) => alreadyHas.add(id)))
    if (alreadyHas.size > 0) {
      for (const t of toProcess.filter(t => alreadyHas.has(t.id))) await markTrend(db, t.id, 'completed')
      toProcess = toProcess.filter(t => !alreadyHas.has(t.id))
      console.log(`[EventClassifier] ${alreadyHas.size} trend(s) already had events — marked completed, skipping`)
    }
  }

  const errors: string[] = []
  let classified = 0
  let autoApproved = 0
  let failed = 0
  const nichesSeen = new Set<string>()

  if (toProcess.length > 0) {
    let events: any[] | null = null
    try {
      events = await classifyTrends(toProcess)
    } catch (err: any) {
      // Whole-batch LLM failure is transient — release the claim so the next run retries.
      errors.push(`Classification call failed: ${err?.message}`)
      console.error('[EventClassifier] classifyTrends failed, releasing batch back to pending:', err?.message)
      for (const t of toProcess) await markTrend(db, t.id, 'pending')
    }

    if (events) {
      for (let i = 0; i < toProcess.length; i++) {
        const trend = toProcess[i]
        const event = events[i]
        nichesSeen.add(trend.niche)

        // One trend failing must NOT abort the rest of the batch.
        if (!event) {
          await markTrend(db, trend.id, 'failed')
          failed++
          errors.push(`${trend.niche}/trend#${trend.id}: no classification returned`)
          console.warn(`[EventClassifier] FAIL trend#${trend.id} (${trend.niche}) — no classification returned`)
          continue
        }

        try {
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
            await markTrend(db, trend.id, 'failed')
            failed++
            errors.push(`${trend.niche}/${event.event_title}: ${insertErr.message}`)
            console.warn(`[EventClassifier] FAIL trend#${trend.id} (${trend.niche}) — insert error: ${insertErr.message}`)
          } else {
            await markTrend(db, trend.id, 'completed')
            classified++
            if (shouldAutoApprove) autoApproved++
            console.log(`[EventClassifier] DONE trend#${trend.id} (${trend.niche}) -> "${event.event_title}"${shouldAutoApprove ? ' [auto-approved]' : ''}`)
          }
        } catch (err: any) {
          await markTrend(db, trend.id, 'failed')
          failed++
          errors.push(`${trend.niche}/trend#${trend.id}: ${err?.message}`)
          console.error(`[EventClassifier] ERROR trend#${trend.id} (${trend.niche}):`, err?.message)
        }
      }
    }
  }

  // How many pending trends remain after this batch?
  let remainingQuery = db.from('detected_trends').select('id', { count: 'exact', head: true }).eq('classification_status', 'pending')
  if (targetNiche) remainingQuery = remainingQuery.eq('niche', targetNiche)
  const { count: remaining } = await remainingQuery
  const remainingCount = remaining ?? 0

  const elapsed = Date.now() - startTime
  console.log(`[EventClassifier] COMPLETE — classified=${classified} auto_approved=${autoApproved} failed=${failed} skipped=${skipped} remaining=${remainingCount} elapsed_ms=${elapsed}`)

  return NextResponse.json({
    success: true,
    batch_size: CLASSIFY_BATCH_SIZE,
    trends_found: pendingTrends.length,
    // Legacy fields preserved for src/lib/cron/scheduler.ts logging.
    niches_processed: nichesSeen.size,
    classified,
    auto_approved: autoApproved,
    needs_review: classified - autoApproved,
    auto_approve_threshold: AUTO_APPROVE_THRESHOLD,
    // Batch observability.
    failed,
    skipped,
    remaining: remainingCount,
    more: remainingCount > 0,
    done: remainingCount === 0,
    elapsed_ms: elapsed,
    errors: errors.length > 0 ? errors : undefined,
  })
}
