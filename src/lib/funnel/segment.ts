export type FunnelSegment = 'A' | 'B' | 'C' | 'D';

export interface FreedomOsInputs {
  hours_per_week: number;
  business_type: string;
  experience_level: string;
  risk_tolerance: string;
  skill_leverage: string;
  monthly_income?: number;
  monthly_expenses?: number;
  savings_runway?: number;
  niche_interest?: string;
  target_monthly_income?: number;
  freedom_multiplier?: number;
}

export const SEGMENT_LABELS: Record<FunnelSegment, string> = {
  A: 'curious-browser',
  B: 'side-hustle-seeker',
  C: 'business-builder',
  D: 'agency-operator',
};

/**
 * Classify a Freedom OS lead into a funnel segment.
 * Evaluated in order — first match wins.
 */
export function classifyLead(inputs: FreedomOsInputs): FunnelSegment {
  const { hours_per_week, business_type, experience_level } = inputs;

  // D — agency operator
  if (
    experience_level === 'Already tried before' &&
    business_type === 'Service' &&
    hours_per_week >= 15
  ) {
    return 'D';
  }

  // C — business builder
  if (hours_per_week >= 10 && business_type !== 'Not sure') {
    return 'C';
  }

  // B — side hustle seeker
  if (
    hours_per_week >= 5 ||
    (experience_level !== 'Beginner' && business_type !== 'Not sure')
  ) {
    return 'B';
  }

  // A — curious browser (everyone else)
  return 'A';
}

/**
 * Map raw FreedomOSTool Inputs to the normalised shape used by classifyLead.
 * Keeps the segmentation function decoupled from the UI field names.
 */
export function mapInputsForSegmentation(raw: Record<string, unknown>): FreedomOsInputs {
  return {
    hours_per_week: Number(raw.availableHours ?? 0),
    business_type: String(raw.preferredBusiness ?? 'Not sure'),
    experience_level: String(raw.comfortLevel ?? 'Beginner'),
    risk_tolerance: String(raw.riskTolerance ?? 'Medium'),
    skill_leverage: String(raw.skillLeverage ?? 'Not sure'),
    monthly_income: raw.monthlyIncome != null ? Number(raw.monthlyIncome) : undefined,
    monthly_expenses: raw.monthlyExpenses != null ? Number(raw.monthlyExpenses) : undefined,
    savings_runway: raw.savingsMonths != null ? Number(raw.savingsMonths) : undefined,
    niche_interest: raw.nicheInterest != null ? String(raw.nicheInterest) : undefined,
    target_monthly_income: raw.targetIncome != null ? Number(raw.targetIncome) : undefined,
    freedom_multiplier: raw.freedomMultiplier != null ? Number(raw.freedomMultiplier) : undefined,
  };
}

// ─── New funnel: Escape Assessment escape-velocity segmentation ───────────
//
// The Escape Assessment form (src/app/(public)/free/freedom-os/FreedomOSTool.tsx)
// dropped the old `business_type` / `experience_level` enums in favour of
// free-text `skillProfile` and `nicheSignal`. classifyLead() above can't read
// those, so we have a dedicated classifier for the new shape.
//
// Output segments express *escape velocity* — how close the user is to
// monetising the work that gets them out of their day job. The names match
// Beehiiv tag/automation slugs:
//
//   ready-to-scale     — qualified, audience + niche + serious hours
//   building-momentum  — committed, real niche, may not have audience yet
//   stuck-zero         — low momentum but signals capability or desire
//   tire-kicker        — default fallback; long warming or eventual unsubscribe
//
// Threshold philosophy: bias the *bulk* of engaged respondents into the
// middle two buckets (`building-momentum` and `stuck-zero`) so nurture flows
// stay personalised without stuffing everyone into `tire-kicker`.

export type EscapeSegment =
  | 'ready-to-scale'
  | 'building-momentum'
  | 'stuck-zero'
  | 'tire-kicker';

export interface EscapeAssessmentInputsLite {
  hoursPerWeek: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  runwayMonths: number;
  skillProfile: string;
  riskTolerance: 'Low' | 'Medium' | 'High' | string;
  audienceAccess: string;
  nicheSignal: string;
}

function isPlaceholderText(s: string | undefined | null): boolean {
  if (!s) return true;
  const t = s.trim().toLowerCase();
  return (
    t === '' ||
    t === 'not sure' ||
    t === 'none yet' ||
    t === 'idk' ||
    t === 'no idea' ||
    t === 'none' ||
    t === 'n/a' ||
    t === 'na'
  );
}

// Established-platform keywords that count as "real audience access" even
// when no number is mentioned. Case-insensitive substring match.
const PLATFORM_KEYWORDS = [
  'linkedin',
  'newsletter',
  'email list',
  'mailing list',
  'substack',
  'beehiiv',
  'youtube',
  'subscribers',
  'podcast',
  'instagram',
  'tiktok',
  'twitter',
  'x followers',
  'community',
  'discord',
  'reddit',
] as const;

function hasEstablishedPlatform(audience: string): boolean {
  const lower = audience.toLowerCase();
  return PLATFORM_KEYWORDS.some(kw => lower.includes(kw));
}

// Pull the largest plausible follower/subscriber number from a free-text
// audience-access field. "5,000 LinkedIn followers" → 5000. Returns 0 when
// no number is found.
function extractAudienceCount(audience: string): number {
  const matches = audience.match(/[\d][\d,\.]*\s*[kKmM]?/g);
  if (!matches) return 0;
  let max = 0;
  for (const raw of matches) {
    const cleaned = raw.replace(/[, ]/g, '');
    const lastChar = cleaned.slice(-1).toLowerCase();
    let multiplier = 1;
    let numericPart = cleaned;
    if (lastChar === 'k') {
      multiplier = 1_000;
      numericPart = cleaned.slice(0, -1);
    } else if (lastChar === 'm') {
      multiplier = 1_000_000;
      numericPart = cleaned.slice(0, -1);
    }
    const n = Number(numericPart);
    if (Number.isFinite(n) && n > 0) {
      const value = Math.round(n * multiplier);
      if (value > max) max = value;
    }
  }
  return max;
}

/**
 * Classify a completed Escape Assessment into one of four escape-velocity
 * segments. Order matters — first match wins, strongest signal first.
 *
 * Thresholds:
 *
 *   ready-to-scale
 *     hoursPerWeek        ≥ 15
 *     audienceAccess      contains a number ≥ 1000  OR
 *                         contains an established-platform keyword
 *                         (LinkedIn, newsletter, podcast, YouTube, etc.)
 *     skillProfile        ≥ 30 chars and not a placeholder
 *     nicheSignal         not a placeholder
 *
 *   building-momentum
 *     hoursPerWeek        8 – 15
 *     nicheSignal         not a placeholder
 *     skillProfile        ≥ 20 chars
 *     (audience optional)
 *
 *   stuck-zero
 *     hoursPerWeek        3 – 8                     OR
 *     nicheSignal vague   AND skillProfile ≥ 20 chars
 *
 *   tire-kicker
 *     fallback — typically hoursPerWeek < 3, vague niche,
 *     no audience, thin or empty skill profile.
 */
export function classifyEscapeAssessment(
  inputs: EscapeAssessmentInputsLite,
): EscapeSegment {
  const hours = Number.isFinite(inputs.hoursPerWeek) ? inputs.hoursPerWeek : 0;
  const skill = (inputs.skillProfile ?? '').trim();
  const niche = inputs.nicheSignal ?? '';
  const audience = inputs.audienceAccess ?? '';

  const hasNicheDirection = !isPlaceholderText(niche);
  const hasAudienceText = !isPlaceholderText(audience);
  const audienceCount = extractAudienceCount(audience);
  const audienceIsConcrete =
    hasAudienceText &&
    (audienceCount >= 1000 || hasEstablishedPlatform(audience));
  const skillIsDetailed = skill.length >= 30;
  const skillIsDescriptive = skill.length >= 20;

  // ── ready-to-scale ──────────────────────────────────────────────────
  if (
    hours >= 15 &&
    audienceIsConcrete &&
    skillIsDetailed &&
    hasNicheDirection
  ) {
    return 'ready-to-scale';
  }

  // ── building-momentum ───────────────────────────────────────────────
  if (
    hours >= 8 &&
    hours <= 15 &&
    hasNicheDirection &&
    skillIsDescriptive
  ) {
    return 'building-momentum';
  }
  // Also catch the >15h cohort that didn't quite clear the audience bar —
  // they're committed and have a niche, just not yet visible.
  if (hours > 15 && hasNicheDirection && skillIsDescriptive) {
    return 'building-momentum';
  }

  // ── stuck-zero ──────────────────────────────────────────────────────
  // Low momentum, but capability or signal of desire.
  if (hours >= 3 && hours < 8) {
    return 'stuck-zero';
  }
  if (!hasNicheDirection && skillIsDescriptive) {
    return 'stuck-zero';
  }

  // ── tire-kicker (default) ───────────────────────────────────────────
  return 'tire-kicker';
}
