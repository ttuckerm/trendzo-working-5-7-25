/**
 * Brief Variant Generator — A/B/C Testing Pipeline
 *
 * Given a primary brief (Variant A), generates two alternatives:
 * - Variant B: same concept, different hook structure
 * - Variant C: same concept, different format/pacing
 *
 * Each variant is independently scored with VPS.
 * Results stored in brief_variants table for operator choice tracking.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ── Types ───────────────────────────────────────────────────────────────

export interface BriefContent {
  title: string
  hook: string
  angle: string
  format: string
  talking_points: string[]
  cta: string
  estimated_vps: number
  reasoning: string
}

export interface VariantResult {
  variant_label: 'A' | 'B' | 'C'
  brief_content: BriefContent
  vps_score: number
  feature_dimensions_varied: Record<string, string>
}

export interface VariantGenerationResult {
  variants: VariantResult[]
  llm_calls: number
}

// ── Hook Type Alternatives ──────────────────────────────────────────────

const HOOK_TYPES = [
  'question',
  'shock_stat',
  'bold_claim',
  'story_opener',
  'direct_challenge',
  'curiosity_gap',
  'hot_take',
  'myth_bust',
]

function inferHookType(hook: string): string {
  const lower = hook.toLowerCase()
  if (lower.includes('?')) return 'question'
  if (/\d+%|\d+ out of/.test(lower)) return 'shock_stat'
  if (/stop |don't |never |you're wrong/.test(lower)) return 'direct_challenge'
  if (/nobody|no one|secret|hidden/.test(lower)) return 'curiosity_gap'
  if (/i |when i |last week|yesterday/.test(lower)) return 'story_opener'
  if (/myth|lie|fake|wrong/.test(lower)) return 'myth_bust'
  if (/hot take|unpopular|controversial/.test(lower)) return 'hot_take'
  return 'bold_claim'
}

function pickAlternativeHookType(current: string): string {
  const alternatives = HOOK_TYPES.filter(h => h !== current)
  return alternatives[Math.floor(Math.random() * alternatives.length)]
}

// ── Format/Pacing Alternatives ──────────────────────────────────────────

const FORMAT_TYPES = [
  'talking_head',
  'pov',
  'b_roll_montage',
  'before_after',
  'screen_share',
  'interview_style',
  'day_in_the_life',
  'tutorial_walkthrough',
]

function inferFormat(format: string): string {
  const lower = format.toLowerCase().replace(/[^a-z_\s]/g, '')
  if (/pov|point.of.view/.test(lower)) return 'pov'
  if (/b.roll|montage/.test(lower)) return 'b_roll_montage'
  if (/before.after|transformation/.test(lower)) return 'before_after'
  if (/screen.share|screencast/.test(lower)) return 'screen_share'
  if (/interview/.test(lower)) return 'interview_style'
  if (/day.in|vlog/.test(lower)) return 'day_in_the_life'
  if (/tutorial|walkthrough|how.to/.test(lower)) return 'tutorial_walkthrough'
  return 'talking_head'
}

function pickAlternativeFormat(current: string): string {
  const alternatives = FORMAT_TYPES.filter(f => f !== current)
  return alternatives[Math.floor(Math.random() * alternatives.length)]
}

const HOOK_TYPE_LABELS: Record<string, string> = {
  question: 'a question that creates curiosity',
  shock_stat: 'a shocking statistic or number',
  bold_claim: 'a bold, attention-grabbing claim',
  story_opener: 'a personal story or anecdote opener',
  direct_challenge: 'a direct challenge to the viewer',
  curiosity_gap: 'a curiosity gap (hint at hidden knowledge)',
  hot_take: 'a controversial hot take',
  myth_bust: 'a myth-busting opener',
}

const FORMAT_LABELS: Record<string, string> = {
  talking_head: 'talking head (direct to camera)',
  pov: 'POV (first-person perspective, text overlays)',
  b_roll_montage: 'B-roll montage with voiceover',
  before_after: 'before/after transformation',
  screen_share: 'screen share / screencast',
  interview_style: 'interview style (Q&A format)',
  day_in_the_life: 'day-in-the-life / vlog style',
  tutorial_walkthrough: 'step-by-step tutorial walkthrough',
}

// ── Variant Generation ──────────────────────────────────────────────────

async function generateVariantBrief(
  primaryBrief: BriefContent,
  variantType: 'hook' | 'format',
  targetDimension: string,
  niche: string,
  clientContext: { name: string; tone: string; strategy: string },
  apiKey: string,
): Promise<BriefContent | null> {
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })

  const dimensionInstruction = variantType === 'hook'
    ? `Rewrite this brief with a DIFFERENT hook structure. The original uses a "${inferHookType(primaryBrief.hook)}" hook style. Rewrite the hook using ${HOOK_TYPE_LABELS[targetDimension] || targetDimension}. Keep the same angle, format, and talking points — ONLY change the hook and title to match the new hook style.`
    : `Rewrite this brief with a DIFFERENT format and pacing. The original uses "${primaryBrief.format}". Rewrite it as ${FORMAT_LABELS[targetDimension] || targetDimension}. Adapt the talking points and hook to suit the new format. Keep the same core angle and concept.`

  const prompt = `You are generating a variant of an existing content brief for the "${niche}" niche.

## Original Brief
- Title: ${primaryBrief.title}
- Hook: ${primaryBrief.hook}
- Angle: ${primaryBrief.angle}
- Format: ${primaryBrief.format}
- Talking Points: ${primaryBrief.talking_points.join('; ')}
- CTA: ${primaryBrief.cta}

## Creator Context
- Name: ${clientContext.name}
- Tone: ${clientContext.tone}
- Strategy: ${clientContext.strategy}

## Variant Instructions
${dimensionInstruction}

Score the variant's estimated_vps independently (0-100) — do NOT just copy the original score. Consider how the changed dimension affects virality in this niche.

Return ONLY a JSON object (no markdown, no code fences):
{
  "title": "...",
  "hook": "...",
  "angle": "...",
  "format": "...",
  "talking_points": ["..."],
  "cta": "...",
  "estimated_vps": <0-100>,
  "reasoning": "..."
}`

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.7 }, // higher temp for creative variation
    })

    const text = result.text || ''
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed: any
    try { parsed = JSON.parse(cleaned) } catch {
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) parsed = JSON.parse(match[0])
      else return null
    }

    return {
      title: parsed.title || primaryBrief.title,
      hook: parsed.hook || primaryBrief.hook,
      angle: parsed.angle || primaryBrief.angle,
      format: parsed.format || primaryBrief.format,
      talking_points: parsed.talking_points || primaryBrief.talking_points,
      cta: parsed.cta || primaryBrief.cta,
      estimated_vps: Math.max(0, Math.min(100, parsed.estimated_vps || 50)),
      reasoning: parsed.reasoning || '',
    }
  } catch (err: any) {
    console.error(`[VariantGen] Failed to generate ${variantType} variant:`, err.message)
    return null
  }
}

// ── Main Entry Point ────────────────────────────────────────────────────

/**
 * Generate 3 variants (A/B/C) for a brief.
 *
 * Variant A = the primary brief (no LLM call needed, just wrapped).
 * Variant B = different hook type (1 LLM call).
 * Variant C = different format/pacing (1 LLM call).
 *
 * Degrades gracefully: if B or C fails, returns whatever succeeded.
 */
export async function generateBriefVariants(
  primaryBrief: BriefContent,
  niche: string,
  clientContext: { name: string; tone: string; strategy: string },
): Promise<VariantGenerationResult> {
  const apiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    // No API key — return only Variant A
    return {
      variants: [{
        variant_label: 'A',
        brief_content: primaryBrief,
        vps_score: primaryBrief.estimated_vps,
        feature_dimensions_varied: {},
      }],
      llm_calls: 0,
    }
  }

  const currentHookType = inferHookType(primaryBrief.hook)
  const altHookType = pickAlternativeHookType(currentHookType)
  const currentFormat = inferFormat(primaryBrief.format)
  const altFormat = pickAlternativeFormat(currentFormat)

  // Variant A is the primary (no generation needed)
  const variantA: VariantResult = {
    variant_label: 'A',
    brief_content: primaryBrief,
    vps_score: primaryBrief.estimated_vps,
    feature_dimensions_varied: {},
  }

  // Generate B and C in parallel
  const [variantBContent, variantCContent] = await Promise.all([
    generateVariantBrief(primaryBrief, 'hook', altHookType, niche, clientContext, apiKey),
    generateVariantBrief(primaryBrief, 'format', altFormat, niche, clientContext, apiKey),
  ])

  let llmCalls = 2
  const variants: VariantResult[] = [variantA]

  if (variantBContent) {
    variants.push({
      variant_label: 'B',
      brief_content: variantBContent,
      vps_score: variantBContent.estimated_vps,
      feature_dimensions_varied: {
        hook_type: altHookType,
        changed_from: currentHookType,
      },
    })
  } else {
    llmCalls-- // call failed, don't count it
  }

  if (variantCContent) {
    variants.push({
      variant_label: 'C',
      brief_content: variantCContent,
      vps_score: variantCContent.estimated_vps,
      feature_dimensions_varied: {
        content_format: altFormat,
        changed_from: currentFormat,
      },
    })
  } else {
    llmCalls--
  }

  return { variants, llm_calls: llmCalls }
}

// ── Database Helpers ────────────────────────────────────────────────────

/**
 * Store variants in brief_variants table.
 * Call AFTER inserting the brief into pre_generated_briefs.
 */
export async function storeVariants(
  db: SupabaseClient,
  briefId: number,
  variants: VariantResult[],
): Promise<void> {
  if (variants.length === 0) return

  const rows = variants.map(v => ({
    brief_id: briefId,
    variant_label: v.variant_label,
    brief_content: v.brief_content,
    vps_score: v.vps_score,
    feature_dimensions_varied: v.feature_dimensions_varied,
    was_selected: false,
  }))

  const { error } = await db.from('brief_variants').insert(rows)
  if (error) {
    console.error(`[VariantGen] Failed to store variants for brief ${briefId}:`, error.message)
  }
}

/**
 * Mark a variant as selected and deselect the others for the same brief.
 */
export async function selectVariant(
  db: SupabaseClient,
  briefId: number,
  variantLabel: string,
): Promise<void> {
  // Deselect all variants for this brief
  await db
    .from('brief_variants')
    .update({ was_selected: false })
    .eq('brief_id', briefId)

  // Select the chosen variant
  await db
    .from('brief_variants')
    .update({ was_selected: true })
    .eq('brief_id', briefId)
    .eq('variant_label', variantLabel)
}

/**
 * Get variants for a set of brief IDs (batch fetch for review UI).
 */
export async function getVariantsForBriefs(
  db: SupabaseClient,
  briefIds: number[],
): Promise<Record<number, VariantResult[]>> {
  if (briefIds.length === 0) return {}

  const { data, error } = await db
    .from('brief_variants')
    .select('brief_id, variant_label, brief_content, vps_score, feature_dimensions_varied, was_selected')
    .in('brief_id', briefIds)
    .order('variant_label', { ascending: true })

  if (error || !data) return {}

  const grouped: Record<number, VariantResult[]> = {}
  for (const row of data) {
    if (!grouped[row.brief_id]) grouped[row.brief_id] = []
    grouped[row.brief_id].push({
      variant_label: row.variant_label,
      brief_content: row.brief_content,
      vps_score: row.vps_score,
      feature_dimensions_varied: row.feature_dimensions_varied,
    })
  }

  return grouped
}
