'use client'

// Dev-only batch test runner. Future user-facing route is /assessment/[assessmentId]
// (built in Cursor Prompt 2) — this page is internal QA only.

import { useCallback, useEffect, useState } from 'react'
export const dynamic = 'force-dynamic';

interface QualityChecks {
  hasAssessmentId: boolean
  assessmentIdFormatOk: boolean
  hasNoBlueprintWord: boolean
  blueprintLocations?: Array<{ path: string; snippet: string }>
  greetingMentionsHumanDate: boolean
  greetingHasNoPlaceholder: boolean
  platformsHaveNoMemberCounts: boolean
  scriptsHaveNoDecimalPercent: boolean
  scriptsHaveNoMonthName: boolean
  day1IsCustomerFacing: boolean
  days1to3HaveCustomerFacing: boolean
  days1to7HaveCustomerConversation: boolean
  days1to10HaveOfferDelivery: boolean
  estimatedMinutesIs2xish: boolean
  month3HasEstimatedHoursPerWeek: boolean
  notSureNiche?: { greetingExplains: boolean; quickReplyOffersChange: boolean }
  feasibility?: { fitsBudget: boolean; flagPresent: boolean; timelineExtended: boolean; anyOk: boolean }
}

interface TestResult {
  testIndex: number
  input: Record<string, unknown>
  output?: unknown
  passed: boolean
  error?: string
  reasons?: string[]
  quality?: QualityChecks
}

interface TestReport {
  totalRuns: number
  passed: number
  failed: number
  failures: Array<{ testIndex: number; input: Record<string, unknown>; error?: string; reasons?: string[] }>
  results: TestResult[]
}

// blueprintLocations is intentionally excluded — it's a diagnostic detail surfaced
// as a separate panel below each test row, not a pass/fail check.
type QualityCheckKey = Exclude<keyof QualityChecks, 'blueprintLocations'>
const QUALITY_LABELS: Record<QualityCheckKey, string> = {
  hasAssessmentId: 'Has assessmentId',
  assessmentIdFormatOk: 'assessmentId matches EA-X-XXX',
  hasNoBlueprintWord: 'No "blueprint" anywhere in payload',
  greetingMentionsHumanDate: 'Greeting includes formatted sprint date',
  greetingHasNoPlaceholder: 'Greeting does NOT contain {{SPRINT_START_DATE}}',
  platformsHaveNoMemberCounts: 'No parenthetical member counts on platforms',
  scriptsHaveNoDecimalPercent: 'No decimal percentages in scripts',
  scriptsHaveNoMonthName: 'No month names in scripts',
  day1IsCustomerFacing: 'Day 1 category is customer-facing',
  days1to3HaveCustomerFacing: 'Days 1-3 include customer-facing',
  days1to7HaveCustomerConversation: 'Days 1-7 include customer-conversation',
  days1to10HaveOfferDelivery: 'Days 1-10 include offer-delivery',
  estimatedMinutesIs2xish: 'Estimated minutes are roughly 2x baseline',
  month3HasEstimatedHoursPerWeek: 'roadmap.month3.estimatedHoursPerWeek present',
  notSureNiche: 'Not-sure niche handled explicitly',
  feasibility: 'Feasibility constraint handled (fits / flag / extended)',
}

function checkRowOk(key: QualityCheckKey, q: QualityChecks): boolean | null {
  const v = q[key]
  if (v == null) return null
  if (typeof v === 'boolean') return v
  if ('anyOk' in v) return v.anyOk
  if ('greetingExplains' in v) return v.greetingExplains && v.quickReplyOffersChange
  return null
}

export default function AssessmentTestPage() {
  const [report, setReport] = useState<TestReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const res = await fetch('/api/assessment/test', { method: 'GET' })
      if (!res.ok) {
        const text = await res.text()
        setError(`HTTP ${res.status}: ${text.slice(0, 300)}`)
        return
      }
      const data = (await res.json()) as TestReport
      setReport(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') run()
  }, [run])

  if (process.env.NODE_ENV === 'production') {
    return <div style={{ padding: 32, fontFamily: 'system-ui' }}>Not available in production.</div>
  }

  // Aggregate quality stats across passing tests
  const qualityAgg = (() => {
    if (!report) return null
    const counts: Record<string, { ok: number; total: number }> = {}
    for (const r of report.results) {
      if (!r.quality) continue
      for (const k of Object.keys(QUALITY_LABELS) as Array<QualityCheckKey>) {
        const v = checkRowOk(k, r.quality)
        if (v == null) continue
        if (!counts[k]) counts[k] = { ok: 0, total: 0 }
        counts[k].total++
        if (v) counts[k].ok++
      }
    }
    return counts
  })()

  return (
    <div style={{ padding: 32, fontFamily: 'system-ui', maxWidth: 1100, margin: '0 auto', color: '#111' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Assessment Generator — Batch Test</h1>
      <p style={{ color: '#555', marginBottom: 16 }}>
        Runs 12 hardcoded inputs (10 baseline + 2 edge cases) through <code>/api/assessment/test</code>.
        Schema PASS = JSON parses + validators pass. Quality checks below are independent.
      </p>

      <button
        onClick={run}
        disabled={loading}
        style={{
          padding: '8px 16px',
          background: loading ? '#999' : '#111',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          marginBottom: 24,
        }}
      >
        {loading ? 'Running generations…' : 'Re-run tests'}
      </button>

      {error && (
        <div style={{ padding: 12, background: '#fee', border: '1px solid #f99', borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {report && (
        <>
          <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
            <Stat label="Total" value={report.totalRuns} />
            <Stat label="Schema Passed" value={report.passed} color="#0a7c2a" />
            <Stat label="Schema Failed" value={report.failed} color={report.failed > 0 ? '#b00020' : '#999'} />
          </div>

          {qualityAgg && (
            <div style={{ marginBottom: 32, padding: 16, border: '1px solid #ddd', borderRadius: 8, background: '#fafafa' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Quality checks (across runs)</h2>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid #ccc' }}>Check</th>
                    <th style={{ textAlign: 'right', padding: 6, borderBottom: '1px solid #ccc' }}>Pass count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(QUALITY_LABELS).map(([k, label]) => {
                    const c = qualityAgg[k]
                    if (!c || c.total === 0) return null
                    const ratio = `${c.ok}/${c.total}`
                    const allOk = c.ok === c.total
                    return (
                      <tr key={k}>
                        <td style={{ padding: 6, borderBottom: '1px solid #eee' }}>{label}</td>
                        <td style={{ padding: 6, borderBottom: '1px solid #eee', textAlign: 'right', color: allOk ? '#0a7c2a' : '#b00020', fontWeight: 600 }}>
                          {ratio}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {report.failures.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Schema failures</h2>
              <ul>
                {report.failures.map(f => (
                  <li key={f.testIndex} style={{ marginBottom: 6 }}>
                    Test #{f.testIndex} — {f.error}
                    {f.reasons && f.reasons.length > 0 && (
                      <ul style={{ marginLeft: 16, color: '#666' }}>
                        {f.reasons.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Results</h2>
          {report.results.map(r => (
            <div
              key={r.testIndex}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                background: r.passed ? '#f6fff6' : '#fff6f6',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>#{r.testIndex}</strong> &middot; {String(r.input.firstName)} &middot;{' '}
                  hrs/wk: {String(r.input.hoursPerWeek)} &middot;{' '}
                  expenses: ${String(r.input.monthlyExpenses)} &middot;{' '}
                  niche: {String(r.input.nicheSignal)} &middot;{' '}
                  <span style={{ color: r.passed ? '#0a7c2a' : '#b00020', fontWeight: 600 }}>
                    {r.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <button
                  onClick={() => setExpanded(s => ({ ...s, [r.testIndex]: !s[r.testIndex] }))}
                  style={{ padding: '4px 10px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                  {expanded[r.testIndex] ? 'Hide' : 'Show'} payload + checks
                </button>
              </div>
              {!r.passed && r.error && (
                <div style={{ color: '#b00020', marginTop: 6, fontSize: 13 }}>
                  {r.error}
                  {r.reasons && r.reasons.length > 0 && ` — ${r.reasons.join('; ')}`}
                </div>
              )}
              {r.quality?.blueprintLocations && r.quality.blueprintLocations.length > 0 && (
                <div style={{ marginTop: 6, padding: 8, background: '#fff8e6', border: '1px solid #f0c060', borderRadius: 4, fontSize: 12 }}>
                  <strong>"blueprint" found in payload:</strong>
                  <ul style={{ marginTop: 4, marginBottom: 0 }}>
                    {r.quality.blueprintLocations.map((loc, i) => (
                      <li key={i}>
                        <code>{loc.path}</code> → <em>{loc.snippet}</em>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {expanded[r.testIndex] && (
                <>
                  {r.quality && (
                    <table style={{ marginTop: 8, borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                      <tbody>
                        {(Object.keys(QUALITY_LABELS) as Array<QualityCheckKey>).map(k => {
                          const ok = checkRowOk(k, r.quality!)
                          if (ok == null) return null
                          return (
                            <tr key={k}>
                              <td style={{ padding: 3 }}>{QUALITY_LABELS[k]}</td>
                              <td style={{ padding: 3, textAlign: 'right', color: ok ? '#0a7c2a' : '#b00020', fontWeight: 600 }}>
                                {ok ? '✓' : '✗'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                  <pre
                    style={{
                      marginTop: 8,
                      background: '#fafafa',
                      padding: 8,
                      borderRadius: 4,
                      overflow: 'auto',
                      fontSize: 12,
                      maxHeight: 400,
                    }}
                  >
                    {JSON.stringify(r.output ?? { input: r.input, error: r.error }, null, 2)}
                  </pre>
                </>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#666' }}>{label}</div>
      <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, color: color ?? '#111' }}>{value}</div>
    </div>
  )
}
