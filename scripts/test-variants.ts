/**
 * Test script for brief variant generation pipeline.
 * Runs directly — no web server needed.
 *
 * Usage: npx tsx scripts/test-variants.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const geminiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY

if (!supabaseUrl || !supabaseKey) { console.error('Missing SUPABASE env vars'); process.exit(1) }
if (!geminiKey) { console.error('Missing GOOGLE_GEMINI_AI_API_KEY'); process.exit(1) }

const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
const { GoogleGenAI } = require('@google/genai')

// ── Types ───────────────────────────────────────────────────────────────

interface BriefContent {
  title: string; hook: string; angle: string; format: string;
  talking_points: string[]; cta: string; estimated_vps: number; reasoning: string;
}

interface VariantResult {
  variant_label: string; brief_content: BriefContent;
  vps_score: number; feature_dimensions_varied: Record<string, string>;
}

// ── Hook/Format inference (duplicated from module for script isolation) ──

const HOOK_TYPES = ['question','shock_stat','bold_claim','story_opener','direct_challenge','curiosity_gap','hot_take','myth_bust']
const FORMAT_TYPES = ['talking_head','pov','b_roll_montage','before_after','screen_share','interview_style','day_in_the_life','tutorial_walkthrough']

function inferHookType(hook: string): string {
  const l = hook.toLowerCase()
  if (l.includes('?')) return 'question'
  if (/\d+%|\d+ out of/.test(l)) return 'shock_stat'
  if (/stop |don't |never |you're wrong/.test(l)) return 'direct_challenge'
  if (/nobody|no one|secret|hidden/.test(l)) return 'curiosity_gap'
  if (/i |when i |last week|yesterday/.test(l)) return 'story_opener'
  if (/myth|lie|fake|wrong/.test(l)) return 'myth_bust'
  if (/hot take|unpopular|controversial/.test(l)) return 'hot_take'
  return 'bold_claim'
}

function inferFormat(format: string): string {
  const l = format.toLowerCase()
  if (/pov|point.of.view/.test(l)) return 'pov'
  if (/b.roll|montage/.test(l)) return 'b_roll_montage'
  if (/before.after|transformation/.test(l)) return 'before_after'
  if (/screen.share|screencast/.test(l)) return 'screen_share'
  if (/interview/.test(l)) return 'interview_style'
  if (/day.in|vlog/.test(l)) return 'day_in_the_life'
  if (/tutorial|walkthrough|how.to/.test(l)) return 'tutorial_walkthrough'
  return 'talking_head'
}

const HOOK_LABELS: Record<string, string> = {
  question: 'a question', shock_stat: 'a shocking statistic', bold_claim: 'a bold claim',
  story_opener: 'a personal story opener', direct_challenge: 'a direct challenge',
  curiosity_gap: 'a curiosity gap', hot_take: 'a hot take', myth_bust: 'a myth-busting opener',
}

const FORMAT_LABELS: Record<string, string> = {
  talking_head: 'talking head', pov: 'POV', b_roll_montage: 'B-roll montage',
  before_after: 'before/after', screen_share: 'screen share', interview_style: 'interview style',
  day_in_the_life: 'day-in-the-life', tutorial_walkthrough: 'tutorial walkthrough',
}

// ── Variant Generation ──────────────────────────────────────────────────

async function generateVariant(
  primary: BriefContent, type: 'hook' | 'format', target: string, niche: string,
): Promise<BriefContent | null> {
  const ai = new GoogleGenAI({ apiKey: geminiKey })
  const instruction = type === 'hook'
    ? `Rewrite the hook using ${HOOK_LABELS[target] || target}. Keep the same angle, format, and talking points.`
    : `Rewrite as ${FORMAT_LABELS[target] || target} format. Adapt talking points and hook to suit the new format.`

  const prompt = `Generate a variant of this "${niche}" niche content brief.

## Original Brief
- Title: ${primary.title}
- Hook: ${primary.hook}
- Angle: ${primary.angle}
- Format: ${primary.format}
- Talking Points: ${primary.talking_points.join('; ')}
- CTA: ${primary.cta}

## Variant Instructions
${instruction}

Score estimated_vps independently (0-100). Return ONLY JSON:
{ "title": "...", "hook": "...", "angle": "...", "format": "...", "talking_points": ["..."], "cta": "...", "estimated_vps": <0-100>, "reasoning": "..." }`

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.7 },
    })
    const text = (result.text || '').replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
    let parsed: any
    try { parsed = JSON.parse(text) } catch {
      const m = text.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); else return null
    }
    return {
      title: parsed.title || primary.title, hook: parsed.hook || primary.hook,
      angle: parsed.angle || primary.angle, format: parsed.format || primary.format,
      talking_points: parsed.talking_points || primary.talking_points, cta: parsed.cta || primary.cta,
      estimated_vps: Math.max(0, Math.min(100, parsed.estimated_vps || 50)),
      reasoning: parsed.reasoning || '',
    }
  } catch (err: any) {
    console.error(`  Variant ${type} generation failed:`, err.message)
    return null
  }
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== BRIEF VARIANT GENERATION TEST ===\n')

  // 1. Find a real niche
  const { data: niches } = await db.from('scraped_videos').select('niche').not('niche', 'is', null).gt('views_count', 0).limit(500)
  const nicheCounts: Record<string, number> = {}
  for (const r of niches || []) { if (r.niche) nicheCounts[r.niche] = (nicheCounts[r.niche] || 0) + 1 }
  const topNiche = Object.entries(nicheCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'fitness'
  console.log(`Test niche: "${topNiche}" (${nicheCounts[topNiche] || 0} videos)\n`)

  // 2. Create test primary brief
  const primary: BriefContent = {
    title: 'The Side Hustle Nobody Is Talking About',
    hook: 'Did you know that 73% of millionaires have a side hustle? Here\'s the one nobody talks about.',
    angle: 'Introduce an underrated side hustle with low barrier to entry',
    format: 'talking head with text overlays',
    talking_points: ['Low startup cost', 'Scalable within 30 days', 'Real income examples', 'Step-by-step to start today'],
    cta: 'Save this and follow for part 2',
    estimated_vps: 72,
    reasoning: 'Shock stats + side hustle curiosity = high share potential',
  }

  const currentHook = inferHookType(primary.hook)
  const currentFormat = inferFormat(primary.format)
  console.log(`Primary brief: "${primary.title}"`)
  console.log(`  Hook type: ${currentHook}, Format: ${currentFormat}, VPS: ${primary.estimated_vps}\n`)

  // 3. Pick alternative dimensions
  const altHook = HOOK_TYPES.filter(h => h !== currentHook)[Math.floor(Math.random() * (HOOK_TYPES.length - 1))]
  const altFormat = FORMAT_TYPES.filter(f => f !== currentFormat)[Math.floor(Math.random() * (FORMAT_TYPES.length - 1))]
  console.log(`Variant B will use hook type: ${altHook}`)
  console.log(`Variant C will use format: ${altFormat}\n`)

  // 4. Generate variants in parallel
  console.log('Generating variants B and C in parallel...')
  const start = Date.now()
  const [variantB, variantC] = await Promise.all([
    generateVariant(primary, 'hook', altHook, topNiche),
    generateVariant(primary, 'format', altFormat, topNiche),
  ])
  const elapsed = Date.now() - start
  console.log(`Done in ${(elapsed / 1000).toFixed(1)}s (2 LLM calls)\n`)

  // 5. Display results
  const variants: VariantResult[] = [
    { variant_label: 'A', brief_content: primary, vps_score: primary.estimated_vps, feature_dimensions_varied: {} },
  ]

  if (variantB) {
    variants.push({
      variant_label: 'B', brief_content: variantB, vps_score: variantB.estimated_vps,
      feature_dimensions_varied: { hook_type: altHook, changed_from: currentHook },
    })
    console.log(`Variant B: "${variantB.title}"`)
    console.log(`  Hook: "${variantB.hook.slice(0, 80)}..."`)
    console.log(`  Hook type: ${altHook} (changed from ${currentHook})`)
    console.log(`  VPS: ${variantB.estimated_vps}`)
  } else {
    console.log('Variant B: FAILED (graceful degradation)')
  }

  if (variantC) {
    variants.push({
      variant_label: 'C', brief_content: variantC, vps_score: variantC.estimated_vps,
      feature_dimensions_varied: { content_format: altFormat, changed_from: currentFormat },
    })
    console.log(`\nVariant C: "${variantC.title}"`)
    console.log(`  Format: ${variantC.format} (changed from ${primary.format})`)
    console.log(`  VPS: ${variantC.estimated_vps}`)
  } else {
    console.log('\nVariant C: FAILED (graceful degradation)')
  }

  // 6. Check VPS deltas
  console.log('\n--- VPS Delta Analysis ---')
  for (const v of variants) {
    if (v.variant_label === 'A') continue
    const delta = v.vps_score - primary.estimated_vps
    console.log(`  ${v.variant_label} vs A: delta = ${delta > 0 ? '+' : ''}${delta} (${Math.abs(delta) > 5 ? 'MEANINGFUL — show in UI' : 'within 5pts — hide alternatives'})`)
  }

  // 7. Verify all 3 are meaningfully different
  console.log('\n--- Differentiation Check ---')
  if (variantB) {
    const hookSame = variantB.hook === primary.hook
    console.log(`  B hook different from A: ${!hookSame ? 'YES' : 'NO — problem!'}`)
  }
  if (variantC) {
    const formatSame = variantC.format.toLowerCase() === primary.format.toLowerCase()
    console.log(`  C format different from A: ${!formatSame ? 'YES' : 'NO — problem!'}`)
  }

  // 8. DB table check
  console.log('\n--- DB Table Check ---')
  const { error: tableErr } = await db.from('brief_variants').select('id').limit(1)
  if (tableErr) {
    console.log(`brief_variants table: NOT ACCESSIBLE — ${tableErr.message}`)
    console.log('  Run: supabase/migrations/20260407_brief_variants.sql')
  } else {
    console.log('brief_variants table: accessible')
  }

  // 9. Test was_selected tracking
  console.log('\n--- Selection Tracking Test ---')
  // Insert a dummy brief to test variant selection
  const { data: testBrief, error: briefErr } = await db
    .from('pre_generated_briefs')
    .insert({
      agency_id: '62cb020e-5303-452e-8cf2-83368c912b6e',
      client_id: '00000000-0000-0000-0000-000000000000',
      brief_content: primary,
      vps_score: primary.estimated_vps,
      status: 'draft',
      niche: topNiche,
    })
    .select('id')
    .single()

  if (briefErr || !testBrief) {
    console.log(`  Could not insert test brief: ${briefErr?.message}`)
  } else {
    // Insert variants
    const variantRows = variants.map(v => ({
      brief_id: testBrief.id, variant_label: v.variant_label,
      brief_content: v.brief_content, vps_score: v.vps_score,
      feature_dimensions_varied: v.feature_dimensions_varied, was_selected: false,
    }))
    const { error: vErr } = await db.from('brief_variants').insert(variantRows)
    if (vErr) {
      console.log(`  Variant insert failed: ${vErr.message}`)
    } else {
      console.log(`  Inserted ${variantRows.length} variants for test brief ${testBrief.id}`)

      // Select Variant B
      await db.from('brief_variants').update({ was_selected: false }).eq('brief_id', testBrief.id)
      await db.from('brief_variants').update({ was_selected: true }).eq('brief_id', testBrief.id).eq('variant_label', 'B')

      // Verify
      const { data: check } = await db.from('brief_variants').select('variant_label, was_selected').eq('brief_id', testBrief.id).order('variant_label')
      console.log('  Selection state after picking B:')
      for (const row of check || []) {
        console.log(`    Variant ${row.variant_label}: was_selected = ${row.was_selected} ${row.variant_label === 'B' ? '(expected: true)' : '(expected: false)'}`)
      }

      const correctA = check?.find(r => r.variant_label === 'A')?.was_selected === false
      const correctB = check?.find(r => r.variant_label === 'B')?.was_selected === true
      const correctC = !check?.find(r => r.variant_label === 'C') || check?.find(r => r.variant_label === 'C')?.was_selected === false
      console.log(`  Selection tracking: ${correctA && correctB && correctC ? 'CORRECT' : 'INCORRECT'}`)

      // Clean up test data
      await db.from('brief_variants').delete().eq('brief_id', testBrief.id)
      await db.from('pre_generated_briefs').delete().eq('id', testBrief.id)
      console.log('  Test data cleaned up')
    }
  }

  // 10. Cost analysis
  console.log('\n--- Cost Analysis (15-client scenario) ---')
  const clientCount = 15
  const briefsPerClient = 1 // batch generates 1 primary per event
  const variantCallsPerBrief = 2 // B + C
  const adversarialMaxPerBrief = 5 // 3 critic + 2 synthesizer (worst case)
  const generatorPerClient = 1

  const totalGenerator = clientCount * generatorPerClient
  const totalVariant = clientCount * briefsPerClient * variantCallsPerBrief
  const totalAdversarial = clientCount * briefsPerClient * adversarialMaxPerBrief
  const totalMax = totalGenerator + totalVariant + totalAdversarial

  console.log(`  Generator calls: ${totalGenerator}`)
  console.log(`  Variant calls: ${totalVariant} (${variantCallsPerBrief} per brief)`)
  console.log(`  Adversarial max: ${totalAdversarial} (worst case)`)
  console.log(`  Total max: ${totalMax}`)
  console.log(`  Expected (most pass adversarial round 1): ~${totalGenerator + totalVariant + clientCount}`)

  console.log('\n=== DONE ===')
}

main().catch(err => { console.error('Test failed:', err); process.exit(1) })
