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
