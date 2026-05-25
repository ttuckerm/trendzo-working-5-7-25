'use client'

// Main HUD orchestrator: lays out the six zones, runs the boot-up render
// sequence, and threads sprint-progress state down to SprintGrid.

import { useEffect, useMemo, useState } from 'react'
import type { AssessmentPayload } from '@/types/assessment'
import type { SprintProgressMap } from '@/lib/assessment/fetch-assessment'
import { OperatorPanel } from './OperatorPanel'
import { FreedomNumberRing } from './FreedomNumberRing'
import { BusinessMatchPanel } from './BusinessMatchPanel'
import { SprintGrid, SPRINT_TOGGLE_EVENT } from './SprintGrid'
import { RoadmapList } from './RoadmapList'
import { LeadsPanel } from './LeadsPanel'
import { AgentRail } from './AgentRail'
import { AgentHeroBanner } from './AgentHeroBanner'
import { DeliverablesHeader } from './DeliverablesHeader'
import { Day1Spotlight } from './Day1Spotlight'
import { Chassis } from './Chassis'
import { SaveYourLinkNotice } from './SaveYourLinkNotice'
import '@/styles/instrument.css'

interface Props {
  assessmentId: string
  shareToken: string
  payload: AssessmentPayload
  sprintProgress: SprintProgressMap
}

// Boot sequence timeline in ms.
// agentBanner was inserted between deliverables (0) and operator; every slot
// after it was shifted by +400ms to preserve the existing reveal rhythm.
const TIMELINE = {
  deliverables: 0,
  agentBanner: 400,
  operator: 600,
  ring: 900,
  business: 1600,
  day1Spotlight: 2200,
  sprint: 2600,
  roadmap: 3200,
  leads: 3600,
  rail: 4200,
  done: 4600,
} as const

export function AssessmentHUD({ assessmentId, shareToken, payload, sprintProgress }: Props) {
  const reduced = usePrefersReducedMotion()
  const [bootDone, setBootDone] = useState<boolean>(reduced)

  useEffect(() => {
    if (reduced) {
      setBootDone(true)
      return
    }
    const t = window.setTimeout(() => setBootDone(true), TIMELINE.done)
    return () => window.clearTimeout(t)
  }, [reduced])

  const initialSprintProgress = useMemo(() => sprintProgress, [sprintProgress])

  const day1 = payload.sprint.days.find(d => d.dayNumber === 1) ?? payload.sprint.days[0]
  const day1Completed = sprintProgress['1']?.completed === true

  // Mirror the set of completed sprint days so LeadsPanel can drive its
  // Cold/Warming/Active state indicator without us having to lift SprintGrid's
  // local state up here. We seed from the same prop the grid uses for its
  // initial state, then track every SPRINT_TOGGLE_EVENT the grid (or
  // Day1Spotlight) dispatches after a successful POST.
  const [completedSprintDays, setCompletedSprintDays] = useState<Set<number>>(
    () => {
      const s = new Set<number>()
      for (const [k, v] of Object.entries(sprintProgress)) {
        if (v?.completed === true) {
          const n = Number(k)
          if (Number.isFinite(n)) s.add(n)
        }
      }
      return s
    },
  )

  useEffect(() => {
    function onToggle(e: Event) {
      const detail = (e as CustomEvent<{ dayNumber: number; completed: boolean }>)
        .detail
      if (!detail || typeof detail.dayNumber !== 'number') return
      setCompletedSprintDays(prev => {
        const next = new Set(prev)
        if (detail.completed) next.add(detail.dayNumber)
        else next.delete(detail.dayNumber)
        return next
      })
    }
    window.addEventListener(SPRINT_TOGGLE_EVENT, onToggle as EventListener)
    return () =>
      window.removeEventListener(
        SPRINT_TOGGLE_EVENT,
        onToggle as EventListener,
      )
  }, [])

  const sprintCompletedCount = completedSprintDays.size

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#08080d',
        color: '#f4f4f6',
        // 120px reserved at the bottom so the agent rail floats without
        // overlapping content.
        padding: '32px 24px 152px',
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
    >
      <FontStyles />
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 24,
        }}
        className="hud-grid"
      >
        <div style={{ gridColumn: 'span 12' }} className="hud-cell">
          <SaveYourLinkNotice />
        </div>

        <div style={{ gridColumn: 'span 12' }} className="hud-cell">
          <DeliverablesHeader
            firstName={payload.operator.firstName}
            reducedMotion={reduced}
            delayMs={TIMELINE.deliverables}
          />
        </div>

        <div style={{ gridColumn: 'span 12' }} className="hud-cell hud-cell-agent-banner">
          <AgentHeroBanner
            reducedMotion={reduced}
            delayMs={TIMELINE.agentBanner}
          />
        </div>

        <div style={{ gridColumn: 'span 6' }} className="hud-cell hud-cell-operator">
          <Chassis
            intensity="standard"
            statusLabel={`SYS://OPERATOR — ${payload.assessmentId}`}
            status="active"
            innerGlow
          >
            <OperatorPanel
              assessmentId={assessmentId}
              displayId={payload.assessmentId}
              operator={payload.operator}
              reducedMotion={reduced}
              delayMs={TIMELINE.operator}
            />
          </Chassis>
        </div>
        <div
          style={{ gridColumn: 'span 6' }}
          className="hud-cell hud-cell-ring"
        >
          <Chassis
            id="freedom-number-ring"
            intensity="prominent"
            statusLabel="SYS://FREEDOM_NUMBER"
            status="active"
            innerGlow
          >
            <FreedomNumberRing
              freedomNumber={payload.freedomNumber}
              reducedMotion={reduced}
              delayMs={TIMELINE.ring}
            />
          </Chassis>
        </div>
        <div style={{ gridColumn: 'span 12' }} className="hud-cell">
          <Chassis
            id="business-match"
            intensity="standard"
            statusLabel="SYS://BUSINESS_MATCH"
            status="active"
            innerGlow
          >
            <BusinessMatchPanel
              businessMatch={payload.businessMatch}
              monthlyTarget={payload.freedomNumber.monthlyTarget}
              reducedMotion={reduced}
              delayMs={TIMELINE.business}
            />
          </Chassis>
        </div>

        <div style={{ gridColumn: 'span 12' }} className="hud-cell">
          <Day1Spotlight
            assessmentId={payload.assessmentId}
            shareToken={shareToken}
            day1={day1}
            sprintStartDate={payload.sprint.startDate}
            initialCompleted={day1Completed}
            reducedMotion={reduced}
            delayMs={TIMELINE.day1Spotlight}
          />
        </div>

        <div style={{ gridColumn: 'span 12' }} className="hud-cell hud-cell-sprint">
          <Chassis
            intensity="standard"
            statusLabel="SPRINT://14_DAY"
            status="active"
          >
            <SprintGrid
              assessmentId={payload.assessmentId}
              shareToken={shareToken}
              sprint={payload.sprint}
              initialProgress={initialSprintProgress}
              reducedMotion={reduced}
              delayMs={TIMELINE.sprint}
              interactionEnabled={bootDone}
            />
          </Chassis>
        </div>
        <div style={{ gridColumn: 'span 6' }} className="hud-cell hud-cell-roadmap">
          <Chassis
            id="roadmap"
            intensity="standard"
            statusLabel="SYS://90_DAY_ROADMAP"
            status="active"
          >
            <RoadmapList
              roadmap={payload.roadmap}
              reducedMotion={reduced}
              delayMs={TIMELINE.roadmap}
            />
          </Chassis>
        </div>
        <div style={{ gridColumn: 'span 6' }} className="hud-cell hud-cell-leads">
          <Chassis
            id="leads"
            intensity="standard"
            statusLabel="SYS://LEADS_PLAYBOOK"
            status="active"
          >
            <LeadsPanel
              leads={payload.leads}
              sprintCompletedCount={sprintCompletedCount}
              reducedMotion={reduced}
              delayMs={TIMELINE.leads}
            />
          </Chassis>
        </div>

      </div>

      <AgentRail
        assessmentId={payload.assessmentId}
        shareToken={shareToken}
        agentContext={payload.agentContext}
        operatorFirstName={payload.operator.firstName}
      />

      <style>{`
        @media (max-width: 1023px) {
          .hud-grid { grid-template-columns: 1fr !important; }
          .hud-grid > .hud-cell { grid-column: span 1 !important; }
        }
        @media (min-width: 1024px) {
          .hud-grid > .hud-cell-sprint   { grid-column: span 12; }
          .hud-grid > .hud-cell-roadmap  { grid-column: span 6; }
          .hud-grid > .hud-cell-leads    { grid-column: span 6; }
        }
      `}</style>
    </div>
  )
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    if (mq.addEventListener) {
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }
    // legacy
    mq.addListener(onChange)
    return () => mq.removeListener(onChange)
  }, [])
  return reduced
}

function FontStyles() {
  // Inline @import to avoid touching globals.css. These are the three families
  // declared in the design tokens and are loaded once per HUD render.
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@500;700&display=swap');
    `}</style>
  )
}
