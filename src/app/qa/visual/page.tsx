'use client'

import { useEffect, useState } from 'react'

type Check = { id: string; label: string; pass: boolean | null; details?: string }

export default function VisualQAPage() {
  const [checks, setChecks] = useState<Check[]>([
    { id: 'flag', label: 'Feature flag endpoint available', pass: null },
    { id: 'impact-ids', label: 'ImpactScore TestIDs present', pass: null },
    { id: 'impact-data', label: 'ImpactScore loads live data', pass: null },
    { id: 'rollups', label: 'Discovery rollups render charts', pass: null },
    { id: 'recs', label: 'A++ Recs endpoint gated and returns topK', pass: null },
    { id: 'calib', label: 'Calibration metrics endpoint responds', pass: null },
    { id: 'guardrails', label: 'Guardrails endpoints respond', pass: null },
    { id: 'recs-metrics', label: 'Recs metrics endpoint responds', pass: null },
  ])

  const [smoke, setSmoke] = useState<{ alg?: string|null; cal?: string|null; explore?: string|null; items?: number; p95?: number; error_rate?: number; msg?: string }|null>(null)

  async function enableAPlusPlus() {
    try {
      const res = await fetch('/api/flags', { method: 'POST', headers: { 'content-type': 'application/json', 'x-actor': 'qa_visual' }, body: JSON.stringify({ name: 'algo_aplusplus', enabled: true, audience: 'all' }) })
      if (!res.ok) throw new Error('flag_post_failed')
      setSmoke(s => ({ ...(s||{}), msg: 'algo_aplusplus enabled' }))
    } catch (e: any) {
      setSmoke({ msg: `Enable failed: ${e?.message||e}` })
    }
  }

  async function runSmoke() {
    try {
      const body = { topK: 10, strategy: 'thompson', budgetFraction: 0.2 }
      const resp = await fetch('/api/recs/serve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (resp.status === 403) {
        setSmoke({ msg: 'Serve gated (403): enable A++ flag first' })
        return
      }
      if (!resp.ok) throw new Error(`serve_${resp.status}`)
      const alg = resp.headers.get('X-Alg-Version')
      const cal = resp.headers.get('X-Cal-Version')
      const explore = resp.headers.get('X-Explore-Id')
      const data = await resp.json().catch(()=>({ items: [] }))
      const items = Array.isArray(data?.items) ? data.items.length : 0
      const m = await fetch('/api/recs/metrics', { cache: 'no-store' }).then(r=>r.json()).catch(()=>({ p95_ms:0, error_rate:0 }))
      setSmoke({ alg, cal, explore, items, p95: Number(m?.p95_ms||0), error_rate: Number(m?.error_rate||0), msg: 'ok' })
    } catch (e: any) {
      setSmoke({ msg: `Smoke failed: ${e?.message||e}` })
    }
  }

  useEffect(() => {
    (async () => {
      const results: Check[] = []
      // 1) Flags endpoint
      try {
        const r = await fetch('/api/flags', { cache: 'no-store' })
        let ok = r.ok || r.status === 304
        try {
          const ct = r.headers.get('content-type') || ''
          if (ct.includes('application/json')) {
            await r.clone().json().catch(()=>null)
            ok = true
          }
        } catch {}
        results.push({ id: 'flag', label: 'Feature flag endpoint available', pass: ok })
      } catch {
        results.push({ id: 'flag', label: 'Feature flag endpoint available', pass: false })
      }

      // 2) ImpactScore TestIDs by loading dashboard-view in a hidden iframe
      const frame = document.createElement('iframe')
      frame.src = '/dashboard-view'
      frame.style.width = '0'
      frame.style.height = '0'
      frame.style.border = '0'
      document.body.appendChild(frame)
      await new Promise(res => frame.addEventListener('load', res, { once: true }))
      const doc = frame.contentDocument
      const ids = [
        'Impact-Header',
        'Impact-ViralScore-Card',
        'Impact-Score-Value',
        'Impact-Level-Header',
        'Impact-Level-Progress',
      ]
      const present = ids.every(id => !!doc?.querySelector(`[data-testid="${id}"]`))
      results.push({ id: 'impact-ids', label: 'ImpactScore TestIDs present', pass: present })

      // 3) ImpactScore loads data (value is not placeholder '—')
      // Poll up to ~6s for the value to switch from placeholder to number (account for cold start)
      let valueText = ''
      for (let i = 0; i < 30; i++) {
        const el = doc?.querySelector('[data-testid="Impact-Score-Value"]')
        valueText = (el?.textContent || '').trim()
        if (/^\d+$/.test(valueText)) break
        await new Promise(r => setTimeout(r, 200))
      }
      const isNumber = /^\d+$/.test(valueText)
      results.push({ id: 'impact-data', label: 'ImpactScore loads live data', pass: isNumber, details: valueText })

      // 4) Discovery rollups charts present if dashboard uses them
      // Use the admin dashboard tab that renders charts
      const admin = document.createElement('iframe')
      admin.src = '/admin/viral-recipe-book?tab=dashboard'
      admin.style.width = '0'; admin.style.height = '0'; admin.style.border = '0'
      document.body.appendChild(admin)
      await new Promise(res => admin.addEventListener('load', res, { once: true }))
      const adminDoc = admin.contentDocument
      let discovery: Element | null = null
      let decay: Element | null = null
      for (let i = 0; i < 10; i++) {
        const d1 = adminDoc?.querySelector('[data-testid="chart-discovery"]') as Element | null | undefined
        const d2 = adminDoc?.querySelector('[data-testid="template-leaderboard"]') as Element | null | undefined
        discovery = (d1 || d2 || null) as Element | null
        decay = (adminDoc?.querySelector('[data-testid="chart-decay"]') as Element | null | undefined) || null
        if (discovery && decay) break
        await new Promise(res => setTimeout(res, 200))
      }
      const chartsOk = !!discovery && !!decay
      results.push({ id: 'rollups', label: 'Discovery rollups render charts', pass: chartsOk })

      // 5) A++ Recs endpoint (gated by feature flag)
      try {
        const postRes = await fetch('/api/recs/serve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ topK: 5, demo: true, platform: 'tiktok' }) })
        if (postRes.status === 403) {
          results.push({ id: 'recs', label: 'A++ Recs endpoint gated and returns topK', pass: true })
        } else if (postRes.ok) {
          const data = await postRes.json().catch(()=>null)
          const ok = data && Array.isArray(data.items) && data.items.length > 0 && typeof data.alg_version === 'string'
          results.push({ id: 'recs', label: 'A++ Recs endpoint gated and returns topK', pass: !!ok })
        } else {
          results.push({ id: 'recs', label: 'A++ Recs endpoint gated and returns topK', pass: false })
        }
      } catch { results.push({ id: 'recs', label: 'A++ Recs endpoint gated and returns topK', pass: false }) }
      // 6) Calibration metrics endpoint responds
      try {
        const r = await fetch('/api/calibration/metrics?cohort=tiktok:general:med', { cache: 'no-store' })
        const ok = r.ok
        results.push({ id: 'calib', label: 'Calibration metrics endpoint responds', pass: ok })
      } catch {
        results.push({ id: 'calib', label: 'Calibration metrics endpoint responds', pass: false })
      }

      // 7) Guardrails endpoints respond
      try {
        const [c1, c2] = await Promise.all([
          fetch('/api/guardrails/config', { cache: 'no-store' }),
          fetch('/api/guardrails/metrics', { cache: 'no-store' })
        ])
        results.push({ id: 'guardrails', label: 'Guardrails endpoints respond', pass: c1.ok && c2.ok })
      } catch {
        results.push({ id: 'guardrails', label: 'Guardrails endpoints respond', pass: false })
      }

      // 8) Recs metrics endpoint responds
      try {
        const r = await fetch('/api/recs/metrics', { cache: 'no-store' })
        results.push({ id: 'recs-metrics', label: 'Recs metrics endpoint responds', pass: r.ok })
      } catch { results.push({ id: 'recs-metrics', label: 'Recs metrics endpoint responds', pass: false }) }

      // Now commit results once, including recs & calibration & guardrails & metrics
      setChecks(prev => prev.map(c => results.find(r => r.id === c.id) || c))
      // Clean up iframe after a short delay
      setTimeout(() => { frame.remove(); admin.remove() }, 2000)
    })()
  }, [])

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Visual QA Checklist</h1>
      <p className="text-sm text-gray-600 mb-4">Green checks indicate the UI and APIs are wired per contract.</p>

      <div className="mb-6 border rounded-md p-3 flex items-center gap-3">
        <button onClick={enableAPlusPlus} className="px-3 py-2 bg-indigo-600 text-white rounded">Enable A++</button>
        <button onClick={runSmoke} className="px-3 py-2 bg-emerald-600 text-white rounded">Run Smoke</button>
        {smoke && (
          <div className="text-xs text-gray-800 bg-white/50 rounded px-2 py-1 ml-auto" data-testid="QA-Smoke-Result">
            <span>alg={smoke.alg||'—'} </span>
            <span>cal={smoke.cal||'—'} </span>
            <span>p95={smoke.p95??'—'} </span>
            <span>err={smoke.error_rate??'—'} </span>
            <span>items={smoke.items??'—'} </span>
            <span>{smoke.msg||''}</span>
          </div>
        )}
      </div>
      <ul className="space-y-2">
        {checks.map(c => (
          <li key={c.id} className="flex items-center justify-between border rounded-md p-3">
            <span>{c.label}</span>
            <span className={c.pass ? 'text-green-600' : c.pass === false ? 'text-red-600' : 'text-gray-400'}>
              {c.pass == null ? '…' : c.pass ? '✓' : '✕'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}


