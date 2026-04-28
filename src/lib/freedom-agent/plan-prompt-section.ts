import type { FreedomAgentPlanBundle } from '@/lib/freedom-agent/load-plan-for-session'

/**
 * Rich plan context for Claude — references outputs + inputs so the agent does not re-ask.
 */
export function buildFreedomPlanPromptSection(bundle: FreedomAgentPlanBundle | null | undefined): string {
  if (!bundle?.outputs) {
    return `
## Freedom OS plan
The user has not attached a completed Freedom OS plan. Encourage them to run the planner at /free/freedom-os when relevant, but still give helpful general advice.
`
  }

  const { inputs, outputs } = bundle
  const o = outputs as Record<string, unknown>
  const primary = o.primary as Record<string, unknown> | undefined
  const secondary = o.secondary as Record<string, unknown> | undefined
  const offer = o.offer as Record<string, unknown> | undefined
  const sprint = Array.isArray(o.sprint) ? o.sprint : []

  const niche =
    (inputs.nicheInterest as string) ||
    (inputs.niche_interest as string) ||
    ''
  const hours =
    inputs.availableHours != null
      ? inputs.availableHours
      : inputs.hours_per_week != null
        ? inputs.hours_per_week
        : ''
  const biz =
    (inputs.preferredBusiness as string) ||
    (inputs.preferred_business_type as string) ||
    ''

  const freedomNumber = o.freedomNumber
  const runwayMonths = o.runwayMonths

  const sprintLines = sprint
    .slice(0, 4)
    .map((block: unknown) => {
      const s = block as Record<string, unknown>
      const days = s.days != null ? String(s.days) : ''
      const tasks = Array.isArray(s.tasks) ? (s.tasks as string[]).map(t => `    - ${t}`).join('\n') : ''
      return days ? `${days}\n${tasks}` : tasks
    })
    .filter(Boolean)
    .join('\n')

  return `
## Their Freedom OS plan (AUTHORITATIVE — reference these specifics; do not ask them to repeat hours, niche, runway, model, or offer unless clarifying a new detail)
- **Recommended business model:** ${primary?.name ?? '—'} — ${primary?.description ?? ''}
- **Alternative model:** ${secondary?.name ?? '—'} — ${secondary?.description ?? ''}
- **Starter offer:** ${offer?.name ?? '—'}
- **Who it’s for:** ${offer?.target ?? '—'}
- **Promise:** ${offer?.promise ?? '—'}
- **Price band:** ${offer?.priceRange ?? '—'}
- **Niche / focus:** ${niche || 'not specified'}
- **Preferred business type (input):** ${biz || 'not specified'}
- **Hours per week:** ${hours !== '' ? hours : 'not specified'}
- **Freedom number (monthly target):** ${freedomNumber != null ? `$${Number(freedomNumber).toLocaleString()}/mo` : 'not specified'}
- **Runway (months):** ${runwayMonths != null ? String(runwayMonths) : 'not specified'}

### 14-day sprint (from their plan — use for weekly homework ideas)
${sprintLines || '(No sprint blocks in plan JSON)'}

When coaching, tie suggestions to this model, offer, and sprint. Ask follow-ups that go deeper (execution blockers, fear, distribution), not basic fact-finding they already completed in Freedom OS.
`
}
