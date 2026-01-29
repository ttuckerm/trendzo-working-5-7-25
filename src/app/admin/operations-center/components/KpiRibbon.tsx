'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r=> r.json())

export function KpiRibbon({ range }: { range: string }) {
  const { data } = useSWR(`/api/admin/pipeline/status?range=${encodeURIComponent(range)}`, fetcher, { refreshInterval: 15000 })
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4" role="region" aria-label="KPI Ribbon">
      <div data-testid="kpi-processed-today" className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-4">
        <div className="text-xs text-zinc-400">Processed Today</div>
        <div className="text-2xl font-bold">{data?.processed_count?.toLocaleString?.() || 0}</div>
      </div>
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-4">
        <div className="text-xs text-zinc-400">Modules Online</div>
        <div className="text-2xl font-bold">{data?.modules_online || 0}/12</div>
      </div>
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-4">
        <div className="text-xs text-zinc-400">Uptime</div>
        <div className="text-2xl font-bold">{(data?.uptime_percent ?? 0).toFixed(2)}%</div>
      </div>
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-4">
        <div className="text-xs text-zinc-400">Predictions Today</div>
        <div className="text-2xl font-bold">{data?.predictions_today || 0}</div>
      </div>
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-4">
        <div className="text-xs text-zinc-400">Data Freshness</div>
        <div className="text-sm font-medium">{data?.data_freshness_ts ? new Date(data.data_freshness_ts).toLocaleString() : '—'}</div>
      </div>
    </div>
  )
}



