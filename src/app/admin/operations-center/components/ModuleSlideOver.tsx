'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r=> r.json())

type TabId = 'overview'|'runs'|'logs'|'config'|'deps'|'slo'|'runbook'

export function ModuleSlideOver({ id, onClose }: { id: string | null; onClose: ()=> void }) {
  const [tab, setTab] = useState<TabId>('overview')
  useEffect(()=>{ if (id) setTab('overview') }, [id])
  const { data: mod } = useSWR(id ? `/api/admin/pipeline/modules/${id}` : null, fetcher)
  const { data: runs } = useSWR(id && tab==='runs' ? `/api/admin/pipeline/modules/${id}/runs?limit=50` : null, fetcher, { refreshInterval: 15000 })
  const { data: logs } = useSWR(id && tab==='logs' ? `/api/admin/pipeline/modules/${id}/logs?limit=100` : null, fetcher, { refreshInterval: 10000 })
  const { data: cfg } = useSWR(id && tab==='config' ? `/api/admin/pipeline/modules/${id}/config` : null, fetcher)
  const { data: slo } = useSWR(id && tab==='slo' ? `/api/admin/pipeline/modules/${id}/slo` : null, fetcher)
  const { data: runbook } = useSWR(id && tab==='runbook' ? `/api/admin/pipeline/modules/${id}/runbook` : null, fetcher)
  const { data: dag } = useSWR(tab==='deps' ? '/api/admin/pipeline/dag' : null, fetcher)

  const deps = useMemo(()=>{
    if (!id || !dag) return { up: [], down: [] }
    const node = dag.nodes.find((n:any)=> n.module_id===id || n.id===id)
    if (!node) return { up: [], down: [] }
    const up = dag.edges.filter((e:any)=> e.downstream_node_id===node.id).map((e:any)=> dag.nodes.find((n:any)=> n.id===e.upstream_node_id))
    const down = dag.edges.filter((e:any)=> e.upstream_node_id===node.id).map((e:any)=> dag.nodes.find((n:any)=> n.id===e.downstream_node_id))
    return { up, down }
  }, [id, dag])

  if (!id) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[720px] bg-zinc-950 border-l border-white/10 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-semibold">{mod?.module?.name || id}</div>
          <button onClick={onClose} className="text-sm">Close</button>
        </div>
        <div className="flex gap-2 mb-3" role="tablist" data-testid="slideovers-tabs">
          {(['overview','runs','logs','config','deps','slo','runbook'] as TabId[]).map(t=> (
            <button key={t} role="tab" aria-selected={tab===t} onClick={()=> setTab(t)} className={`px-3 py-1.5 rounded-md text-xs border ${tab===t ? 'border-white/30 bg-white/10' : 'border-white/10 hover:border-white/20'}`}>{t.toUpperCase()}</button>
          ))}
        </div>
        {tab==='runbook' && (
          <div className="prose prose-invert max-w-none text-sm">
            <pre className="whitespace-pre-wrap">{runbook?.markdown || 'No runbook yet.'}</pre>
          </div>
        )}
        {tab==='overview' && (
          <div className="space-y-2">
            <div className="text-sm">Version: <span className="font-medium">{mod?.module?.version || '—'}</span></div>
            <div className="text-sm">Enabled: <span className="font-medium">{String(mod?.module?.enabled)}</span></div>
          </div>
        )}
        {tab==='runs' && (
          <div className="space-y-2">
            {(runs?.items||[]).map((r:any)=> (
              <div key={r.id} className="text-sm rounded border border-white/10 p-2 flex justify-between">
                <div>{r.status}</div>
                <div>{new Date(r.started_at).toLocaleString()}</div>
                <div>{r.duration_ms || '—'} ms</div>
              </div>
            ))}
          </div>
        )}
        {tab==='logs' && (
          <div className="space-y-2">
            <div className="flex justify-end">
              {logs?.download_url && <a href={logs.download_url} className="text-xs px-2 py-1 rounded border border-white/10" download>Download</a>}
            </div>
            {(logs?.items||[]).map((l:any)=> (
              <div key={l.id} className="text-xs rounded border border-white/10 p-2">
                <span className="opacity-60 mr-2">{new Date(l.ts).toLocaleTimeString()}</span>
                <span className="uppercase mr-2">{l.level}</span>
                <span>{l.message}</span>
              </div>
            ))}
          </div>
        )}
        {tab==='config' && (
          <ConfigEditor id={id} cfg={cfg?.config} />
        )}
        {tab==='deps' && (
          <div className="text-sm">
            <div className="font-semibold mb-1">Upstream</div>
            <ul className="mb-2 list-disc list-inside">
              {deps.up.map((n:any)=> <li key={n.id}>{n.label || n.id}</li>)}
            </ul>
            <div className="font-semibold mb-1">Downstream</div>
            <ul className="list-disc list-inside">
              {deps.down.map((n:any)=> <li key={n.id}>{n.label || n.id}</li>)}
            </ul>
          </div>
        )}
        {tab==='slo' && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded border border-white/10 p-3"><div className="text-zinc-400 text-xs">Error budget burn</div><div className="text-lg font-semibold">{slo?.error_budget_burn ?? 0}</div></div>
            <div className="rounded border border-white/10 p-3"><div className="text-zinc-400 text-xs">Uptime</div><div className="text-lg font-semibold">{slo?.uptime_percent ?? 0}%</div></div>
            <div className="rounded border border-white/10 p-3"><div className="text-zinc-400 text-xs">p95</div><div className="text-lg font-semibold">{slo?.p95_ms ?? 0} ms</div></div>
            <div className="rounded border border-white/10 p-3"><div className="text-zinc-400 text-xs">p99</div><div className="text-lg font-semibold">{slo?.p99_ms ?? 0} ms</div></div>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfigEditor({ id, cfg }: { id: string; cfg: any }) {
  const [scale, setScale] = useState<number>(cfg?.scale || 1)
  const [enabled, setEnabled] = useState<boolean>(cfg?.enabled ?? true)
  const [saving, setSaving] = useState(false)
  useEffect(()=> { setScale(cfg?.scale || 1); setEnabled(cfg?.enabled ?? true) }, [cfg])
  return (
    <form onSubmit={async (e)=> {
      e.preventDefault()
      setSaving(true)
      await fetch(`/api/admin/pipeline/modules/${id}/config`, { method:'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ scale, enabled }) })
      setSaving(false)
    }} className="space-y-3 text-sm">
      <label className="flex items-center gap-2"><input type="checkbox" checked={enabled} onChange={e=> setEnabled(e.target.checked)} /> Enabled</label>
      <div>
        <div className="text-xs text-zinc-400">Scale</div>
        <input type="number" className="mt-1 w-24 rounded border border-white/10 bg-black px-2 py-1" value={scale} onChange={e=> setScale(Number(e.target.value))} min={0} max={100} />
      </div>
      <button type="submit" className="text-xs px-3 py-1 rounded border border-white/10" disabled={saving}>{saving? 'Saving...' : 'Save'}</button>
    </form>
  )
}



