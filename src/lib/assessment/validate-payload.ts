import {
  type AssessmentPayload,
  type OperatorStatus,
  type SprintDayCategory,
  OPERATOR_STATUS_VALUES,
  SPRINT_DAY_CATEGORIES,
} from '@/types/assessment'

// Runtime gate between AI output and database storage.
// Returns true ONLY if `payload` is a fully-shaped AssessmentPayload that ALSO
// passes the structural / quality / fabrication checks added in Cursor 1.8.

const CONFIDENCE = new Set(['LOW', 'MEDIUM', 'HIGH'])
const CADENCE = new Set(['monthly', 'weekly', 'one-time'])
const SCRIPT_TYPES = new Set(['cold', 'warm'])
const STATUS_SET = new Set<OperatorStatus>(OPERATOR_STATUS_VALUES)
const CATEGORY_SET = new Set<SprintDayCategory>(SPRINT_DAY_CATEGORIES)

const MONTH_REGEX = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i
const PARENTHETICAL_COUNT_REGEX = /\([^)]*\d[\d,]*[KMB]?\+?\s*(members?|users?|subscribers?|investors?|people|followers?)[^)]*\)/i
const DECIMAL_PERCENT_REGEX = /\d+\.\d+\s*%/
const PLACEHOLDER_REGEX = /\{\{\s*SPRINT_START_DATE\s*\}\}/
// After server interpolation, the greeting must contain a 4-digit year — proof
// that a real formatted date is present. Catches the case where the model dodged
// the placeholder by writing a relative phrase like "tomorrow".
const RESOLVED_YEAR_REGEX = /\b20\d{2}\b/

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function isFiniteNonNegative(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0
}

function isIsoDate(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)
}

export interface ValidationResult {
  ok: boolean
  reasons: string[]
}

export function describeAssessmentPayload(payload: unknown): ValidationResult {
  const reasons: string[] = []
  const fail = (msg: string) => { reasons.push(msg); return false }

  if (!isObj(payload)) return { ok: fail('payload not object'), reasons }

  // Hard rejection: legacy field
  if ('blueprintId' in payload) {
    fail('Legacy blueprintId field present — must be assessmentId')
  }

  // operator
  const op = payload.operator
  if (!isObj(op)) fail('operator not object')
  else {
    if (!isNonEmptyString(op.firstName)) fail('operator.firstName empty')
    if (typeof op.status !== 'string' || !STATUS_SET.has(op.status as OperatorStatus)) {
      fail(`operator.status must be one of ${OPERATOR_STATUS_VALUES.join(' | ')}`)
    }
    const i = op.inputs
    if (!isObj(i)) fail('operator.inputs not object')
    else {
      if (!isFiniteNonNegative(i.hoursPerWeek)) fail('inputs.hoursPerWeek')
      if (!isFiniteNonNegative(i.monthlyIncome)) fail('inputs.monthlyIncome')
      if (!isFiniteNonNegative(i.monthlyExpenses)) fail('inputs.monthlyExpenses')
      if (!isFiniteNonNegative(i.runwayMonths)) fail('inputs.runwayMonths')
      if (!isNonEmptyString(i.skillProfile)) fail('inputs.skillProfile empty')
      if (!isNonEmptyString(i.riskTolerance)) fail('inputs.riskTolerance empty')
      if (typeof i.nicheSignal !== 'string') fail('inputs.nicheSignal not string')
      // audienceAccess: required on new payloads, but tolerated when missing on
      // legacy rows persisted before the field was introduced (Cursor Prompt 4).
      if ('audienceAccess' in (i as object)) {
        if (!isNonEmptyString(i.audienceAccess)) fail('inputs.audienceAccess empty')
        else if ((i.audienceAccess as string).length > 300) fail('inputs.audienceAccess > 300 chars')
      }
    }
  }

  // freedomNumber
  const fn = payload.freedomNumber
  if (!isObj(fn)) fail('freedomNumber not object')
  else {
    if (!isFiniteNonNegative(fn.monthlyTarget)) fail('freedomNumber.monthlyTarget')
    if (!isFiniteNonNegative(fn.multiplier)) fail('freedomNumber.multiplier')
    if (!isFiniteNonNegative(fn.runwayMonths)) fail('freedomNumber.runwayMonths')
    if (!isNonEmptyString(fn.timelineMonths)) fail('freedomNumber.timelineMonths')
    if (typeof fn.confidence !== 'string' || !CONFIDENCE.has(fn.confidence)) {
      fail('freedomNumber.confidence not LOW|MEDIUM|HIGH')
    }
  }

  // businessMatch
  const bm = payload.businessMatch
  let rationaleStrings: string[] = []
  if (!isObj(bm)) fail('businessMatch not object')
  else {
    if (!isNonEmptyString(bm.businessName)) fail('businessMatch.businessName empty')
    const offer = bm.firstOffer
    if (!isObj(offer)) fail('businessMatch.firstOffer not object')
    else {
      if (!isNonEmptyString(offer.name)) fail('firstOffer.name empty')
      if (!isFiniteNonNegative(offer.price)) fail('firstOffer.price')
      if (typeof offer.cadence !== 'string' || !CADENCE.has(offer.cadence)) {
        fail('firstOffer.cadence not monthly|weekly|one-time')
      }
      if (!isNonEmptyString(offer.description)) fail('firstOffer.description empty')
    }
    if (!Array.isArray(bm.rationale) || bm.rationale.length !== 3) {
      fail('businessMatch.rationale length must be 3')
    } else if (!bm.rationale.every(isNonEmptyString)) {
      fail('rationale entries must be non-empty strings')
    } else {
      rationaleStrings = bm.rationale as string[]
    }
    const ptf = bm.pathToFreedom
    if (!isObj(ptf)) fail('pathToFreedom not object')
    else {
      if (!isFiniteNonNegative(ptf.subscribersNeeded)) fail('pathToFreedom.subscribersNeeded')
      if (!isFiniteNonNegative(ptf.revenuePerSubscriber)) fail('pathToFreedom.revenuePerSubscriber')
    }
  }

  // sprint
  const sprint = payload.sprint
  let sprintDays: Array<Record<string, unknown>> = []
  if (!isObj(sprint)) fail('sprint not object')
  else {
    if (!isIsoDate(sprint.startDate)) fail('sprint.startDate not ISO date')
    if (!Array.isArray(sprint.days) || sprint.days.length !== 14) {
      fail('sprint.days length must be 14')
    } else {
      sprint.days.forEach((d, idx) => {
        if (!isObj(d)) { fail(`sprint.days[${idx}] not object`); return }
        sprintDays[idx] = d
        if (d.dayNumber !== idx + 1) fail(`sprint.days[${idx}].dayNumber must be ${idx + 1}`)
        if (!isIsoDate(d.date)) fail(`sprint.days[${idx}].date`)
        if (!isNonEmptyString(d.task)) fail(`sprint.days[${idx}].task empty`)
        if (!isFiniteNonNegative(d.estimatedMinutes)) fail(`sprint.days[${idx}].estimatedMinutes`)
        if (typeof d.category !== 'string' || !CATEGORY_SET.has(d.category as SprintDayCategory)) {
          fail(`sprint.days[${idx}].category invalid (must be one of ${SPRINT_DAY_CATEGORIES.join(' | ')})`)
        }
      })
    }
  }

  // Sprint structural rules (Tomorrow-Morning Method)
  if (sprintDays.length === 14) {
    const cat = (i: number) => sprintDays[i]?.category as string | undefined

    if (cat(0) !== 'customer-facing') {
      fail('sprint.days[0].category must be "customer-facing"')
    }
    const days1to3 = [0, 1, 2].map(cat)
    if (!days1to3.includes('customer-facing')) {
      fail('At least one of Days 1-3 must have category "customer-facing"')
    }
    const days1to7 = [0, 1, 2, 3, 4, 5, 6].map(cat)
    if (!days1to7.includes('customer-conversation')) {
      fail('At least one of Days 1-7 must have category "customer-conversation"')
    }
    const days1to10 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(cat)
    if (!days1to10.includes('offer-delivery')) {
      fail('At least one of Days 1-10 must have category "offer-delivery"')
    }
    // Days 1-10 may not be infrastructure
    days1to10.forEach((c, i) => {
      if (c === 'infrastructure') fail(`Day ${i + 1} category cannot be "infrastructure" (must compress into Days 11-14 or sub-tasks)`)
    })
  }

  // roadmap
  const rm = payload.roadmap
  let month3HoursPerWeek: number | null = null
  if (!isObj(rm)) fail('roadmap not object')
  else if (!Array.isArray(rm.months) || rm.months.length !== 3) {
    fail('roadmap.months length must be 3')
  } else {
    rm.months.forEach((m, idx) => {
      if (!isObj(m)) { fail(`roadmap.months[${idx}] not object`); return }
      if (m.monthNumber !== idx + 1) fail(`roadmap.months[${idx}].monthNumber must be ${idx + 1}`)
      if (!isNonEmptyString(m.title)) fail(`roadmap.months[${idx}].title empty`)
      if (!isFiniteNonNegative(m.subscriberGoal)) fail(`roadmap.months[${idx}].subscriberGoal`)
      if (!isFiniteNonNegative(m.revenueTarget)) fail(`roadmap.months[${idx}].revenueTarget`)
      if (!isFiniteNonNegative(m.hoursRequired)) fail(`roadmap.months[${idx}].hoursRequired`)
      if (!isFiniteNonNegative(m.estimatedHoursPerWeek)) fail(`roadmap.months[${idx}].estimatedHoursPerWeek`)
      if (!isNonEmptyString(m.keyMilestone)) fail(`roadmap.months[${idx}].keyMilestone empty`)
      if (idx === 2 && typeof m.estimatedHoursPerWeek === 'number') {
        month3HoursPerWeek = m.estimatedHoursPerWeek
      }
    })
  }

  // Feasibility cross-check
  const operatorInputs = (payload.operator as Record<string, unknown> | undefined)?.inputs as
    Record<string, unknown> | undefined
  const operatorHpw = typeof operatorInputs?.hoursPerWeek === 'number'
    ? (operatorInputs.hoursPerWeek as number)
    : null
  if (operatorHpw != null && month3HoursPerWeek != null && month3HoursPerWeek > operatorHpw) {
    const flagged = rationaleStrings.some(s => s.includes('FEASIBILITY FLAG'))
    if (!flagged) {
      fail('Feasibility mismatch: roadmap requires more hours than user has, no flag set')
    }
  }

  // leads
  const leads = payload.leads
  let scriptTemplates: string[] = []
  if (!isObj(leads)) fail('leads not object')
  else {
    if (!Array.isArray(leads.platforms) || leads.platforms.length < 5 || leads.platforms.length > 7) {
      fail('leads.platforms must have 5-7 entries')
    } else if (!leads.platforms.every(isNonEmptyString)) {
      fail('leads.platforms entries must be non-empty strings')
    } else {
      // Fabrication: parenthetical member counts on platforms
      ;(leads.platforms as string[]).forEach((p, i) => {
        if (PARENTHETICAL_COUNT_REGEX.test(p)) {
          fail(`leads.platforms[${i}] contains a parenthetical member count (prohibited fabrication)`)
        }
      })
    }
    if (!Array.isArray(leads.searchSignals) || leads.searchSignals.length < 4 || leads.searchSignals.length > 6) {
      fail('leads.searchSignals must have 4-6 entries')
    } else if (!leads.searchSignals.every(isNonEmptyString)) {
      fail('leads.searchSignals entries must be non-empty strings')
    }
    if (!Array.isArray(leads.scripts) || leads.scripts.length !== 2) {
      fail('leads.scripts length must be 2')
    } else {
      const types = new Set<string>()
      leads.scripts.forEach((s, idx) => {
        if (!isObj(s)) { fail(`leads.scripts[${idx}] not object`); return }
        if (typeof s.type !== 'string' || !SCRIPT_TYPES.has(s.type)) fail(`leads.scripts[${idx}].type`)
        else types.add(s.type)
        if (!isNonEmptyString(s.channel)) fail(`leads.scripts[${idx}].channel empty`)
        if (!isNonEmptyString(s.template)) fail(`leads.scripts[${idx}].template empty`)
        if (typeof s.template === 'string') scriptTemplates.push(s.template)
      })
      if (!types.has('cold') || !types.has('warm')) fail('leads.scripts must include one cold and one warm')
    }
  }

  // Fabrication scan across script templates
  scriptTemplates.forEach((t, i) => {
    if (PARENTHETICAL_COUNT_REGEX.test(t)) {
      fail(`leads.scripts[${i}].template contains a parenthetical member count (prohibited fabrication)`)
    }
    if (MONTH_REGEX.test(t)) {
      fail(`leads.scripts[${i}].template contains a specific month name (prohibited fabrication)`)
    }
    if (DECIMAL_PERCENT_REGEX.test(t)) {
      fail(`leads.scripts[${i}].template contains a specific decimal percentage (prohibited fabrication)`)
    }
  })

  // agentContext
  const ag = payload.agentContext
  if (!isObj(ag)) fail('agentContext not object')
  else {
    if (!isNonEmptyString(ag.greeting)) fail('agentContext.greeting empty')
    if (typeof ag.greeting === 'string' && PLACEHOLDER_REGEX.test(ag.greeting)) {
      fail('agentContext.greeting still contains unreplaced {{SPRINT_START_DATE}} placeholder')
    }
    if (typeof ag.greeting === 'string' &&
        !PLACEHOLDER_REGEX.test(ag.greeting) &&
        !RESOLVED_YEAR_REGEX.test(ag.greeting)) {
      fail('Greeting missing required date reference (no placeholder and no resolved date)')
    }
    if (!Array.isArray(ag.quickReplies) || ag.quickReplies.length !== 3) {
      fail('agentContext.quickReplies length must be 3')
    } else if (!ag.quickReplies.every(isNonEmptyString)) {
      fail('quickReplies entries must be non-empty strings')
    }
    const ks = ag.knownState
    if (!isObj(ks)) fail('agentContext.knownState not object')
    else {
      if (!isNonEmptyString(ks.businessName)) fail('knownState.businessName empty')
      if (!isFiniteNonNegative(ks.freedomTarget)) fail('knownState.freedomTarget')
      if (!isIsoDate(ks.sprintStartDate)) fail('knownState.sprintStartDate')
      if (!isFiniteNonNegative(ks.currentDay)) fail('knownState.currentDay')
    }
  }

  // "Not sure" niche handling
  const nicheRaw = operatorInputs?.nicheSignal
  if (typeof nicheRaw === 'string' && nicheRaw.trim().toLowerCase() === 'not sure') {
    const greetingLower = isNonEmptyString((ag as Record<string, unknown> | undefined)?.greeting)
      ? (((ag as Record<string, unknown>).greeting as string).toLowerCase())
      : ''
    const greetingHasMarker =
      greetingLower.includes('i picked') || greetingLower.includes('starter niche')
    if (!greetingHasMarker) {
      fail('Not sure niche input not handled explicitly: greeting missing "I picked" or "starter niche"')
    }
    const replies = Array.isArray((ag as Record<string, unknown> | undefined)?.quickReplies)
      ? ((ag as Record<string, unknown>).quickReplies as unknown[])
      : []
    const replyMatch = replies.some(r =>
      typeof r === 'string' && /different niche|pick.*niche|change.*niche/i.test(r)
    )
    if (!replyMatch) {
      fail('Not sure niche input not handled explicitly: quickReplies missing a niche-change option')
    }
  }

  return { ok: reasons.length === 0, reasons }
}

export function validateAssessmentPayload(payload: unknown): payload is AssessmentPayload {
  return describeAssessmentPayload(payload).ok
}
