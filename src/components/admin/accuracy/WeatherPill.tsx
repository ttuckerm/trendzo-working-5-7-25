'use client'

import React, { useEffect, useState } from 'react'

type Weather = 'OK' | 'Warning' | 'Critical'

export default function WeatherPill({ cohort }: { cohort?: string }) {
  const [status, setStatus] = useState<Weather>('OK')
  const [desc, setDesc] = useState<string>('')

  useEffect(() => {
    async function load() {
      try {
        const qs = new URLSearchParams({})
        if (cohort) qs.set('cohort', cohort)
        const r = await fetch(`/api/drift/summary?${qs.toString()}`, { cache: 'no-store' })
        if (!r.ok) throw new Error('missing')
        const j = await r.json()
        setStatus((j?.status as Weather) || 'OK')
        setDesc(j?.message || '')
      } catch {
        // Fallback based on accuracy metrics
        try {
          const rr = await fetch('/api/metrics/accuracy', { cache: 'no-store' })
          const m = await rr.json().catch(()=> ({}))
          const ece = Number(m?.ece || 0)
          if (ece < 0.05) setStatus('OK')
          else if (ece < 0.12) setStatus('Warning')
          else setStatus('Critical')
          setDesc('fallback: accuracy-based')
        } catch {}
      }
    }
    load()
  }, [cohort])

  const cls = status === 'OK' ? 'bg-green-100 text-green-700 border-green-300' : status === 'Warning' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-red-100 text-red-700 border-red-300'

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${cls}`}>
      <span>{status}</span>
      {desc && <span className="text-xs opacity-60">{desc}</span>}
    </div>
  )
}


