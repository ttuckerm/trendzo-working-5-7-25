/**
 * Prompt 44 — Insight phraser.
 *
 * Converts a StatFinding into human-readable insight_text. Two paths:
 *
 *   1. Template path (always available, deterministic).
 *      Uses the template_slots from the finding to format a stock
 *      sentence per insight_type. This is what runs when:
 *        - NETWORK_INTELLIGENCE_LLM=false is set
 *        - GOOGLE_AI_API_KEY / GOOGLE_GEMINI_AI_API_KEY are missing
 *        - The LLM output fails validation (see below)
 *
 *   2. LLM path via @google/genai + gemini-2.5-flash.
 *      Given the statistical payload as structured JSON, the LLM is
 *      asked to produce a 1-2 sentence insight that MUST NOT invent
 *      numbers. The output is then validated: every number found in
 *      the text is matched against a number in the input within 1%
 *      tolerance. If validation fails → fallback to template.
 *
 * The LLM is a phrasing layer, never a statistical source.
 */

import type { StatFinding } from './analyzer'

// Evaluated at call time (not module-load) so tests and scheduler
// toggles can control LLM behavior via env without import ordering
// gymnastics.
function isLlmEnabled(): boolean {
  return process.env.NETWORK_INTELLIGENCE_LLM !== 'false'
}
const LLM_MODEL = 'gemini-2.5-flash'

export interface PhraseResult {
  text: string
  model: string | null
  fallback_reason?: string
}

// ── Templates ──────────────────────────────────────────────────────────
function templateText(f: StatFinding): string {
  const s = f.template_slots
  switch (f.type) {
    case 'timing_optimization':
      return (
        `In the "${s.niche}" niche, posts scheduled around hours ${s.top_hours_utc} (UTC) ` +
        `show ${s.uplift_pct}% higher VPS than the niche average ` +
        `(Spearman ρ=${s.rho}, n=${s.n}, agencies=${s.agency_count}).`
      )
    case 'format_effectiveness':
      return (
        `In the "${s.niche}" niche, ${s.best_bucket}-form videos outperform other lengths ` +
        `by ${s.uplift_pct}% on average ` +
        `(Welch t=${s.t}, n=${s.n}, agencies=${s.agency_count}).`
      )
    case 'retention_correlation':
      return (
        `In the "${s.niche}" niche, ${s.direction} ` +
        `(Spearman ρ=${s.rho}, n=${s.n}, agencies=${s.agency_count}).`
      )
    case 'posting_frequency':
      return (
        `In the "${s.niche}" niche, VPS peaks around ${s.peak_freq} posts per creator per week, ` +
        `with diminishing returns beyond that frequency ` +
        `(quadratic R²=${s.r2}, n=${s.n}, agencies=${s.agency_count}).`
      )
    default:
      return `Finding for ${f.niche_scope}`
  }
}

// ── LLM path ───────────────────────────────────────────────────────────
async function llmText(f: StatFinding): Promise<PhraseResult> {
  const key =
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_GEMINI_AI_API_KEY ||
    null
  if (!key) {
    return {
      text: templateText(f),
      model: null,
      fallback_reason: 'no_api_key',
    }
  }

  // Lazy import — keeps server cold start fast when LLM disabled.
  let GoogleGenAI: any
  try {
    GoogleGenAI = (await import('@google/genai')).GoogleGenAI
  } catch {
    return {
      text: templateText(f),
      model: null,
      fallback_reason: 'sdk_not_installed',
    }
  }

  const ai = new GoogleGenAI({ apiKey: key })
  const prompt =
    `You are paraphrasing a pre-computed statistical finding into a single 1-2 sentence insight ` +
    `for an enterprise dashboard. You MUST NOT invent numbers. Every number in your output must ` +
    `appear in the input data. Do not mention specific agency names or ids. Do not add caveats. ` +
    `Do not use more than 2 sentences.\n\n` +
    `Finding type: ${f.type}\n` +
    `Niche: ${f.niche_scope}\n` +
    `Supporting agencies: ${f.supporting_agency_count}\n` +
    `Supporting runs: ${f.supporting_run_count}\n` +
    `Statistical payload JSON:\n${JSON.stringify(f.payload, null, 2)}\n`

  let text = ''
  try {
    const res = await ai.models.generateContent({
      model: LLM_MODEL,
      contents: prompt,
    })
    text = (res?.text || res?.response?.text?.() || '').toString().trim()
  } catch (err) {
    return {
      text: templateText(f),
      model: null,
      fallback_reason: `llm_error:${err instanceof Error ? err.message.slice(0, 80) : 'unknown'}`,
    }
  }

  if (!text) {
    return { text: templateText(f), model: null, fallback_reason: 'empty_output' }
  }

  // Hallucination check: every number the LLM mentioned must match
  // a number in the finding payload OR the supporting counts within 1%.
  const allowedNumbers = collectNumbers(f)
  const mentionedNumbers = Array.from(text.matchAll(/-?\d+(?:\.\d+)?/g)).map((m) => Number(m[0]))
  for (const n of mentionedNumbers) {
    if (!Number.isFinite(n)) continue
    const ok = allowedNumbers.some((a) => {
      if (a === 0) return n === 0
      return Math.abs((n - a) / a) <= 0.01
    })
    if (!ok) {
      return {
        text: templateText(f),
        model: null,
        fallback_reason: `hallucinated_number:${n}`,
      }
    }
  }

  return { text, model: LLM_MODEL }
}

function collectNumbers(f: StatFinding): number[] {
  const out: number[] = [
    f.supporting_agency_count,
    f.supporting_run_count,
    f.p_value,
    f.confidence,
  ]
  const walk = (v: unknown) => {
    if (typeof v === 'number' && Number.isFinite(v)) out.push(v)
    else if (Array.isArray(v)) for (const x of v) walk(x)
    else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x)
  }
  walk(f.payload)
  walk(f.template_slots)
  return out
}

// ── Public entrypoint ──────────────────────────────────────────────────
export async function phraseFinding(f: StatFinding): Promise<PhraseResult> {
  if (!isLlmEnabled()) {
    return { text: templateText(f), model: null, fallback_reason: 'llm_disabled' }
  }
  return llmText(f)
}
