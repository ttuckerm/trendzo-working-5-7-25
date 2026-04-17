import { ComponentType, getComponentsForIntent } from './component-registry'
import { fetchComponentData } from './component-data-fetcher'

export type RenderStrategy = 'lead-with-components' | 'lead-with-text' | 'components-only'

export interface IntentClassification {
  intents: string[]
  suggestedComponents: ComponentType[]
  componentData: Record<string, Record<string, unknown>>
  renderStrategy: RenderStrategy
}

interface ClassifyContext {
  role: string
  tier: string
  recentComponents: ComponentType[]
  agencyId?: string
  creatorId?: string
  briefId?: string
}

/** Role-gated components — only certain roles/tiers can see these */
const ROLE_GATES: Partial<Record<ComponentType, { roles?: string[]; tiers?: string[] }>> = {
  [ComponentType.TRAINER_RESULT]: { roles: ['chairman', 'admin', 'owner'] },
  [ComponentType.NETWORK_INSIGHT]: { tiers: ['enterprise', 'Enterprise'] },
}

/** Patterns that signal data-heavy queries → lead-with-components */
const DATA_PATTERNS = /\b(show me|what are|what happened|what did|list|display|give me|numbers|stats|kpi|scorecard|calendar|briefs|overview|metrics|report|overnight|brief me|catch me up)\b/i

/** Patterns that signal conversational queries → lead-with-text */
const CONVERSATIONAL_PATTERNS = /\b(how should|why is|help me|what do you think|explain|recommend|suggest|strategy|advice)\b/i

/** Patterns that signal pure action requests → components-only */
const ACTION_PATTERNS = /\b(approve|reject|confirm|send|push|select|generate brief|dismiss)\b/i

/**
 * Classify operator intent and resolve which Clay components to render.
 *
 * 1. Fast keyword match via component registry
 * 2. Role/tier gating
 * 3. Dedup against recent components (last 2 turns)
 * 4. Fetch data for each selected component
 * 5. Determine render strategy
 */
export async function classifyIntent(
  message: string,
  context: ClassifyContext,
): Promise<IntentClassification> {
  // Step 1: keyword match
  let candidates = getComponentsForIntent(message)

  // Step 2: role/tier gating — remove components the operator can't see
  candidates = candidates.filter((type) => {
    const gate = ROLE_GATES[type]
    if (!gate) return true
    if (gate.roles && !gate.roles.includes(context.role)) return false
    if (gate.tiers && !gate.tiers.includes(context.tier)) return false
    return true
  })

  // Step 3: avoid repeating components from last 2 responses
  candidates = candidates.filter((type) => !context.recentComponents.includes(type))

  // Step 4: determine intents (human-readable labels)
  const intents = deriveIntents(message)

  // Step 5: determine render strategy
  const renderStrategy = classifyStrategy(message)

  // Step 6: fetch data for each candidate (parallel)
  const componentData: Record<string, Record<string, unknown>> = {}
  const fetchCtx = {
    agencyId: context.agencyId,
    creatorId: context.creatorId,
    date: new Date().toISOString().split('T')[0],
    briefId: context.briefId,
  }

  await Promise.allSettled(
    candidates.map(async (type) => {
      const data = await fetchComponentData(type, fetchCtx)
      if (data && Object.keys(data).length > 0) {
        componentData[type] = data
      }
    }),
  )

  // Only keep components that actually have data
  const suggestedComponents = candidates.filter((type) => componentData[type])

  return {
    intents,
    suggestedComponents,
    componentData,
    renderStrategy,
  }
}

function classifyStrategy(message: string): RenderStrategy {
  if (ACTION_PATTERNS.test(message)) return 'components-only'
  if (DATA_PATTERNS.test(message)) return 'lead-with-components'
  if (CONVERSATIONAL_PATTERNS.test(message)) return 'lead-with-text'
  // Default: lead with text for ambiguous queries
  return 'lead-with-text'
}

function deriveIntents(message: string): string[] {
  const intents: string[] = []
  const lower = message.toLowerCase()

  if (/morning|brief me|overnight|catch me up|what happened/.test(lower)) intents.push('morning-briefing')
  if (/brief|content|generate|draft/.test(lower)) intents.push('content-brief')
  if (/creator|profile|deep dive|tell me about|who is/.test(lower)) intents.push('creator-analysis')
  if (/kpi|metric|stat|number|overview|dashboard/.test(lower)) intents.push('kpi-review')
  if (/trend|viral|what's hot|emerging|rising/.test(lower)) intents.push('trend-detection')
  if (/timeline|history|progress|over time/.test(lower)) intents.push('performance-tracking')
  if (/momentum|decay|declining|falling/.test(lower)) intents.push('momentum-warning')
  if (/training|model|retrain|accuracy|spearman/.test(lower)) intents.push('training-review')
  if (/alert|warning|urgent|critical/.test(lower)) intents.push('alert-review')
  if (/network|insight|pattern|agencies|cross-agency/.test(lower)) intents.push('network-intelligence')
  if (/remember|memory|recall|last time/.test(lower)) intents.push('memory-recall')
  if (/calendar|schedule|upcoming|this week/.test(lower)) intents.push('calendar-review')
  if (/scorecard|grade|report card|agency performance/.test(lower)) intents.push('agency-scorecard')
  if (/approve|confirm|send|push|execute/.test(lower)) intents.push('action-confirmation')
  if (/variant|compare|alternative|a\/b|which one/.test(lower)) intents.push('variant-comparison')

  if (intents.length === 0) intents.push('general')
  return intents
}
