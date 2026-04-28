// Core Escape Assessment generator. Imported by:
//   - src/app/api/assessment/generate/route.ts (POST handler)
//   - src/app/api/assessment/test/route.ts     (dev batch runner)
//
// Lives in src/lib/ rather than the route file because Next.js disallows
// non-route exports from app/api/*/route.ts (TS2344 on .next/types).

import {
  type AssessmentInput,
  type AssessmentPayload,
  type OfferCadence,
} from '@/types/assessment'
import { buildEscapeAssessmentPrompt } from '@/lib/prompts/escape-assessment-prompt'
import { describeAssessmentPayload } from '@/lib/assessment/validate-payload'

const CADENCE_VALUES: ReadonlySet<OfferCadence> = new Set(['monthly', 'weekly', 'one-time'])

// Global flag for replace(). Use the non-global twin for boolean .test() checks
// to avoid the lastIndex side-effect that makes successive tests skip matches.
const SPRINT_PLACEHOLDER_GLOBAL = /\{\{\s*SPRINT_START_DATE\s*\}\}/g
const SPRINT_PLACEHOLDER = /\{\{\s*SPRINT_START_DATE\s*\}\}/
const MONTH_REGEX = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i

export function generateAssessmentId(): string {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 900) + 100
  return `EA-${a}-${b}`
}

export function tomorrowIsoDate(): string {
  const t = new Date()
  t.setUTCDate(t.getUTCDate() + 1)
  return t.toISOString().slice(0, 10)
}

export function formatHumanDate(isoDate: string): string {
  // Parse YYYY-MM-DD as UTC midnight to avoid timezone drift on the displayed weekday.
  const d = new Date(`${isoDate}T00:00:00Z`)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

function computeRevenuePerSubscriber(price: number, cadence: OfferCadence): number {
  if (!CADENCE_VALUES.has(cadence)) return price
  if (cadence === 'monthly')  return price
  if (cadence === 'weekly')   return Math.round(price * 4.33)
  return Math.max(1, Math.round(price / 12))
}

function extractJson(text: string): unknown {
  const trimmed = text.trim()
  try { return JSON.parse(trimmed) } catch { /* fall through */ }
  const fenced = trimmed.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  try { return JSON.parse(fenced) } catch { /* fall through */ }
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1))
  }
  throw new Error('no JSON object found in model response')
}

async function callClaude(systemPrompt: string, userJson: string, retryNote?: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: userJson },
  ]
  if (retryNote) messages.push({ role: 'user', content: retryNote })

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Claude HTTP ${res.status}: ${err.slice(0, 600)}`)
  }

  const data = await res.json() as { content?: Array<{ type: string; text?: string }> }
  const text = (data.content ?? [])
    .filter(b => b.type === 'text')
    .map(b => b.text ?? '')
    .join('\n')
    .trim()
  if (!text) throw new Error('empty model response')
  return text
}

interface GenerationOk    { ok: true; payload: AssessmentPayload }
interface GenerationFail  { ok: false; status: number; error: string; reasons?: string[] }

// Apply server-side overrides + interpolations to a candidate payload returned
// by the model. Idempotent; safe to call after the schema-failure retry path.
function applyServerSideTransforms(
  candidate: AssessmentPayload,
  input: AssessmentInput,
  startDate: string,
): void {
  const monthlyTarget = Math.round(input.monthlyExpenses * input.freedomMultiplier)
  const humanDate = formatHumanDate(startDate)

  candidate.assessmentId = candidate.assessmentId || generateAssessmentId()
  candidate.generatedAt = new Date().toISOString()
  candidate.freedomNumber.monthlyTarget = monthlyTarget
  candidate.freedomNumber.multiplier = input.freedomMultiplier
  candidate.freedomNumber.runwayMonths = input.runwayMonths
  candidate.operator.firstName = input.firstName
  candidate.operator.inputs = {
    hoursPerWeek: input.hoursPerWeek,
    monthlyIncome: input.monthlyIncome,
    monthlyExpenses: input.monthlyExpenses,
    runwayMonths: input.runwayMonths,
    skillProfile: input.skillProfile,
    riskTolerance: input.riskTolerance,
    audienceAccess: input.audienceAccess,
    nicheSignal: input.nicheSignal,
  }

  const cadence = candidate.businessMatch.firstOffer.cadence
  const price = candidate.businessMatch.firstOffer.price
  const revenuePerSubscriber = computeRevenuePerSubscriber(price, cadence)
  const subscribersNeeded = revenuePerSubscriber > 0
    ? Math.ceil(monthlyTarget / revenuePerSubscriber)
    : 0
  candidate.businessMatch.pathToFreedom = { subscribersNeeded, revenuePerSubscriber }

  // Pin sprint dates and apply the 2x estimatedMinutes multiplier.
  // 2x multiplier — model systematically underestimates for non-technical operators (Summary #7, Issue #9).
  candidate.sprint.startDate = startDate
  for (let i = 0; i < candidate.sprint.days.length; i++) {
    const d = new Date(`${startDate}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + i)
    const day = candidate.sprint.days[i]
    day.dayNumber = i + 1
    day.date = d.toISOString().slice(0, 10)
    if (typeof day.estimatedMinutes === 'number' && Number.isFinite(day.estimatedMinutes)) {
      const doubled = day.estimatedMinutes * 2
      day.estimatedMinutes = Math.max(5, Math.round(doubled / 5) * 5)
    }
  }

  // Replace the {{SPRINT_START_DATE}} placeholder in agentContext.greeting.
  if (typeof candidate.agentContext?.greeting === 'string') {
    candidate.agentContext.greeting = candidate.agentContext.greeting.replace(
      SPRINT_PLACEHOLDER_GLOBAL,
      humanDate,
    )
  }

  // Pin agent knownState to canonical values.
  candidate.agentContext.knownState = {
    businessName: candidate.businessMatch.businessName,
    freedomTarget: monthlyTarget,
    sprintStartDate: startDate,
    currentDay: 1,
  }
}

function greetingHasFabricatedDate(greeting: string): boolean {
  return MONTH_REGEX.test(greeting)
}

export async function generateAssessment(input: AssessmentInput): Promise<GenerationOk | GenerationFail> {
  const systemPrompt = buildEscapeAssessmentPrompt(input)
  const userJson = JSON.stringify(input)
  const startDate = tomorrowIsoDate()
  const humanDate = formatHumanDate(startDate)

  const callOnce = async (note?: string) => {
    const text = await callClaude(systemPrompt, userJson, note)
    return extractJson(text)
  }

  let aiObject: unknown
  try {
    aiObject = await callOnce()
  } catch (e) {
    console.error('[assessment/generate] first call failed', e)
    try {
      aiObject = await callOnce(
        'Your previous response was not valid JSON. Output ONLY valid JSON, no markdown, no preamble.',
      )
    } catch (e2) {
      console.error('[assessment/generate] retry failed', e2, { input })
      return { ok: false, status: 500, error: 'Could not generate assessment. Please try again.' }
    }
  }

  // Helper: detect whether the raw model output used the placeholder. Uses the
  // non-global regex so the read does not advance lastIndex on the global twin.
  const detectPlaceholder = (obj: unknown) => {
    const g = ((obj as { agentContext?: { greeting?: unknown } } | null)
      ?.agentContext?.greeting)
    return typeof g === 'string' && SPRINT_PLACEHOLDER.test(g)
  }

  // CRITICAL ORDER FIX (Cursor 1.10): apply server-side transforms BEFORE the
  // first schema validation. The validator's placeholder + resolved-year checks
  // require interpolation to have already happened.
  let usedPlaceholder = detectPlaceholder(aiObject)
  let candidate = aiObject as AssessmentPayload
  candidate.assessmentId = generateAssessmentId()
  try {
    applyServerSideTransforms(candidate, input, startDate)
  } catch (e) {
    // Transforms touch nested structures; if the model returned a malformed
    // shape, validation below will surface the specific failure.
    console.warn('[assessment/generate] transforms threw on first pass (shape error)', e)
  }

  let report = describeAssessmentPayload(candidate)
  if (!report.ok) {
    console.warn('[assessment/generate] schema invalid, retrying once', report.reasons, { input })
    try {
      aiObject = await callOnce(
        `Your previous response did not match the schema. Specific failures: ${report.reasons.join('; ')}. Output ONLY valid JSON matching the schema. Remember: agentContext.greeting MUST contain the literal {{SPRINT_START_DATE}} placeholder exactly once. No relative phrases like "tomorrow" or "next week".`,
      )
      usedPlaceholder = detectPlaceholder(aiObject)
      candidate = aiObject as AssessmentPayload
      candidate.assessmentId = generateAssessmentId()
      try {
        applyServerSideTransforms(candidate, input, startDate)
      } catch (e2) {
        console.warn('[assessment/generate] transforms threw on retry (shape error)', e2)
      }
      report = describeAssessmentPayload(candidate)
    } catch (e) {
      console.error('[assessment/generate] schema retry threw', e, { input })
    }
  }

  if (!report.ok) {
    console.error('[assessment/generate] schema still invalid after retry', report.reasons, { input })
    return {
      ok: false, status: 500,
      error: 'Generated assessment did not match schema',
      reasons: report.reasons,
    }
  }

  // Date-hallucination detection
  const greeting = candidate.agentContext.greeting
  const greetingWithoutHumanDate = greeting.split(humanDate).join('')
  if (!usedPlaceholder && greetingHasFabricatedDate(greetingWithoutHumanDate)) {
    console.warn('[assessment/generate] date hallucination detected, regenerating once')
    try {
      const retried = await callOnce(
        'Your previous greeting wrote a literal month name instead of using the {{SPRINT_START_DATE}} placeholder. Regenerate the entire JSON object using the placeholder. Do not write any month name or specific date in agentContext.greeting.',
      )
      const retryReport = describeAssessmentPayload(retried)
      if (!retryReport.ok) {
        console.error('[assessment/generate] regeneration after hallucination failed schema', retryReport.reasons)
        return { ok: false, status: 500, error: 'Date hallucination detected', reasons: retryReport.reasons }
      }
      const retriedCandidate = retried as AssessmentPayload
      retriedCandidate.assessmentId = generateAssessmentId()
      try {
        applyServerSideTransforms(retriedCandidate, input, startDate)
      } catch (e3) {
        console.warn('[assessment/generate] transforms threw on hallucination retry', e3)
      }
      const retriedGreeting = retriedCandidate.agentContext.greeting
      const retriedStripped = retriedGreeting.split(humanDate).join('')
      if (greetingHasFabricatedDate(retriedStripped)) {
        return { ok: false, status: 500, error: 'Date hallucination detected' }
      }
      const finalRetryReport = describeAssessmentPayload(retriedCandidate)
      if (!finalRetryReport.ok) {
        return {
          ok: false, status: 500,
          error: 'Assessment failed final validation after hallucination retry',
          reasons: finalRetryReport.reasons,
        }
      }
      return { ok: true, payload: retriedCandidate }
    } catch (e) {
      console.error('[assessment/generate] hallucination retry threw', e)
      return { ok: false, status: 500, error: 'Date hallucination detected' }
    }
  }

  const finalReport = describeAssessmentPayload(candidate)
  if (!finalReport.ok) {
    console.error('[assessment/generate] post-override invalid', finalReport.reasons, { input })
    return {
      ok: false, status: 500,
      error: 'Assessment failed final validation',
      reasons: finalReport.reasons,
    }
  }

  return { ok: true, payload: candidate }
}
