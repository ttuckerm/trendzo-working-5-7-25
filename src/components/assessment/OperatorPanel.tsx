'use client'

import { motion } from 'framer-motion'
import type { AssessmentPayload } from '@/types/assessment'

interface Props {
  assessmentId: string
  displayId: string // payload.assessmentId — EA-X-XXX format
  operator: AssessmentPayload['operator']
  reducedMotion: boolean
  delayMs: number
}

const currency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(n))

const integer = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n))

export function OperatorPanel({ operator, displayId, reducedMotion, delayMs }: Props) {
  const inputs = operator.inputs

  const rows: Array<{ label: string; value: string }> = [
    { label: 'HOURS / WEEK', value: `${integer(inputs.hoursPerWeek)} hrs` },
    { label: 'MONTHLY INCOME', value: currency(inputs.monthlyIncome) },
    { label: 'MONTHLY EXPENSES', value: currency(inputs.monthlyExpenses) },
    { label: 'RUNWAY', value: `${integer(inputs.runwayMonths)} mo` },
    { label: 'SKILL PROFILE', value: inputs.skillProfile },
    { label: 'RISK TOLERANCE', value: inputs.riskTolerance },
    { label: 'NICHE SIGNAL', value: inputs.nicheSignal || '—' },
  ]

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 0.4, delay: delayMs / 1000, ease: 'easeOut' }
      }
      style={{
        background: '#1c1c24',
        border: '1px solid #22222c',
        borderRadius: 12,
        padding: 28,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 11,
          color: '#5b5b63',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}
      >
        OPERATOR // {displayId}
      </div>

      <div
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: 32,
          color: '#f4f4f6',
          lineHeight: 1.1,
          fontWeight: 700,
        }}
      >
        {operator.firstName}
      </div>

      <div
        style={{
          alignSelf: 'flex-start',
          padding: '6px 12px',
          borderRadius: 999,
          border: '1px solid #7a2527',
          background: 'rgba(240, 74, 77, 0.08)',
          color: '#f04a4d',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {operator.status}
      </div>

      <div
        style={{
          marginTop: 4,
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          rowGap: 8,
          columnGap: 16,
        }}
      >
        {rows.map(r => (
          <Row key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
    </motion.div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 11,
          color: '#5b5b63',
          letterSpacing: 1,
          alignSelf: 'center',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 14,
          color: '#f4f4f6',
          fontWeight: 500,
          textAlign: 'right',
        }}
      >
        {value}
      </div>
    </>
  )
}
