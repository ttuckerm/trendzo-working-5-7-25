import type { SupabaseClient } from '@supabase/supabase-js'
import { classifyLead, mapInputsForSegmentation, type FunnelSegment } from '@/lib/funnel/segment'

type ToolInputsShape = Record<string, unknown>

/**
 * Map API/generate-route input keys to the shape expected by mapInputsForSegmentation.
 */
function apiRowInputsToSegmentRaw(inputs: Record<string, unknown>): ToolInputsShape {
  return {
    availableHours: Number(inputs.hours_per_week ?? 0),
    preferredBusiness: String(inputs.preferred_business_type ?? 'Not sure'),
    comfortLevel: String(inputs.experience_level ?? 'Beginner'),
    riskTolerance: String(inputs.risk_tolerance ?? 'Medium'),
    skillLeverage: String(inputs.skill_leverage ?? 'Not sure'),
    monthlyIncome: inputs.monthly_income,
    monthlyExpenses: inputs.monthly_expenses,
    savingsMonths: inputs.savings_runway_months,
    nicheInterest: inputs.niche_interest != null ? String(inputs.niche_interest) : undefined,
    targetIncome: inputs.target_monthly_income,
    freedomMultiplier: inputs.freedom_multiplier,
  }
}

/**
 * Stored on freedom_agent_sessions.freedom_os_plan — unified shape for prompts + niche templates.
 */
export type FreedomAgentPlanBundle = {
  inputs: ToolInputsShape
  outputs: Record<string, unknown>
  source?: 'freedom_os_plans' | 'freedom_os_saved_plans'
}

/**
 * Load a Freedom OS plan by id from freedom_os_plans (Claude) or freedom_os_saved_plans (legacy).
 */
export async function loadFreedomPlanById(
  supabase: SupabaseClient,
  planId: string,
): Promise<{ freedom_os_plan: FreedomAgentPlanBundle; segment: FunnelSegment } | null> {
  const { data: gen, error: genErr } = await supabase
    .from('freedom_os_plans')
    .select('inputs, plan')
    .eq('id', planId)
    .maybeSingle()

  if (!genErr && gen?.plan) {
    const planJson = gen.plan as Record<string, unknown>
    const outputs = planJson.outputs
    if (!outputs || typeof outputs !== 'object' || Array.isArray(outputs)) return null
    const rawInputs = (gen.inputs as Record<string, unknown>) || {}
    const segment = classifyLead(mapInputsForSegmentation(apiRowInputsToSegmentRaw(rawInputs)))
    return {
      freedom_os_plan: {
        inputs: apiRowInputsToSegmentRaw(rawInputs),
        outputs: outputs as Record<string, unknown>,
        source: 'freedom_os_plans',
      },
      segment,
    }
  }

  const { data: saved, error: savedErr } = await supabase
    .from('freedom_os_saved_plans')
    .select('plan, segment')
    .eq('id', planId)
    .maybeSingle()

  if (savedErr || !saved?.plan) return null

  const p = saved.plan as Record<string, unknown>
  const outputs = p.outputs
  const inputs = (p.inputs as Record<string, unknown>) || {}
  if (!outputs || typeof outputs !== 'object' || Array.isArray(outputs)) return null

  let segment: FunnelSegment
  const seg = saved.segment as string | null
  if (seg && ['A', 'B', 'C', 'D'].includes(seg)) {
    segment = seg as FunnelSegment
  } else {
    segment = classifyLead(mapInputsForSegmentation(inputs))
  }

  return {
    freedom_os_plan: {
      inputs,
      outputs: outputs as Record<string, unknown>,
      source: 'freedom_os_saved_plans',
    },
    segment,
  }
}
