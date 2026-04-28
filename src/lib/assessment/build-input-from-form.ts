// Pure form → AssessmentInput mapper for /free/freedom-os.
// Strips formatting, validates ranges, and returns either a clean
// AssessmentInput ready for /api/assessment/generate or a field-keyed
// error map the form can render inline.

import type { AssessmentInput, RiskTolerance } from '@/types/assessment'

export interface FormState {
  firstName: string
  // Numeric fields can arrive as strings ("$3,000", "10 hrs"); the mapper
  // sanitizes before parsing.
  hoursPerWeek: number | string
  monthlyIncome: number | string
  monthlyExpenses: number | string
  runwayMonths: number | string
  skillProfile: string
  riskTolerance: 'low' | 'medium' | 'high' | ''
  audienceAccess: string
  nicheSignal: string
}

export type BuildInputResult =
  | { ok: true; input: AssessmentInput; freedomMultiplier: number; warnings?: string[] }
  | { ok: false; errors: Partial<Record<keyof FormState, string>> }

const NAME_REGEX = /^[a-zA-Z\s\-']+$/

function parseNumeric(raw: number | string): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  if (typeof raw !== 'string') return null
  const cleaned = raw.replace(/[\s$,]/g, '')
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

const RISK_MAP: Record<'low' | 'medium' | 'high', RiskTolerance> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export function buildInputFromForm(
  form: FormState,
  freedomMultiplier: number,
): BuildInputResult {
  const errors: Partial<Record<keyof FormState, string>> = {}

  const firstName = (form.firstName ?? '').trim()
  if (firstName.length < 1 || firstName.length > 50) {
    errors.firstName = 'Enter your first name (1–50 characters).'
  } else if (!NAME_REGEX.test(firstName)) {
    errors.firstName = 'Use letters, spaces, apostrophes, or hyphens only.'
  }

  const hoursPerWeek = parseNumeric(form.hoursPerWeek)
  if (hoursPerWeek == null || hoursPerWeek < 1 || hoursPerWeek > 80) {
    errors.hoursPerWeek = 'Enter a number between 1 and 80.'
  }

  const monthlyIncome = parseNumeric(form.monthlyIncome)
  if (monthlyIncome == null || monthlyIncome < 0 || monthlyIncome > 500000) {
    errors.monthlyIncome = 'Enter a dollar amount between 0 and 500,000.'
  }

  const monthlyExpenses = parseNumeric(form.monthlyExpenses)
  if (monthlyExpenses == null || monthlyExpenses < 1 || monthlyExpenses > 100000) {
    errors.monthlyExpenses = 'Enter a dollar amount between 1 and 100,000.'
  }

  const runwayMonths = parseNumeric(form.runwayMonths)
  if (runwayMonths == null || runwayMonths < 0 || runwayMonths > 120) {
    errors.runwayMonths = 'Enter a number of months between 0 and 120.'
  }

  const skillProfile = (form.skillProfile ?? '').trim()
  if (skillProfile.length < 3 || skillProfile.length > 200) {
    errors.skillProfile = 'Describe your skills in 3–200 characters.'
  }

  let risk: RiskTolerance | null = null
  if (form.riskTolerance === 'low' || form.riskTolerance === 'medium' || form.riskTolerance === 'high') {
    risk = RISK_MAP[form.riskTolerance]
  } else {
    errors.riskTolerance = 'Pick a risk tolerance.'
  }

  // audienceAccess: blank/whitespace defaults to "None yet" so the user can
  // skip the field and still ship a valid payload.
  const audienceAccessTrim = (form.audienceAccess ?? '').trim()
  const audienceAccess = audienceAccessTrim === '' ? 'None yet' : audienceAccessTrim
  if (audienceAccess.length < 3 || audienceAccess.length > 300) {
    errors.audienceAccess = 'Describe your audience access in 3–300 characters.'
  }

  // nicheSignal: blank/whitespace defaults to "Not sure" — handled explicitly
  // by the AI prompt's NICHE HANDLING section.
  const nicheTrim = (form.nicheSignal ?? '').trim()
  const nicheSignal = nicheTrim === '' ? 'Not sure' : nicheTrim
  if (nicheSignal.length < 3 || nicheSignal.length > 200) {
    errors.nicheSignal = 'Describe what you want to build in 3–200 characters.'
  }

  if (!Number.isFinite(freedomMultiplier) || freedomMultiplier < 1.0 || freedomMultiplier > 3.0) {
    // Surfaced under nicheSignal since the slider has no field of its own;
    // in practice the form clamps the slider so this is a defensive guard.
    errors.nicheSignal = errors.nicheSignal ?? 'Freedom multiplier must be between 1.0 and 3.0.'
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  // Soft warning: high savings but zero runway looks contradictory. Allowed,
  // but flagged so the form can show a non-blocking note if it wants to.
  const warnings: string[] = []
  if (
    monthlyIncome != null &&
    monthlyExpenses != null &&
    runwayMonths != null &&
    monthlyIncome >= monthlyExpenses + 5000 &&
    runwayMonths < 1
  ) {
    warnings.push('Income is well above expenses but runway is under 1 month — double-check savings.')
  }

  return {
    ok: true,
    input: {
      firstName,
      hoursPerWeek: hoursPerWeek as number,
      monthlyIncome: monthlyIncome as number,
      monthlyExpenses: monthlyExpenses as number,
      runwayMonths: runwayMonths as number,
      skillProfile,
      riskTolerance: risk as RiskTolerance,
      audienceAccess,
      nicheSignal,
      freedomMultiplier,
    },
    freedomMultiplier,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}
