'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r=> r.json())

export function TimeseriesCharts({ range }: { range: string }) {
  const { data } = useSWR(`/api/admin/pipeline/throughput?range=${encodeURIComponent(range)}`, fetcher, { refreshInterval: 15000 })
  const ingest = data?.ingest_per_bucket || []
  const p95 = data?.p95_ms || []
  const p99 = data?.p99_ms || []
  const err = data?.error_rate || []
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-4" data-testid="chart-throughput">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartMini title="Ingest / bucket" data={ingest.map((d:any)=> ({ x: d.t, y: d.count }))} />
        <ChartMini title="Error rate" data={err.map((d:any)=> ({ x: d.t, y: d.rate }))} />
        <ChartMini title="p95 (ms)" data={p95.map((d:any)=> ({ x: d.t, y: d.ms }))} />
        <ChartMini title="p99 (ms)" data={p99.map((d:any)=> ({ x: d.t, y: d.ms }))} />
      </div>
    </div>
  )
}

function ChartMini({ title, data }: { title: string; data: { x: string; y: number }[] }) {
  return (
    <div className="rounded-lg border border-white/10 p-3">
      <div className="text-xs text-zinc-400 mb-2">{title}</div>
      <div className="h-28 relative">
        <svg className="absolute inset-0 w-full h-full">
          {data.length > 1 && (
            <polyline fill="none" stroke="#60a5fa" strokeWidth="1.5" points={polyPoints(data)} />
          )}
        </svg>
      </div>
    </div>
  )
}

function polyPoints(data: { x: string; y: number }[]): string {
  const w = 300
  const h = 100
  const xs = data.map((_, i)=> i / (data.length-1 || 1))
  const ys = data.map(d=> d.y)
  const max = Math.max(1, ...ys)
  return data.map((d, i)=> `${xs[i]*w},${h - (ys[i]/max)*h}`).join(' ')
}



