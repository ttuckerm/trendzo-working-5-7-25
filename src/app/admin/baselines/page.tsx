'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function BaselinesPage() {
  const [summary, setSummary] = useState<any>(null)
  const [metrics, setMetrics] = useState<any[]>([])
  const [artifactUrl, setArtifactUrl] = useState<string | null>(null)

  async function load() {
    const s = await fetch('/api/admin/baselines/summary', { cache:'no-store' }).then(r=>r.json())
    const m = await fetch('/api/admin/baselines/metrics_30d', { cache:'no-store' }).then(r=>r.json())
    setSummary(s)
    setMetrics(m.rows||[])
    try { const st = await fetch('/api/admin/integration/status', { cache:'no-store' }).then(r=>r.json()); setArtifactUrl(st.last_artifact_url||null) } catch {}
  }
  useEffect(()=>{ load() }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Baselines / Calibration / Timing</h1>
        <div className="flex gap-2">
          <Button onClick={load}>Refresh</Button>
          <Button onClick={async()=>{ await fetch('/api/admin/baselines/run-now', { method:'POST' }); await load(); }}>Recompute Now</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPI title="Cohort Version" value={summary?.cohort_version || '-'} />
        <KPI title="Calibration Version" value={summary?.calibration_version || '-'} />
        <KPI title="Heated Excl (30d)" value={String(summary?.heated_excluded_30d || 0)} />
        <KPI title="Timing Index" value={fmt(summary?.timing_index)} />
        <KPI title="Last Runs" value={formatRuns(summary?.last_runs)} />
      </div>

      {summary?.baseline_version && (
        <div className="text-sm">Baseline Version: <code>{summary.baseline_version}</code>{summary.baseline_last_run && <> — Last Run: <span className="font-mono">{new Date(summary.baseline_last_run).toLocaleString()}</span></>}</div>
      )}

      {artifactUrl && (
        <div className="text-sm"><a className="text-blue-600 underline" href={artifactUrl} target="_blank" rel="noreferrer">Artifact</a></div>
      )}

      <Card>
        <CardHeader><CardTitle>AUROC / P@100 / ECE — Last 30 days</CardTitle></CardHeader>
        <CardContent>
          {metrics.length===0 ? <p className="text-sm text-gray-500">No metrics</p> : (
            <table className="w-full text-sm">
              <thead><tr><th className="text-left">Date</th><th>AUROC</th><th>P@100</th><th>ECE</th></tr></thead>
              <tbody>
                {metrics.map((r:any)=> (
                  <tr key={r.date} className="border-b"><td>{r.date}</td><td className="text-center">{fmt(r.auroc)}</td><td className="text-center">{fmt(r.precision_at_100)}</td><td className="text-center">{fmt(r.ece)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KPI({ title, value }: { title:string; value?: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{value ?? '-'}</div></CardContent>
    </Card>
  )
}

function fmt(n?: number) { if (n===undefined||n===null) return '-'; return String(Math.round(Number(n)*1000)/1000) }
function formatRuns(r?: any) { if (!r) return '-'; const b=r.baseline?new Date(r.baseline).toLocaleDateString():'-'; const c=r.calibration?new Date(r.calibration).toLocaleDateString():'-'; const t=r.trends?new Date(r.trends).toLocaleDateString():'-'; return `B:${b} C:${c} T:${t}` }


