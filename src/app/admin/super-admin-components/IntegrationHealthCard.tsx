'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function IntegrationHealthCard() {
  const [status, setStatus] = useState<any>(null)
  const [err, setErr] = useState<string>('')
  const [busy, setBusy] = useState<string>('')

  useEffect(() => {
    fetch('/api/admin/integration/status')
      .then(r=>r.json())
      .then(setStatus)
      .catch(e=>setErr(String(e)))
  }, [])

  const runs = (status && status.last_runs) || {}
  const version = (() => { try { return JSON.parse(status?.evidence?.baselines || '{}')?.version || '—' } catch { return '—' } })()
  const metrics = (() => { try { return JSON.parse(status?.evidence?.metrics || '{}') } catch { return null } })()
  const artifact = (() => {
    const s = String(status?.evidence?.artifacts || '')
    // Prefer path before any + experiment_runs:id
    const parts = s.split(' + ')
    return parts[0] || s || '—'
  })()
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Integration Health</CardTitle>
      </CardHeader>
      <CardContent>
        {err && <div className="text-red-500 text-sm">{err}</div>}
        {!status ? (
          <div className="text-sm">Loading…</div>
        ) : (
          <div className="text-sm space-y-1">
            <div><b>Baselines version</b>: {version}</div>
            <div><b>Accuracy metrics</b>: {metrics ? `n=${metrics.n}, AUROC=${Number(metrics.auroc).toFixed(3)}, p@100=${Number(metrics.precision_at_100).toFixed(3)}, ECE=${Number(metrics.ece).toFixed(3)}` : '—'}</div>
            <div><b>Heated excluded</b>: {metrics?.heated_excluded_count ?? '—'}</div>
            <div><b>Latest artifact</b>: {artifact}</div>
            <div className="text-xs opacity-70">Nightly eval last run (UTC): {runs.nightly_eval_last_run || runs.nightlyEvalAt || '—'} | Weekly cohort last run (UTC): {runs.weekly_cohort_last_run || runs.weeklyCohortAt || '—'}</div>
            <div className="text-xs opacity-70">Partner signals 24h: {status?.partner_signals_24h ?? '—'} | Distribution last ingest: {status?.distribution_last_ingest || '—'}</div>
            <div className="flex gap-2 pt-2">
              <button
                disabled={!!busy}
                className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                onClick={async ()=>{
                  setBusy('nightly');
                  try {
                    const r = await fetch('/api/admin/integration/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'run_nightly_eval' }) })
                    const j = await r.json();
                    const refreshed = await fetch('/api/admin/integration/status').then(x=>x.json())
                    setStatus(refreshed)
                  } catch(e:any){ setErr(String(e)) } finally { setBusy('') }
                }}
              >{busy==='nightly' ? 'Running…' : 'Run nightly eval now'}</button>
              <button
                disabled={!!busy}
                className="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50"
                onClick={async ()=>{
                  setBusy('weekly');
                  try {
                    const r = await fetch('/api/admin/integration/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'run_weekly_baselines' }) })
                    const j = await r.json();
                    const refreshed = await fetch('/api/admin/integration/status').then(x=>x.json())
                    setStatus(refreshed)
                  } catch(e:any){ setErr(String(e)) } finally { setBusy('') }
                }}
              >{busy==='weekly' ? 'Running…' : 'Recompute baselines now'}</button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


