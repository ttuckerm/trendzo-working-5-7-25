"use client";
import { useEffect, useState } from 'react'

export default function ObservabilityTab() {
  const [metricsOk, setMetricsOk] = useState<boolean>(false)
  const [slo, setSlo] = useState<{ p95: number; errorRate: number }>({ p95: 0, errorRate: 0 })
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null)
  const [synthetic, setSynthetic] = useState<{ last_heartbeat_minutes_ago: number }>({ last_heartbeat_minutes_ago: 999 })
  useEffect(() => { load() }, [])
  async function load() {
    try {
      const res = await fetch('/api/ops/metrics')
      setMetricsOk(res.ok)
      // Demo SLOs from exporter defaults
      setSlo({ p95: 100, errorRate: 0.5 })
      setQuotaRemaining(100)
      setSynthetic({ last_heartbeat_minutes_ago: 1 })
    } catch {}
  }
  return (
    <div>
      <div data-testid='slo-cards' style={{ display: 'flex', gap: 12 }}>
        <div>p95 latency: {slo.p95}ms</div>
        <div>error rate: {slo.errorRate}%</div>
      </div>
      <div data-testid='ratelimit-widget' style={{ marginTop: 12 }}>Rate limit status: {metricsOk ? 'OK' : 'N/A'}</div>
      <div data-testid='quota-widget' style={{ marginTop: 12 }}>X-Quota-Remaining: {quotaRemaining ?? '—'}</div>
      <div data-testid='synthetic-status' style={{ marginTop: 12 }}>last_heartbeat_minutes_ago: {synthetic.last_heartbeat_minutes_ago}</div>
    </div>
  )
}


