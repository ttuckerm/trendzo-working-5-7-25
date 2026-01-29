'use client'

import React from 'react'
import { subscribe, getLogs } from '@/lib/debug/networkLog'

export function DebugDrawer() {
  const [open, setOpen] = React.useState(false)
  const [logs, setLogs] = React.useState(getLogs())

  React.useEffect(() => {
    return subscribe(() => setLogs([...getLogs()]))
  }, [])

  return (
    <>
      <button
        type="button"
        aria-label="Debug Drawer"
        onClick={() => setOpen(v => !v)}
        className="fixed right-3 top-1/2 -translate-y-1/2 z-50 rounded-full w-8 h-8 border border-white/20 bg-black/60 text-white hover:bg-black/70"
        title="Network Debug"
      >
        ?
      </button>
      {open && (
        <div className="fixed right-0 top-0 h-full w-[360px] z-50 bg-zinc-950 border-l border-white/10 shadow-xl flex flex-col">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <div className="text-sm font-semibold">Debug Drawer</div>
            <button onClick={()=> setOpen(false)} className="text-xs px-2 py-1 rounded border border-white/10">Close</button>
          </div>
          <div className="p-3 text-xs text-zinc-300 overflow-y-auto">
            {(logs.slice().reverse()).map((e)=> (
              <div key={e.id} className="mb-2 p-2 rounded border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="truncate max-w-[220px]" title={e.url}>
                    {e.method} {e.path}
                  </div>
                  <div className={e.ok? 'text-emerald-300' : 'text-red-300'}>
                    {e.ok? 'OK' : 'Error'} ({e.status})
                  </div>
                </div>
                <div className="text-zinc-500 mt-1">
                  {e.auditId ? `Audit #${e.auditId} • ` : ''}{e.durationMs.toFixed(0)}ms • {new Date(e.atISO).toLocaleTimeString()}
                </div>
                {e.errorText && (
                  <div className="text-red-300 mt-1">{e.errorText}</div>
                )}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-zinc-500">No calls yet</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}














