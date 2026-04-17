/**
 * Clay Component Registry — Formless UI component catalog
 *
 * Defines all renderable component types the AI can select from
 * when composing dynamic visual responses in the Clay UI.
 */

export enum ComponentType {
  MORNING_BRIEF = 'MORNING_BRIEF',
  CONTENT_BRIEF = 'CONTENT_BRIEF',
  CREATOR_PROFILE = 'CREATOR_PROFILE',
  KPI_SUMMARY = 'KPI_SUMMARY',
  TREND_CARD = 'TREND_CARD',
  PERFORMANCE_TIMELINE = 'PERFORMANCE_TIMELINE',
  MOMENTUM_DECAY = 'MOMENTUM_DECAY',
  TRAINER_RESULT = 'TRAINER_RESULT',
  PROACTIVE_ALERT = 'PROACTIVE_ALERT',
  NETWORK_INSIGHT = 'NETWORK_INSIGHT',
  MEMORY_FACT = 'MEMORY_FACT',
  CALENDAR_SNIPPET = 'CALENDAR_SNIPPET',
  AGENCY_SCORECARD = 'AGENCY_SCORECARD',
  ACTION_CONFIRMATION = 'ACTION_CONFIRMATION',
  VARIANT_COMPARISON = 'VARIANT_COMPARISON',
}

export interface ComponentSpec {
  type: ComponentType
  /** Higher priority = rendered first. Range 1–100. */
  priority: number
  /** Data keys this component needs to render fully */
  dataRequirements: string[]
  /** Lowercase phrases that trigger this component */
  triggerPhrases: string[]
  description: string
}

export const COMPONENT_CATALOG: ComponentSpec[] = [
  {
    type: ComponentType.MORNING_BRIEF,
    priority: 95,
    dataRequirements: ['alerts', 'pendingBriefs', 'performanceSummary'],
    triggerPhrases: [
      'morning', 'brief', 'overnight', 'what happened', 'show me today',
      'brief me', 'good morning', 'what needs my attention', 'daily',
      'catch me up', 'what did i miss',
    ],
    description: 'Daily overview with alerts, pending briefs, and overnight changes',
  },
  {
    type: ComponentType.CONTENT_BRIEF,
    priority: 85,
    dataRequirements: ['briefContent', 'creatorName', 'eventName'],
    triggerPhrases: [
      'content brief', 'brief for', 'generate brief', 'write a brief',
      'create brief', 'new brief', 'push brief', 'draft brief',
      'generate a brief', 'generate me a brief',
    ],
    description: 'Content brief card with talking points, hook, and angle',
  },
  {
    type: ComponentType.CREATOR_PROFILE,
    priority: 80,
    dataRequirements: ['creatorData', 'vpsHistory', 'nicheRanking'],
    triggerPhrases: [
      'creator', 'profile', 'deep dive', 'tell me about', 'who is',
      'show me', 'analyze', 'creator stats', 'about this creator',
    ],
    description: 'Full creator profile with VPS, niche ranking, and engagement',
  },
  {
    type: ComponentType.KPI_SUMMARY,
    priority: 90,
    dataRequirements: ['kpiMetrics'],
    triggerPhrases: [
      'kpi', 'metrics', 'numbers', 'stats', 'summary', 'overview',
      'how are we', 'how we doing', 'performance', 'dashboard',
    ],
    description: 'KPI grid with key agency metrics at a glance',
  },
  {
    type: ComponentType.TREND_CARD,
    priority: 75,
    dataRequirements: ['trendData', 'nicheVelocity'],
    triggerPhrases: [
      'trend', 'trending', 'viral', 'what\'s hot', 'emerging',
      'rising', 'niche velocity', 'cultural moment', 'wave',
      'cultural momentum', 'trend timing', 'cultural score',
    ],
    description: 'Trend detection card with velocity and relevance signals',
  },
  {
    type: ComponentType.PERFORMANCE_TIMELINE,
    priority: 70,
    dataRequirements: ['timelineData', 'dateRange'],
    triggerPhrases: [
      'timeline', 'over time', 'history', 'progress', 'trend line',
      'trajectory', 'graph', 'chart', 'evolution', 'performance',
    ],
    description: 'Performance timeline chart showing VPS/DPS over time',
  },
  {
    type: ComponentType.MOMENTUM_DECAY,
    priority: 88,
    dataRequirements: ['decayMetrics', 'creatorId'],
    triggerPhrases: [
      'momentum', 'decay', 'declining', 'dropping', 'falling',
      'losing steam', 'losing momentum', 'losing', 'slowdown', 'stalling', 'slip',
    ],
    description: 'Momentum decay warning with rate of decline and recommended actions',
  },
  {
    type: ComponentType.TRAINER_RESULT,
    priority: 60,
    dataRequirements: ['trainingMetrics', 'modelVersion'],
    triggerPhrases: [
      'training', 'model', 'retrain', 'accuracy', 'spearman',
      'xgboost', 'trainer', 'evaluation', 'ml',
    ],
    description: 'Training pipeline results with accuracy metrics',
  },
  {
    type: ComponentType.PROACTIVE_ALERT,
    priority: 92,
    dataRequirements: ['alertId', 'severity', 'title', 'body'],
    triggerPhrases: [
      'alert', 'warning', 'urgent', 'critical', 'attention',
      'flag', 'issue', 'platform alert', 'heads up',
      'something wrong', 'incident', 'outage',
    ],
    description: 'Platform alert with severity-coded border, affected entity, and action buttons',
  },
  {
    type: ComponentType.NETWORK_INSIGHT,
    priority: 55,
    dataRequirements: ['insightId', 'pattern', 'confidenceScore'],
    triggerPhrases: [
      'network', 'insight', 'pattern', 'agencies', 'cross-agency',
      'industry', 'benchmark', 'what are others doing',
      'network intelligence', 'enterprise insight',
    ],
    description: 'Network intelligence with cross-agency pattern detection and confidence scoring',
  },
  {
    type: ComponentType.MEMORY_FACT,
    priority: 50,
    dataRequirements: ['facts', 'entityName', 'tier'],
    triggerPhrases: [
      'remember', 'memory', 'recall', 'last time', 'previously',
      'you told me', 'we discussed', 'context', 'what do you know about',
      'background on', 'history with',
    ],
    description: 'Compact memory card surfacing hot/warm/cold facts about an entity',
  },
  {
    type: ComponentType.CALENDAR_SNIPPET,
    priority: 72,
    dataRequirements: ['date', 'scheduledActions'],
    triggerPhrases: [
      'calendar', 'schedule', 'upcoming', 'this week', 'next week',
      'what\'s coming', 'deadlines', 'when', 'today\'s schedule',
      'what\'s on', 'agenda', 'planned',
    ],
    description: 'Compact calendar snippet with scheduled actions, briefs due, and pending approvals',
  },
  {
    type: ComponentType.AGENCY_SCORECARD,
    priority: 82,
    dataRequirements: ['agencyName', 'scores', 'overallGrade'],
    triggerPhrases: [
      'scorecard', 'agency score', 'grade', 'report card',
      'overall', 'agency performance', 'how is the agency',
      'agency health', 'agency report', 'agency grade',
      'my agency', 'about my agency', 'about the agency',
    ],
    description: 'Agency scorecard with score bars, overall grade, trend indicator, and win/risk',
  },
  {
    type: ComponentType.ACTION_CONFIRMATION,
    priority: 65,
    dataRequirements: ['actionId', 'actionLabel', 'status'],
    triggerPhrases: [
      'confirm', 'approve', 'done', 'executed', 'completed',
      'do it', 'go ahead', 'proceed', 'confirmation',
    ],
    description: 'Compact action confirmation with status icon and confirm/cancel controls',
  },
  {
    type: ComponentType.VARIANT_COMPARISON,
    priority: 78,
    dataRequirements: ['briefId', 'variants'],
    triggerPhrases: [
      'variant', 'compare', 'alternative', 'a/b', 'which one',
      'options', 'versus', 'vs', 'side by side', 'pick a variant',
      'brief variants', 'which version',
    ],
    description: 'Side-by-side brief variant comparison with VPS deltas and select buttons',
  },
]

/**
 * Match user intent against trigger phrases and return ranked component types.
 * Returns highest-priority matches first, max 3 per response.
 */
export function getComponentsForIntent(intent: string): ComponentType[] {
  const lower = intent.toLowerCase()

  const matches = COMPONENT_CATALOG
    .filter((spec) =>
      spec.triggerPhrases.some((phrase) => lower.includes(phrase))
    )
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map((spec) => spec.type)

  return matches
}
