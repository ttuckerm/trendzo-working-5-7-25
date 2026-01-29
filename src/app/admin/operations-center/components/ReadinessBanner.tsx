'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r=> r.json())

export function ReadinessBanner({ onFilterFailing }: { onFilterFailing: () => void }) {
  const { data } = useSWR('/api/admin/pipeline/modules', fetcher, { refreshInterval: 15000 })
  const items = (data?.items || []) as any[]
  const failing = items.filter(m => m.overall_status && m.overall_status !== 'green')
  const ok = failing.length === 0
  if (ok) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm flex items-center justify-between" role="status">
        <span className="text-emerald-300 font-medium">Pipeline fresh. Discovery & Analysis are safe to use.</span>
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm flex items-center justify-between" role="status">
      <span className="text-red-300 font-medium">Pipeline not fresh — some modules failing SLOs.</span>
      <button onClick={onFilterFailing} className="text-xs px-3 py-1 rounded-md bg-white/10 hover:bg-white/20">View failing modules</button>
    </div>
  )
}


