// Injects the user's AssessmentPayload (with sprint progress merged in) into
// the Freedom Agent system prompt template. Pure function — no I/O.

import type { AssessmentPayload } from '@/types/assessment'
import type { SprintProgressMap } from '@/lib/assessment/fetch-assessment'
import { FREEDOM_AGENT_SYSTEM_PROMPT_TEMPLATE } from '@/lib/prompts/freedom-agent-prompt'

function computeCurrentSprintDay(startDateIso: string): {
  dayNumber: number
  label: string
} {
  // Parse start date as UTC midnight and compare to today's UTC midnight.
  const start = new Date(`${startDateIso}T00:00:00Z`).getTime()
  const now = new Date()
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  )
  const dayMs = 24 * 60 * 60 * 1000
  const diffDays = Math.floor((todayUtc - start) / dayMs)

  if (diffDays < 0) return { dayNumber: 0, label: 'Pre-sprint' }
  if (diffDays > 13) return { dayNumber: 15, label: 'Post-sprint' }
  const dayNumber = diffDays + 1 // diff 0 → Day 1
  return { dayNumber, label: `Day ${dayNumber} of 14` }
}

export function buildFreedomAgentSystemPrompt(
  payload: AssessmentPayload,
  sprintProgress: SprintProgressMap,
): string {
  const today = new Date().toISOString().split('T')[0]
  const { label: sprintDayLabel } = computeCurrentSprintDay(payload.sprint.startDate)

  // Augment each sprint day with its progress entry so the Agent can see
  // completion state inline.
  const augmentedPayload = {
    ...payload,
    sprint: {
      ...payload.sprint,
      days: payload.sprint.days.map((d) => {
        const entry = sprintProgress[String(d.dayNumber)]
        return {
          ...d,
          completed: entry?.completed === true,
          completedAt: entry?.completedAt ?? null,
        }
      }),
    },
  }

  return FREEDOM_AGENT_SYSTEM_PROMPT_TEMPLATE
    .replace('{{ASSESSMENT_PAYLOAD_JSON}}', JSON.stringify(augmentedPayload, null, 2))
    .replace('{{TODAY}}', today)
    .replace('{{SPRINT_START_DATE}}', payload.sprint.startDate)
    .replace('{{CURRENT_SPRINT_DAY}}', sprintDayLabel)
}
