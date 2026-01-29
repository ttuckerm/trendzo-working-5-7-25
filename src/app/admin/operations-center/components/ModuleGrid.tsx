'use client'

import useSWR from 'swr'
import { useMemo } from 'react'

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r=> r.json())

const MODULE_ORDER = [
  'tiktok-scraper','viral-pattern-analyzer','template-discovery','draft-video-analyzer',
  'script-intelligence','recipe-book-generator','prediction-engine','performance-validator',
  'marketing-content-creator','dashboard-aggregator','system-health-monitor','process-intelligence-layer'
]

export function ModuleGrid({ onOpen }: { onOpen: (id: string)=> void }) {
  const { data } = useSWR('/api/admin/pipeline/modules', fetcher, { refreshInterval: 15000 })
  const items = useMemo(()=>{
    const arr = data?.items || []
    const byId: Record<string, any> = Object.fromEntries(arr.map((m:any)=> [m.id, m]))
    return MODULE_ORDER.map(id => byId[id]).filter(Boolean)
  }, [data])
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((m:any)=> (
        <button key={m.id} onClick={()=> onOpen(m.id)} className="text-left rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-4 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/20" data-testid={`module-tile-${m.id}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-400">{m.name}</div>
              <div className="text-xs text-zinc-500">v{m.version}</div>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full ${m.last_status==='success' ? 'bg-green-400' : m.last_status==='failed' ? 'bg-red-400' : 'bg-zinc-400'}`} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-zinc-400 text-xs">Processed</div>
              <div className="font-semibold">{(m.processed||0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-zinc-400 text-xs">Uptime</div>
              <div className="font-semibold">{(m.uptime_percent||0).toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-zinc-400 text-xs">Last run</div>
              <div className="font-semibold">{m.last_run_at ? new Date(m.last_run_at).toLocaleTimeString() : '—'}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}


