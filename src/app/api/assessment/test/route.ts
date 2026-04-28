import { NextResponse } from 'next/server'
import type { AssessmentInput, AssessmentPayload } from '@/types/assessment'
import { generateAssessment } from '@/lib/assessment/generate'
import { describeAssessmentPayload } from '@/lib/assessment/validate-payload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const TEST_INPUTS: AssessmentInput[] = [
  // Original 10 baseline cases
  { firstName: 'Sarah',  hoursPerWeek:  5, monthlyIncome: 12000, monthlyExpenses: 8000, runwayMonths:  6, skillProfile: 'Analytical',     riskTolerance: 'Medium', audienceAccess: 'Coworkers in finance and 800 LinkedIn connections',                  nicheSignal: 'Real estate investing',                freedomMultiplier: 1.5 },
  { firstName: 'Marcus', hoursPerWeek: 25, monthlyIncome:  3500, monthlyExpenses: 2800, runwayMonths:  2, skillProfile: 'Creative',       riskTolerance: 'High',   audienceAccess: '2,000 Instagram followers from my old art account',                 nicheSignal: 'Digital art',                          freedomMultiplier: 1.5 },
  { firstName: 'Jamie',  hoursPerWeek: 10, monthlyIncome:  5000, monthlyExpenses: 4200, runwayMonths:  3, skillProfile: 'Not sure',       riskTolerance: 'Low',    audienceAccess: 'None yet',                                                          nicheSignal: 'Not sure',                             freedomMultiplier: 1.5 },
  { firstName: 'David',  hoursPerWeek: 15, monthlyIncome:  9000, monthlyExpenses: 5500, runwayMonths:  4, skillProfile: 'Technical',      riskTolerance: 'Medium', audienceAccess: '500 LinkedIn followers and an active GitHub presence',              nicheSignal: 'B2B SaaS for accountants',             freedomMultiplier: 1.5 },
  { firstName: 'Priya',  hoursPerWeek: 12, monthlyIncome:  6000, monthlyExpenses: 4000, runwayMonths:  5, skillProfile: 'Creative',       riskTolerance: 'Medium', audienceAccess: 'Local pottery meetup of about 40 people',                           nicheSignal: 'Left-handed pottery for beginners',    freedomMultiplier: 1.5 },
  { firstName: 'Alex',   hoursPerWeek: 10, monthlyIncome:  7000, monthlyExpenses: 4500, runwayMonths:  3, skillProfile: 'Sales/Marketing',riskTolerance: 'High',   audienceAccess: '4,500 LinkedIn followers and an email list of ~200 from past job',  nicheSignal: 'Fitness',                              freedomMultiplier: 1.5 },
  { firstName: 'Taylor', hoursPerWeek: 20, monthlyIncome:  4000, monthlyExpenses: 3800, runwayMonths:  0, skillProfile: 'Operational',    riskTolerance: 'Low',    audienceAccess: 'None yet',                                                          nicheSignal: 'Personal organization',                freedomMultiplier: 1.2 },
  { firstName: 'Morgan', hoursPerWeek: 30, monthlyIncome:  8000, monthlyExpenses: 4000, runwayMonths: 18, skillProfile: 'Technical',      riskTolerance: 'High',   audienceAccess: 'Active in 3 AI Discord servers and 1.2k Twitter followers',         nicheSignal: 'AI agent development',                 freedomMultiplier: 2.0 },
  { firstName: 'Riley',  hoursPerWeek:  8, monthlyIncome:  5500, monthlyExpenses: 4500, runwayMonths:  4, skillProfile: 'Analytical',     riskTolerance: 'Low',    audienceAccess: 'Coworkers at a CPA firm',                                           nicheSignal: 'Tax preparation',                      freedomMultiplier: 1.3 },
  { firstName: 'Jordan', hoursPerWeek: 20, monthlyIncome:  6000, monthlyExpenses: 4500, runwayMonths:  1, skillProfile: 'Sales/Marketing',riskTolerance: 'High',   audienceAccess: '1,500 newsletter subscribers from a past project',                  nicheSignal: 'Content agency',                       freedomMultiplier: 2.0 },
  // Edge case 11 (Cursor 1.8 Step 3): "Not sure" niche
  { firstName: 'Casey',  hoursPerWeek: 10, monthlyIncome:  8000, monthlyExpenses: 5000, runwayMonths:  4, skillProfile: 'Sales/Marketing',riskTolerance: 'Medium', audienceAccess: '600 LinkedIn connections in B2B sales',                             nicheSignal: 'Not sure',                             freedomMultiplier: 1.5 },
  // Edge case 12 (Cursor 1.8 Step 4): low hours + high income → forces feasibility flag
  { firstName: 'Drew',   hoursPerWeek:  5, monthlyIncome: 12000, monthlyExpenses: 8000, runwayMonths:  6, skillProfile: 'Sales/Marketing',riskTolerance: 'Medium', audienceAccess: 'None yet',                                                          nicheSignal: 'Real estate',                          freedomMultiplier: 1.5 },
]

interface QualityChecks {
  hasAssessmentId: boolean
  assessmentIdFormatOk: boolean
  hasNoBlueprintWord: boolean
  // Diagnostic: when hasNoBlueprintWord is false, capture where + a snippet so
  // we can tell whether it's benign English in prose or a structural regression.
  blueprintLocations?: Array<{ path: string; snippet: string }>
  greetingMentionsHumanDate: boolean
  greetingHasNoPlaceholder: boolean
  platformsHaveNoMemberCounts: boolean
  scriptsHaveNoDecimalPercent: boolean
  scriptsHaveNoMonthName: boolean
  day1IsCustomerFacing: boolean
  days1to3HaveCustomerFacing: boolean
  days1to7HaveCustomerConversation: boolean
  days1to10HaveOfferDelivery: boolean
  estimatedMinutesIs2xish: boolean
  month3HasEstimatedHoursPerWeek: boolean
  // Niche-specific (only meaningful when nicheSignal === "Not sure")
  notSureNiche?: { greetingExplains: boolean; quickReplyOffersChange: boolean }
  // Feasibility-specific (only meaningful when low hours + high income)
  feasibility?: {
    fitsBudget: boolean
    flagPresent: boolean
    timelineExtended: boolean
    anyOk: boolean
  }
}

// Walk a payload object, find every string field that contains /blueprint/i,
// and return the JSON path (e.g. "businessMatch.rationale[1]") with a 60-char
// window around the match. Helps distinguish benign English from regressions.
function findBlueprintOccurrences(obj: unknown, path = '$'): Array<{ path: string; snippet: string }> {
  const out: Array<{ path: string; snippet: string }> = []
  const re = /blueprint/i
  const walk = (node: unknown, p: string) => {
    if (typeof node === 'string') {
      const m = node.match(re)
      if (m && m.index != null) {
        const start = Math.max(0, m.index - 25)
        const end = Math.min(node.length, m.index + m[0].length + 25)
        const head = start > 0 ? '…' : ''
        const tail = end < node.length ? '…' : ''
        out.push({ path: p, snippet: `${head}${node.slice(start, end)}${tail}` })
      }
      return
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${p}[${i}]`))
      return
    }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        walk(v, `${p}.${k}`)
      }
    }
  }
  walk(obj, path)
  return out
}

function runQualityChecks(input: AssessmentInput, payload: AssessmentPayload): QualityChecks {
  const json = JSON.stringify(payload)
  const greeting = payload.agentContext.greeting

  const monthRegex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i
  const decimalPctRegex = /\d+\.\d+\s*%/
  const parenCountRegex = /\([^)]*\d[\d,]*[KMB]?\+?\s*(members?|users?|subscribers?|investors?|people|followers?)[^)]*\)/i

  // Format the start date the same way the route does, then check the greeting includes it.
  const d = new Date(`${payload.sprint.startDate}T00:00:00Z`)
  const humanDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(d)

  const cats = payload.sprint.days.map(x => x.category)

  // Estimated minutes feasibility heuristic: with 2x multiplier applied, expect Day 1 >= 30 min
  const day1Minutes = payload.sprint.days[0]?.estimatedMinutes ?? 0
  const avgMinutes = payload.sprint.days.reduce((s, x) => s + (x.estimatedMinutes ?? 0), 0) / 14

  const checks: QualityChecks = {
    hasAssessmentId: typeof payload.assessmentId === 'string' && payload.assessmentId.length > 0,
    assessmentIdFormatOk: /^EA-\d-\d{3}$/.test(payload.assessmentId ?? ''),
    hasNoBlueprintWord: !/blueprint/i.test(json),
    blueprintLocations: /blueprint/i.test(json) ? findBlueprintOccurrences(payload) : undefined,
    greetingMentionsHumanDate: greeting.includes(humanDate),
    greetingHasNoPlaceholder: !/\{\{\s*SPRINT_START_DATE\s*\}\}/.test(greeting),
    platformsHaveNoMemberCounts: payload.leads.platforms.every(p => !parenCountRegex.test(p)),
    scriptsHaveNoDecimalPercent: payload.leads.scripts.every(s => !decimalPctRegex.test(s.template)),
    scriptsHaveNoMonthName: payload.leads.scripts.every(s => !monthRegex.test(s.template)),
    day1IsCustomerFacing: cats[0] === 'customer-facing',
    days1to3HaveCustomerFacing: cats.slice(0, 3).includes('customer-facing'),
    days1to7HaveCustomerConversation: cats.slice(0, 7).includes('customer-conversation'),
    days1to10HaveOfferDelivery: cats.slice(0, 10).includes('offer-delivery'),
    estimatedMinutesIs2xish: day1Minutes >= 30 || avgMinutes >= 40,
    month3HasEstimatedHoursPerWeek: typeof payload.roadmap.months[2]?.estimatedHoursPerWeek === 'number',
  }

  if (input.nicheSignal === 'Not sure') {
    const greetingLower = greeting.toLowerCase()
    const greetingExplains =
      greetingLower.includes('i picked') || greetingLower.includes('starter niche')
    const quickReplyOffersChange = payload.agentContext.quickReplies.some(r =>
      /different niche|pick.*niche|change.*niche/i.test(r),
    )
    checks.notSureNiche = { greetingExplains, quickReplyOffersChange }
  }

  // Feasibility-flagged inputs: very low hours + high target
  const monthlyTarget = Math.round(input.monthlyExpenses * input.freedomMultiplier)
  const tightHours = input.hoursPerWeek <= 5
  const aggressiveTarget = monthlyTarget >= 8000
  if (tightHours && aggressiveTarget) {
    const month3HpW = payload.roadmap.months[2]?.estimatedHoursPerWeek ?? 0
    const fitsBudget = month3HpW <= input.hoursPerWeek
    const flagPresent = payload.businessMatch.rationale.some(r => r.includes('FEASIBILITY FLAG'))
    const timelineExtended = /beyond 90 days|extended timeline|6 months|9 months|12 months/i
      .test(payload.businessMatch.rationale.join(' '))
    checks.feasibility = {
      fitsBudget,
      flagPresent,
      timelineExtended,
      anyOk: fitsBudget || flagPresent || timelineExtended,
    }
  }

  return checks
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Not available in production' }, { status: 404 })
  }

  const results: Array<{
    testIndex: number
    input: AssessmentInput
    output?: unknown
    passed: boolean
    error?: string
    reasons?: string[]
    quality?: QualityChecks
  }> = []

  let passed = 0
  let failed = 0

  for (let i = 0; i < TEST_INPUTS.length; i++) {
    const input = TEST_INPUTS[i]
    try {
      const r = await generateAssessment(input)
      if (!r.ok) {
        failed++
        results.push({ testIndex: i, input, passed: false, error: r.error, reasons: r.reasons })
        continue
      }
      const report = describeAssessmentPayload(r.payload)
      const quality = runQualityChecks(input, r.payload)
      if (!report.ok) {
        failed++
        results.push({ testIndex: i, input, output: r.payload, passed: false, error: 'schema check failed', reasons: report.reasons, quality })
      } else {
        passed++
        results.push({ testIndex: i, input, output: r.payload, passed: true, quality })
      }
    } catch (e) {
      failed++
      results.push({ testIndex: i, input, passed: false, error: e instanceof Error ? e.message : String(e) })
    }
  }

  const failures = results.filter(r => !r.passed).map(r => ({
    testIndex: r.testIndex,
    input: r.input,
    error: r.error,
    reasons: r.reasons,
  }))

  return NextResponse.json({
    totalRuns: TEST_INPUTS.length,
    passed,
    failed,
    failures,
    results,
  })
}
