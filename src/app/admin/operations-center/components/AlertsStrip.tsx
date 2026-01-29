'use client'

import { useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r=> r.json())

export function AlertsStrip() {
  const { data } = useSWR('/api/admin/pipeline/alerts', fetcher, { refreshInterval: 10000 })
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<{ type?: string; severity?: string }>(()=> ({}))
  const alerts = data?.alerts || []
  const filtered = alerts.filter((a:any)=> (!filters.type || a.type===filters.type) && (!filters.severity || a.severity===filters.severity))
  const hasAlerts = filtered.length > 0
  return (
    <div className={`rounded-lg border ${hasAlerts ? 'border-red-500/30 bg-red-500/10' : 'border-zinc-700/50 bg-zinc-900'} px-4 py-2 flex items-center justify-between`} data-testid="alerts-banner">
      <div className="text-sm">
        {alerts.length ? (
          <span className="text-red-300 font-medium">{alerts.length} active incident{alerts.length>1?'s':''}</span>
        ) : (
          <span className="text-zinc-400">No active incidents</span>
        )}
      </div>
      <button onClick={()=> setOpen(true)} className="text-xs px-3 py-1 rounded-md bg-white/10 hover:bg-white/20">View details</button>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={()=> setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-zinc-950 border-l border-white/10 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Alert details</h3>
              <button onClick={()=> setOpen(false)} className="text-sm">Close</button>
            </div>
            <div className="flex gap-2 mb-3">
              <select className="bg-black border border-white/10 text-xs rounded px-2 py-1" value={filters.type||''} onChange={e=> setFilters(f=> ({ ...f, type: e.target.value || undefined }))}>
                <option value="">All types</option>
                <option value="slo_breach">SLO breach</option>
                <option value="backlog_spike">Backlog spike</option>
                <option value="actor_failing">Actor failing</option>
                <option value="algo_drift">Algo drift</option>
              </select>
              <select className="bg-black border border-white/10 text-xs rounded px-2 py-1" value={filters.severity||''} onChange={e=> setFilters(f=> ({ ...f, severity: e.target.value || undefined }))}>
                <option value="">All severities</option>
                <option value="info">info</option>
                <option value="warn">warn</option>
                <option value="crit">crit</option>
              </select>
            </div>
            <div className="space-y-3" data-testid="slideovers-tabs">
              {filtered.map((a:any)=> (
                <div key={a.id} className="rounded-lg border border-white/10 p-3">
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-zinc-400">{a.type} • {a.severity}</div>
                  <div className="text-xs mt-2">{a.description}</div>
                  <div className="mt-2 flex gap-2">
                    <button className="text-xs px-2 py-1 rounded border border-white/10" onClick={async()=> { await fetch('/api/admin/pipeline/alerts/ack', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ id: a.id }) }); }}>Acknowledge</button>
                    <button className="text-xs px-2 py-1 rounded border border-white/10" onClick={async()=> { await fetch('/api/admin/pipeline/alerts/resolve', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ id: a.id }) }); }}>Resolve</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


