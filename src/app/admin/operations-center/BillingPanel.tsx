"use client"
import React, { useEffect, useState } from 'react'

type BillingStatus = { plan: string; seats: number; renews_at: string | null; delinquent: boolean; credits_remaining: number }

export default function BillingPanel() {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [usage24h, setUsage24h] = useState<number>(0)
  const [usageMonth, setUsageMonth] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const s = await fetch('/api/billing/status')
        const plan = await s.json()
        if (!cancelled) setStatus(plan)
        const u = await fetch('/api/billing/usage')
        const month = Number(u.headers.get('X-Usage-Month') || 0)
        const day = Number(u.headers.get('X-Usage-24h') || 0)
        if (!cancelled) { setUsageMonth(month); setUsage24h(day) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const openPortal = async () => {
    const r = await fetch('/api/billing/portal')
    const j = await r.json()
    if (j?.url) window.open(j.url, '_blank')
  }

  return (
    <div aria-busy={loading}>
      <h2 className="text-xl font-semibold mb-2">Billing</h2>
      <div data-testid='billing-status' className="text-sm text-gray-300 mb-2">
        {status ? (
          <>
            <div>Plan: <strong>{status.plan}</strong> • Seats: {status.seats} • Credits: {status.credits_remaining}</div>
            <div>Renews: {status.renews_at ? new Date(status.renews_at).toLocaleString() : '—'} • Delinquent: {status.delinquent ? 'Yes' : 'No'}</div>
          </>
        ) : 'Loading...'}
      </div>
      <button onClick={openPortal} className="px-3 py-2 rounded bg-white/10 hover:bg-white/20">Open Customer Portal</button>
      <div data-testid='usage-counters' className="mt-3 text-sm text-gray-300">
        Usage: {usage24h} (24h) / {usageMonth} (month)
      </div>
    </div>
  )
}


