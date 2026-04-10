/**
 * Agent Personas — Named AI specialist attribution
 *
 * Pure UX labeling layer. Each persona maps to a class of
 * Atlas-generated content. No backend architecture changes —
 * just a config object that surfaces the right name on the right card.
 */

export interface AgentPersona {
  id: string
  name: string
  description: string
  /** Accent color for attribution text (matches card color system) */
  color: string
}

export const AGENT_PERSONAS: Record<string, AgentPersona> = {
  trend_scout: {
    id: 'trend_scout',
    name: 'Trend Scout',
    description: 'Cultural event detections, trend alerts, niche velocity data',
    color: '#00d4ff', // cyan
  },
  brief_architect: {
    id: 'brief_architect',
    name: 'Brief Architect',
    description: 'Generated briefs, content concepts, variant recommendations',
    color: '#2dd4a8', // green
  },
  performance_analyst: {
    id: 'performance_analyst',
    name: 'Performance Analyst',
    description: 'VPS predictions, accuracy tracking, momentum decay warnings, outperformance alerts',
    color: '#f4b942', // amber/gold
  },
  memory_keeper: {
    id: 'memory_keeper',
    name: 'Memory Keeper',
    description: 'Memory consolidation insights, personalized recommendations based on agency history',
    color: '#7b2ff7', // violet
  },
  schedule_optimizer: {
    id: 'schedule_optimizer',
    name: 'Schedule Optimizer',
    description: 'Posting time recommendations, calendar suggestions',
    color: '#f04a4d', // accent red
  },
} as const

/**
 * Resolve the agent persona for a morning brief card based on its type/priority.
 *
 * Rule: attribute to the PRIMARY trigger source.
 * - Outperformance alert → Performance Analyst (trigger: performance data)
 * - Momentum decay warning → Performance Analyst (trigger: performance data)
 * - Trend opportunity / emerging trend → Trend Scout (trigger: trend detection)
 * - New brief ready → Brief Architect (trigger: brief generation)
 */
export function getAgentForBriefCard(
  priorityType: string,
): AgentPersona {
  switch (priorityType) {
    case 'outperformance_alert':
      return AGENT_PERSONAS.performance_analyst
    case 'decay_warning':
      return AGENT_PERSONAS.performance_analyst
    case 'trend_opportunity':
      return AGENT_PERSONAS.trend_scout
    default:
      return AGENT_PERSONAS.brief_architect
  }
}

/**
 * Resolve the agent persona for a morning brief card that may have mixed signals.
 *
 * When a card combines a cultural event + performance data, attribute to the
 * PRIMARY trigger:
 * - "trending format X + your client hasn't tried it" → Trend Scout
 * - "client momentum declining + here's a brief to fix it" → Performance Analyst
 */
export function getAgentForMorningCard(cardType: 'success' | 'warning' | 'info'): AgentPersona {
  switch (cardType) {
    case 'success':
      return AGENT_PERSONAS.performance_analyst  // outperformance = performance trigger
    case 'warning':
      return AGENT_PERSONAS.performance_analyst  // decay = performance trigger
    case 'info':
      return AGENT_PERSONAS.trend_scout          // emerging trend = trend trigger
    default:
      return AGENT_PERSONAS.brief_architect
  }
}

/**
 * Format an attribution line for display.
 * Returns e.g. "Trend Scout · detected 2:47am" or "Brief Architect · drafted · VPS 81"
 */
export function formatAttribution(
  agent: AgentPersona,
  action: string,
  detail?: string,
): string {
  const parts = [agent.name, action]
  if (detail) parts.push(detail)
  return parts.join(' · ')
}

/**
 * Format a timestamp as a short time string for attribution.
 * Returns e.g. "detected 2:47am" or "drafted 4:00am"
 */
export function formatAttributionTime(
  verb: string,
  timestamp?: string | null,
): string {
  if (!timestamp) return verb
  const d = new Date(timestamp)
  const hours = d.getHours()
  const mins = d.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'pm' : 'am'
  const h12 = hours % 12 || 12
  return `${verb} ${h12}:${mins}${ampm}`
}
