/**
 * Test script for the adversarial evaluation pipeline.
 * Runs directly — no web server needed.
 *
 * Usage: npx tsx scripts/test-adversarial.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const geminiKey = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars')
  process.exit(1)
}
if (!geminiKey) {
  console.error('Missing GOOGLE_GEMINI_AI_API_KEY')
  process.exit(1)
}

const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

// ── Import the evaluator inline (can't use path aliases in scripts) ──

// We'll replicate the core logic here since tsx can't resolve @/ aliases easily.
// This test calls Supabase and Gemini directly.

const { GoogleGenAI } = require('@google/genai')

interface GeneratedBrief {
  title: string; hook: string; angle: string; format: string;
  talking_points: string[]; cta: string; estimated_vps: number; reasoning: string;
}

interface CriticObjection {
  element: string; weakness: string; threshold_violated?: string;
}

interface CriticResult {
  score: number; objections: CriticObjection[]; summary: string;
}

// ── Get niche thresholds from scraped_videos ────────────────────────────

async function getNicheThresholds(niche: string) {
  const { data, error } = await db
    .from('scraped_videos')
    .select('views_count, likes_count, shares_count, saves_count, dps_breakdown')
    .eq('niche', niche)
    .gt('views_count', 0)
    .order('scraped_at', { ascending: false })
    .limit(200)

  if (error || !data || data.length === 0) {
    console.log(`  No scraped_videos for "${niche}" — using global fallbacks`)
    return {
      avg_completion_rate: 0.35, avg_share_rate: 0.02,
      avg_save_rate: 0.03, avg_velocity_score: 0.5, video_count: 0,
    }
  }

  let totalShareRate = 0, totalSaveRate = 0, totalVelocity = 0
  let totalCompletionRate = 0, completionCount = 0

  for (const v of data) {
    const views = v.views_count || 1
    totalShareRate += (v.shares_count || 0) / views
    totalSaveRate += (v.saves_count || 0) / views
    const breakdown = v.dps_breakdown as any
    if (breakdown?.completion_rate != null) { totalCompletionRate += breakdown.completion_rate; completionCount++ }
    if (breakdown?.velocity_score != null) { totalVelocity += breakdown.velocity_score }
    else { totalVelocity += Math.min(1, (v.likes_count || 0) / views * 10) }
  }

  const n = data.length
  return {
    avg_completion_rate: completionCount > 0 ? totalCompletionRate / completionCount : 0.35,
    avg_share_rate: totalShareRate / n,
    avg_save_rate: totalSaveRate / n,
    avg_velocity_score: totalVelocity / n,
    video_count: n,
  }
}

// ── Critic ──────────────────────────────────────────────────────────────

async function runCritic(brief: GeneratedBrief, niche: string, thresholds: any): Promise<CriticResult> {
  const ai = new GoogleGenAI({ apiKey: geminiKey })
  const thresholdSource = thresholds.video_count > 0
    ? `Based on ${thresholds.video_count} scraped videos` : 'Using global averages (no niche data)'

  const prompt = `You are evaluating a content brief for the "${niche}" niche. Your job is to identify weaknesses using quantified evidence. Score against these DPS signal thresholds:

## DPS Signal Thresholds (${thresholdSource})
- Average completion rate: ${thresholds.avg_completion_rate.toFixed(3)}
- Average share rate: ${thresholds.avg_share_rate.toFixed(4)}
- Average save rate: ${thresholds.avg_save_rate.toFixed(4)}
- Average velocity score: ${thresholds.avg_velocity_score.toFixed(3)}

## Brief Under Evaluation
- Title: ${brief.title}
- Hook: ${brief.hook}
- Angle: ${brief.angle}
- Format: ${brief.format}
- Talking Points: ${brief.talking_points.join('; ')}
- CTA: ${brief.cta}
- Estimated VPS: ${brief.estimated_vps}

Attack the hook structure, pacing recommendation, format choice, and cultural timing. Be specific: which element is weakest and why, citing the threshold it falls below.

Return ONLY a JSON object (no markdown, no code fences):
{ "score": <0-100>, "objections": [{ "element": "<string>", "weakness": "<string>", "threshold_violated": "<string>" }], "summary": "<one sentence>" }`

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.3 },
  })
  const text = (result.text || '').replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
  let parsed: any
  try { parsed = JSON.parse(text) } catch {
    const m = text.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); else throw new Error('Bad Critic JSON')
  }
  return {
    score: Math.max(0, Math.min(100, parsed.score || 0)),
    objections: (parsed.objections || []).map((o: any) => ({
      element: o.element || 'unknown', weakness: o.weakness || '', threshold_violated: o.threshold_violated,
    })),
    summary: parsed.summary || '',
  }
}

// ── Synthesizer ─────────────────────────────────────────────────────────

async function runSynthesizer(brief: GeneratedBrief, criticResult: CriticResult, niche: string): Promise<GeneratedBrief> {
  const ai = new GoogleGenAI({ apiKey: geminiKey })
  const objectionsText = criticResult.objections.map((o, i) =>
    `${i + 1}. [${o.element}] ${o.weakness}${o.threshold_violated ? ` (${o.threshold_violated})` : ''}`
  ).join('\n')

  const prompt = `You are a content brief Synthesizer. A Critic scored this brief ${criticResult.score}/100. Rewrite to address every objection.

## Original Brief
- Title: ${brief.title}
- Hook: ${brief.hook}
- Angle: ${brief.angle}
- Format: ${brief.format}
- Talking Points: ${brief.talking_points.join('; ')}
- CTA: ${brief.cta}

## Critic Objections
${objectionsText}

## Critic Verdict: ${criticResult.summary}

Niche: ${niche}. Address EACH objection specifically. Return ONLY a JSON object:
{ "title": "...", "hook": "...", "angle": "...", "format": "...", "talking_points": ["..."], "cta": "...", "estimated_vps": <0-100>, "reasoning": "..." }`

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash', contents: prompt, config: { temperature: 0.5 },
  })
  const text = (result.text || '').replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim()
  let parsed: any
  try { parsed = JSON.parse(text) } catch {
    const m = text.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); else throw new Error('Bad Synthesizer JSON')
  }
  return {
    title: parsed.title || brief.title, hook: parsed.hook || brief.hook,
    angle: parsed.angle || brief.angle, format: parsed.format || brief.format,
    talking_points: parsed.talking_points || brief.talking_points,
    cta: parsed.cta || brief.cta,
    estimated_vps: Math.max(0, Math.min(100, parsed.estimated_vps || brief.estimated_vps)),
    reasoning: parsed.reasoning || brief.reasoning,
  }
}

// ── Main Test ───────────────────────────────────────────────────────────

async function main() {
  console.log('=== ADVERSARIAL EVALUATION TEST ===\n')

  // 1. Find a niche with scraped_videos data
  const { data: niches } = await db
    .from('scraped_videos')
    .select('niche')
    .not('niche', 'is', null)
    .gt('views_count', 0)
    .limit(500)

  const nicheCounts: Record<string, number> = {}
  for (const r of niches || []) { if (r.niche) nicheCounts[r.niche] = (nicheCounts[r.niche] || 0) + 1 }
  const sortedNiches = Object.entries(nicheCounts).sort((a, b) => b[1] - a[1])

  if (sortedNiches.length === 0) {
    console.log('No scraped_videos data found. Testing with global fallbacks.\n')
  } else {
    console.log('Top niches with scraped data:')
    sortedNiches.slice(0, 5).forEach(([n, c]) => console.log(`  ${n}: ${c} videos`))
    console.log()
  }

  const testNiche = sortedNiches.length > 0 ? sortedNiches[0][0] : 'fitness'

  // 2. Get thresholds
  console.log(`--- Test 1: Niche "${testNiche}" (has data) ---`)
  const thresholds = await getNicheThresholds(testNiche)
  console.log('Thresholds:', JSON.stringify(thresholds, null, 2))

  // 3. Create a test brief
  const testBrief: GeneratedBrief = {
    title: 'Why Nobody Talks About This',
    hook: 'Stop scrolling — this changes everything about your morning routine',
    angle: 'Contrarian take on a popular trend in the niche',
    format: 'talking head',
    talking_points: [
      'Most people get this wrong',
      'The science behind it',
      'What to do instead',
    ],
    cta: 'Follow for more tips',
    estimated_vps: 55,
    reasoning: 'Contrarian hooks drive curiosity and shares',
  }

  console.log('\nTest brief:', testBrief.title)
  console.log('Original VPS:', testBrief.estimated_vps)

  // 4. Run adversarial loop
  const MAX_ROUNDS = 3
  const PASS_THRESHOLD = 60
  let currentBrief = { ...testBrief }
  const rounds: any[] = []
  let llmCalls = 0

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    console.log(`\n--- Round ${round} ---`)

    const criticResult = await runCritic(currentBrief, testNiche, thresholds)
    llmCalls++
    console.log(`Critic score: ${criticResult.score}`)
    console.log(`Objections (${criticResult.objections.length}):`)
    criticResult.objections.forEach(o =>
      console.log(`  [${o.element}] ${o.weakness}${o.threshold_violated ? ` — ${o.threshold_violated}` : ''}`)
    )
    console.log(`Verdict: ${criticResult.summary}`)

    const passed = criticResult.score >= PASS_THRESHOLD
    const isLastRound = round === MAX_ROUNDS

    if (passed) {
      console.log(`\n✓ Brief PASSED (score ${criticResult.score} >= ${PASS_THRESHOLD})`)
      rounds.push({ round_number: round, critic_score: criticResult.score, objections: criticResult.objections, revised: false })
      break
    }

    if (isLastRound) {
      console.log(`\n⚠ Brief FAILED after ${MAX_ROUNDS} rounds (score ${criticResult.score} < ${PASS_THRESHOLD}) — flagging as low confidence`)
      rounds.push({ round_number: round, critic_score: criticResult.score, objections: criticResult.objections, revised: false })
      break
    }

    console.log(`\nScore ${criticResult.score} < ${PASS_THRESHOLD} — running Synthesizer...`)
    const revised = await runSynthesizer(currentBrief, criticResult, testNiche)
    llmCalls++
    console.log(`Revised brief: "${revised.title}"`)
    console.log(`Revised VPS: ${revised.estimated_vps}`)
    rounds.push({ round_number: round, critic_score: criticResult.score, objections: criticResult.objections, revised: true })
    currentBrief = revised
  }

  // 5. Summary
  console.log('\n=== SUMMARY ===')
  console.log(`Rounds used: ${rounds.length}`)
  console.log(`LLM calls: ${llmCalls}`)
  console.log(`Original VPS: ${testBrief.estimated_vps} → Final VPS: ${currentBrief.estimated_vps}`)
  console.log(`Final critic score: ${rounds[rounds.length - 1]?.critic_score}`)
  console.log(`Low confidence: ${rounds[rounds.length - 1]?.critic_score < PASS_THRESHOLD && rounds.length >= MAX_ROUNDS}`)

  // 6. Test zero-data niche fallback
  console.log('\n--- Test 2: Zero-data niche ("underwater_basket_weaving") ---')
  const fallbackThresholds = await getNicheThresholds('underwater_basket_weaving')
  console.log('Thresholds:', JSON.stringify(fallbackThresholds, null, 2))
  console.log(`Video count: ${fallbackThresholds.video_count} (should be 0)`)
  console.log(fallbackThresholds.video_count === 0 ? '✓ Graceful fallback confirmed' : '✗ Expected 0 videos')

  // 7. Test DB: check brief_evaluations table exists
  console.log('\n--- Test 3: Database table check ---')
  const { error: tableErr } = await db.from('brief_evaluations').select('id').limit(1)
  if (tableErr) {
    console.log(`⚠ brief_evaluations table not accessible: ${tableErr.message}`)
    console.log('  → Run the migration SQL in Supabase dashboard first:')
    console.log('    supabase/migrations/20260407_brief_evaluations.sql')
  } else {
    console.log('✓ brief_evaluations table exists and is accessible')
  }

  // Check new columns on pre_generated_briefs
  const { data: colCheck, error: colErr } = await db
    .from('pre_generated_briefs')
    .select('final_critic_score, adversarial_rounds')
    .limit(1)
  if (colErr) {
    console.log(`⚠ New columns not found on pre_generated_briefs: ${colErr.message}`)
    console.log('  → Run the migration SQL in Supabase dashboard first')
  } else {
    console.log('✓ final_critic_score and adversarial_rounds columns exist')
  }

  console.log('\n=== DONE ===')
}

main().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
