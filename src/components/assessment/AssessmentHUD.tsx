'use client'

// Main HUD orchestrator: lays out the six zones, runs the boot-up render
// sequence, and threads sprint-progress state down to SprintGrid.

import { useEffect, useMemo, useState } from 'react'
import type { AssessmentPayload } from '@/types/assessment'
import type { SprintProgressMap } from '@/lib/assessment/fetch-assessment'
import { OperatorPanel } from './OperatorPanel'
import { FreedomNumberRing } from './FreedomNumberRing'
import { BusinessMatchPanel } from './BusinessMatchPanel'
import { SprintGrid } from './SprintGrid'
import { RoadmapList } from './RoadmapList'
import { LeadsPanel } from './LeadsPanel'
import { AgentRail } from './AgentRail'
import { DeliverablesHeader } from './DeliverablesHeader'
import { Day1Spotlight } from './Day1Spotlight'
import { EmailCapturePanel } from './EmailCapturePanel'
import { Chassis } from './Chassis'
import '@/styles/instrument.css'

interface Props {
  assessmentId: string
  payload: AssessmentPayload
  sprintProgress: SprintProgressMap
}

// Boot sequence timeline in ms.
const TIMELINE = {
  deliverables: 0,
  operator: 200,
  ring: 600,
  business: 1400,
  day1Spotlight: 2000,
  sprint: 2400,
  roadmap: 3000,
  leads: 3400,
  emailCapture: 3800,
  rail: 4000,
  done: 4400,
} as const

export function AssessmentHUD({ assessmentId, payload, sprintProgress }: Props) {
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
          <DeliverablesHeader
            firstName={payload.operator.firstName}
            reducedMotion={reduced}
            delayMs={TIMELINE.deliverables}
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
            day1={day1}
            sprintStartDate={payload.sprint.startDate}
            initialCompleted={day1Completed}
            reducedMotion={reduced}
            delayMs={TIMELINE.day1Spotlight}
          />
        </div>

        <div style={{ gridColumn: 'span 8' }} className="hud-cell hud-cell-sprint">
          <Chassis
            intensity="standard"
            statusLabel="SPRINT://14_DAY"
            status="active"
          >
            <SprintGrid
              assessmentId={assessmentId}
              sprint={payload.sprint}
              initialProgress={initialSprintProgress}
              reducedMotion={reduced}
              delayMs={TIMELINE.sprint}
              interactionEnabled={bootDone}
            />
          </Chassis>
        </div>
        <div style={{ gridColumn: 'span 4' }} className="hud-cell hud-cell-roadmap">
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
        <div style={{ gridColumn: 'span 12' }} className="hud-cell">
          <Chassis
            id="leads"
            intensity="standard"
            statusLabel="SYS://LEADS_PLAYBOOK"
            status="active"
          >
            <LeadsPanel
              leads={payload.leads}
              reducedMotion={reduced}
              delayMs={TIMELINE.leads}
            />
          </Chassis>
        </div>

        <div style={{ gridColumn: 'span 12' }} className="hud-cell">
          <Chassis
            intensity="subtle"
            statusLabel="SYS://CHANNEL_OPEN"
            status="active"
          >
            <EmailCapturePanel
              assessmentId={payload.assessmentId}
              reducedMotion={reduced}
              delayMs={TIMELINE.emailCapture}
            />
          </Chassis>
        </div>
      </div>

      <AgentRail
        assessmentId={payload.assessmentId}
        agentContext={payload.agentContext}
      />

      <style>{`
        @media (max-width: 1023px) {
          .hud-grid { grid-template-columns: 1fr !important; }
          .hud-grid > .hud-cell { grid-column: span 1 !important; }
        }
        @media (min-width: 1024px) {
          .hud-grid > .hud-cell-sprint { grid-column: span 8; }
          .hud-grid > .hud-cell-roadmap { grid-column: span 4; }
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
