/**
 * consolidate-agency-memory — Nightly Memory Consolidation
 * Atlas subsystem — Memory Keeper agent
 *
 * GET /api/cron/consolidate-memory                  — process all active agencies
 * GET /api/cron/consolidate-memory?agency_id=UUID   — process one agency
 *
 * Runs at 05:00 UTC (after autoDream completes at 04:00).
 *
 * Per agency:
 * 1. Load new memory_extractions from last 24 hours
 * 2. Load existing hot memory
 * 3. LLM consolidation call — merge, resolve contradictions, enforce token budget
 * 4. Update tiers based on LLM output
 * 5. Apply cold demotion rules (reference_count < 2 AND older than 90 days)
 * 6. Enforce 2000-token hard ceiling on hot memory
 * 7. Log to memory_consolidation_log
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// ── Types ───────────────────────────────────────────────────────────────

interface MemoryFact {
  id: number
  agency_id: string
  fact: string
  source: string
  tier: string
  confidence: number
  reference_count: number
  superseded_by: number | null
  created_at: string
  updated_at: string
}

interface AgencyConsolidationResult {
  agency_id: string
  agency_name: string
  facts_added: number
  facts_demoted: number
  facts_to_cold: number
  contradictions_resolved: number
  emergency_drops: number
  hot_memory_token_count: number
  error?: string
}

// ── Token Counting ──────────────────────────────────────────────────────

const TOKEN_BUDGET = 2000

/** Rough token estimate: ~4 chars per token for English text */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function estimateFactsTokens(facts: string[]): number {
  return facts.reduce((sum, f) => sum + estimateTokens(f), 0)
}

// ── LLM Consolidation ───────────────────────────────────────────────────

interface LabeledConsolidationResult {
  keep_hot: string[]      // labels like "hot_0", "new_1"
  demote: string[]        // labels to move to warm
  contradictions: Array<{
    old_label: string     // e.g. "hot_0"
    new_label: string     // e.g. "new_0"
    reason: string
  }>
}

async function runConsolidationLLM(
  newFacts: MemoryFact[],
  existingHotFacts: MemoryFact[],
): Promise<{ keepHotIds: number[]; demoteIds: number[]; contradictions: Array<{ oldId: number; newId: number }>; debug?: string }> {
  const allFacts = [...existingHotFacts, ...newFacts]

  // Build label → ID maps
  const labelToId = new Map<string, number>()
  existingHotFacts.forEach((f, i) => labelToId.set(`hot_${i}`, f.id))
  newFacts.forEach((f, i) => labelToId.set(`new_${i}`, f.id))

  const apiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return { keepHotIds: allFacts.map(f => f.id), demoteIds: [], contradictions: [] }
  }

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })

  const hotList = existingHotFacts.map((f, i) => `  hot_${i}: "${f.fact}"`).join('\n')
  const newList = newFacts.map((f, i) => `  new_${i}: "${f.fact}"`).join('\n')

  const prompt = `You are a memory consolidation agent. Analyze these facts and return decisions using the EXACT labels shown (hot_0, new_0, etc.).

## EXISTING HOT MEMORY (older):
${hotList || '  (empty)'}

## NEW FACTS (last 24h — MORE RECENT, override older facts on the same topic):
${newList || '  (empty)'}

## TASK:
1. CONTRADICTION CHECK: If a new fact says something DIFFERENT about the SAME TOPIC as an older fact, that is a CONTRADICTION. The new fact wins. You MUST report it.
   Contradiction examples:
   - "prefers follower count" vs "prefers engagement rate" → same topic (preferred metric), different values → CONTRADICTION
   - "best time is 6pm" vs "best time is 9am" → CONTRADICTION
   - "uses format A" vs "switched to format B" → CONTRADICTION
2. DEDUP: Near-duplicates → keep the newer/better version, demote the other.
3. TOKEN BUDGET: Final hot memory must be under ${TOKEN_BUDGET} tokens. Demote least important if over.

## RESPONSE — Return ONLY this JSON:
{
  "keep_hot": ["hot_0", "new_0"],
  "demote": ["hot_1"],
  "contradictions": [{"old_label": "hot_0", "new_label": "new_0", "reason": "new fact updates preferred metric"}]
}

Rules:
- Use ONLY the exact labels shown above (hot_0, hot_1, new_0, new_1, etc.)
- Contradicted facts go in contradictions AND must NOT be in keep_hot
- Return ONLY valid JSON, nothing else`

  const genResult = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { temperature: 0.1 },
  })

  const text = (genResult.text || '').replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
  console.log('[consolidate-memory] LLM response:', text.slice(0, 800))

  let parsed: LabeledConsolidationResult
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      parsed = JSON.parse(match[0])
    } else {
      throw new Error('LLM returned invalid JSON')
    }
  }

  if (!Array.isArray(parsed.keep_hot)) parsed.keep_hot = []
  if (!Array.isArray(parsed.demote)) parsed.demote = []
  if (!Array.isArray(parsed.contradictions)) parsed.contradictions = []

  // Resolve labels → real DB IDs
  const resolveId = (label: string): number | undefined => labelToId.get(label)

  const keepHotIds = parsed.keep_hot.map(resolveId).filter((id): id is number => id !== undefined)
  const demoteIds = parsed.demote.map(resolveId).filter((id): id is number => id !== undefined)
  const contradictions = parsed.contradictions
    .map(c => {
      const oldId = resolveId(c.old_label)
      const newId = resolveId(c.new_label)
      return oldId && newId ? { oldId, newId } : null
    })
    .filter((c): c is { oldId: number; newId: number } => c !== null)

  return { keepHotIds, demoteIds, contradictions, debug: text.slice(0, 800) }
}

// ── Process One Agency ──────────────────────────────────────────────────

async function consolidateAgency(
  db: SupabaseClient,
  agencyId: string,
  agencyName: string,
): Promise<AgencyConsolidationResult> {
  const result: AgencyConsolidationResult = {
    agency_id: agencyId,
    agency_name: agencyName,
    facts_added: 0,
    facts_demoted: 0,
    facts_to_cold: 0,
    contradictions_resolved: 0,
    emergency_drops: 0,
    hot_memory_token_count: 0,
  }

  try {
    // 1. Load new facts from last 24 hours
    const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    const { data: newFacts } = await db
      .from('memory_extractions')
      .select('*')
      .eq('agency_id', agencyId)
      .gte('created_at', since24h)
      .order('created_at', { ascending: true })

    // 2. Load existing hot memory
    const { data: hotFacts } = await db
      .from('memory_extractions')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('tier', 'hot')
      .is('superseded_by', null)
      .order('confidence', { ascending: false })

    const newFactRows = (newFacts || []) as MemoryFact[]
    const hotFactRows = (hotFacts || []) as MemoryFact[]

    // New facts created in last 24h are the "incoming" set.
    // Existing hot facts NOT in the new set are the "existing" hot context.
    const newIds = new Set(newFactRows.map(f => f.id))
    const trulyNewFacts = newFactRows  // all facts from last 24h are "new" for LLM purposes
    const existingHotFacts = hotFactRows.filter(f => !newIds.has(f.id))  // hot facts older than 24h

    // If zero new facts, skip LLM call entirely
    if (trulyNewFacts.length === 0) {
      const currentTokens = estimateFactsTokens(existingHotFacts.map(f => f.fact))
      result.hot_memory_token_count = currentTokens

      // Still apply cold demotion rules even with no new facts
      const coldDemoted = await applyColdDemotionRules(db, agencyId)
      result.facts_to_cold = coldDemoted

      // Log successful no-op run
      await logConsolidation(db, result)
      return result
    }

    result.facts_added = trulyNewFacts.length

    // 3. LLM consolidation call (new facts vs existing hot facts older than 24h)
    const llm = await runConsolidationLLM(trulyNewFacts, existingHotFacts)
    // debug: llm.debug contains raw LLM response for troubleshooting

    // 4. Handle contradictions — LLM-detected + code-level fallback
    const contradictionHandled = new Set<number>()

    // 4a. LLM-detected contradictions
    for (const c of llm.contradictions) {
      await db
        .from('memory_extractions')
        .update({
          tier: 'cold',
          superseded_by: c.newId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', c.oldId)
      contradictionHandled.add(c.oldId)
      contradictionHandled.add(c.newId)
      result.contradictions_resolved++
    }

    // 4b. Code-level contradiction fallback — catches cases the LLM misses.
    // Heuristic: if a new fact and an old fact share >60% of significant words
    // but differ (not identical), they're likely about the same topic with
    // different values → contradiction.
    const stopWords = new Set(['a', 'an', 'the', 'is', 'as', 'to', 'of', 'for', 'in', 'on', 'and', 'or', 'that', 'this', 'with'])
    const significantWords = (text: string) =>
      text.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w))

    // Fallback contradiction detection below

    for (const newFact of trulyNewFacts) {
      if (contradictionHandled.has(newFact.id)) continue
      for (const oldFact of existingHotFacts) {
        if (contradictionHandled.has(oldFact.id)) continue
        if (newFact.fact === oldFact.fact) continue // identical = duplicate, not contradiction

        const newWords = significantWords(newFact.fact)
        const oldWords = significantWords(oldFact.fact)
        const newSet = new Set(newWords)
        const oldSet = new Set(oldWords)
        const overlap = oldWords.filter(w => newSet.has(w)).length
        const overlapRatio = overlap / Math.max(oldWords.length, 1)
        // Debug: overlap check logged to console

        // >60% word overlap but not identical text = probable contradiction
        if (overlapRatio > 0.6) {
          console.log(`[consolidate-memory] Fallback contradiction detected: "${oldFact.fact}" → "${newFact.fact}" (overlap: ${(overlapRatio * 100).toFixed(0)}%)`)
          await db
            .from('memory_extractions')
            .update({
              tier: 'cold',
              superseded_by: newFact.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', oldFact.id)
          contradictionHandled.add(oldFact.id)
          contradictionHandled.add(newFact.id)
          result.contradictions_resolved++
        }
      }
    }

    // 5. Demote facts the LLM flagged
    for (const factId of llm.demoteIds) {
      if (contradictionHandled.has(factId)) continue
      await db
        .from('memory_extractions')
        .update({ tier: 'warm', updated_at: new Date().toISOString() })
        .eq('id', factId)
      result.facts_demoted++
    }

    // 6. Promote new facts to hot if LLM says keep them
    const keepHotSet = new Set(llm.keepHotIds)
    for (const factRow of trulyNewFacts) {
      if (contradictionHandled.has(factRow.id)) continue
      if (keepHotSet.has(factRow.id)) {
        await db
          .from('memory_extractions')
          .update({ tier: 'hot', updated_at: new Date().toISOString() })
          .eq('id', factRow.id)
      }
    }

    // 6. Apply cold demotion rules: reference_count < 2 AND older than 90 days
    const coldDemoted = await applyColdDemotionRules(db, agencyId)
    result.facts_to_cold += coldDemoted

    // 7. Token budget enforcement — reload hot memory after updates
    // Small delay to ensure Supabase read-after-write consistency
    await new Promise(r => setTimeout(r, 500))
    const { data: finalHot } = await db
      .from('memory_extractions')
      .select('id, fact, confidence')
      .eq('agency_id', agencyId)
      .eq('tier', 'hot')
      .order('confidence', { ascending: false })

    const finalHotRows = (finalHot || []) as Array<{ id: number; fact: string; confidence: number }>
    let currentTokens = estimateFactsTokens(finalHotRows.map(f => f.fact))

    if (currentTokens > TOKEN_BUDGET) {
      // Drop lowest-confidence facts until under budget
      // Facts are already sorted by confidence DESC, so drop from the end
      const sorted = [...finalHotRows].reverse() // lowest confidence first
      for (const fact of sorted) {
        if (currentTokens <= TOKEN_BUDGET) break
        await db
          .from('memory_extractions')
          .update({ tier: 'warm', updated_at: new Date().toISOString() })
          .eq('id', fact.id)
        currentTokens -= estimateTokens(fact.fact)
        result.emergency_drops++
      }
    }

    result.hot_memory_token_count = Math.max(0, currentTokens)

    // 8. Log consolidation run
    await logConsolidation(db, result)

  } catch (err: any) {
    result.error = err.message
    console.error(`[consolidate-memory] Agency ${agencyName} (${agencyId}): ${err.message}`)

    // Log the error — don't lose existing memory on failure
    try {
      await logConsolidation(db, result)
    } catch {}
  }

  return result
}

// ── Cold Demotion Rules ─────────────────────────────────────────────────

async function applyColdDemotionRules(
  db: SupabaseClient,
  agencyId: string,
): Promise<number> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString()

  // Find warm/hot facts with reference_count < 2 AND older than 90 days
  const { data: candidates } = await db
    .from('memory_extractions')
    .select('id')
    .eq('agency_id', agencyId)
    .in('tier', ['hot', 'warm'])
    .lt('reference_count', 2)
    .lt('created_at', ninetyDaysAgo)

  if (!candidates || candidates.length === 0) return 0

  const ids = candidates.map((c: any) => c.id)
  await db
    .from('memory_extractions')
    .update({ tier: 'cold', updated_at: new Date().toISOString() })
    .in('id', ids)

  return ids.length
}

// ── Consolidation Logging ───────────────────────────────────────────────

async function logConsolidation(
  db: SupabaseClient,
  result: AgencyConsolidationResult,
): Promise<void> {
  await db.from('memory_consolidation_log').insert({
    agency_id: result.agency_id,
    run_date: new Date().toISOString().split('T')[0],
    facts_added: result.facts_added,
    facts_demoted: result.facts_demoted,
    facts_to_cold: result.facts_to_cold,
    contradictions_resolved: result.contradictions_resolved,
    emergency_drops: result.emergency_drops,
    hot_memory_token_count: result.hot_memory_token_count,
    error_message: result.error || null,
    generated_by_agent: 'Memory Keeper',
  })
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

  console.log(`[consolidate-memory] Processing ${agencies.length} agency(ies)...`)

  const results: AgencyConsolidationResult[] = []
  let totalErrors = 0

  for (const agency of agencies) {
    console.log(`[consolidate-memory] Agency: ${agency.name} (${agency.id})`)
    const agencyResult = await consolidateAgency(db, agency.id, agency.name)
    results.push(agencyResult)
    if (agencyResult.error) totalErrors++
  }

  // Track job run
  try {
    await db.from('integration_job_runs').upsert({
      job: 'consolidate_memory',
      last_run: new Date().toISOString(),
    } as any)
  } catch {}

  const elapsed = Date.now() - startTime
  console.log(`[consolidate-memory] Done in ${(elapsed / 1000).toFixed(1)}s — ${results.length} agencies, ${totalErrors} errors`)

  return NextResponse.json({
    success: true,
    agencies_processed: results.length,
    total_facts_added: results.reduce((s, r) => s + r.facts_added, 0),
    total_facts_demoted: results.reduce((s, r) => s + r.facts_demoted, 0),
    total_facts_to_cold: results.reduce((s, r) => s + r.facts_to_cold, 0),
    total_contradictions: results.reduce((s, r) => s + r.contradictions_resolved, 0),
    total_emergency_drops: results.reduce((s, r) => s + r.emergency_drops, 0),
    elapsed_ms: elapsed,
    results,
    errors: totalErrors > 0 ? results.filter(r => r.error).map(r => `${r.agency_name}: ${r.error}`) : undefined,
  })
}
