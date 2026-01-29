'use client'

import React, { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

import { useAccuracyStore } from './state'

// piecewise-linear interpolation through saved {x,y} points
function makeCalMap(points: Array<{x:number;y:number}>) {
  const pts = [...points].sort((a,b)=>a.x-b.x)
  return (p:number) => {
    if (pts.length === 0) return p
    if (p <= pts[0].x) return pts[0].y
    if (p >= pts[pts.length-1].x) return pts[pts.length-1].y
    for (let i=1;i<pts.length;i++){
      const a = pts[i-1], b = pts[i]
      if (p <= b.x){
        const t = (p - a.x) / Math.max(1e-9, (b.x - a.x))
        return a.y + t*(b.y - a.y)
      }
    }
    return p
  }
}

export default function ReliabilityChart({ cohort }: { cohort?: string }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const cohortFromStore = useAccuracyStore(s => s.selectedCohort)
  const devMode = useAccuracyStore(s => s.devMode)
  const refreshToken = useAccuracyStore(s => s.refreshToken)
  const setLastMetrics = useAccuracyStore(s => s.setLastMetrics)

  const [view, setView] = useState<'raw'|'cal'>('raw')
  const [calPoints, setCalPoints] = useState<Array<{x:number;y:number}>>([])

  async function load() {
    setLoading(true)
    try {
      // Build URL
      const params = new URLSearchParams()
      const selected = cohort || cohortFromStore || ''
      if (selected) params.set('cohort', selected)
      if (devMode) params.set('dev', '1')
      try {
        const since = new Date(Date.now() - 30*24*3600*1000).toISOString()
        params.set('since', since)
      } catch {}
      const res = await fetch(`/api/metrics/accuracy?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()

      // Expect { mode, reliability:{x:number[],y:number[]}, ece, auc, accuracy }
      const x: number[] = json?.reliability?.x ?? []
      const y: number[] = json?.reliability?.y ?? []

      // Push AUC/ECE to shared state so the top stats match Diagnostics
      setLastMetrics({
        ece: Number(json?.ece ?? 0),
        auc: Number(json?.auc ?? 0.5),
        accuracy: Number(json?.accuracy ?? 0),
        mode: json?.mode,
      })

      // continue to set local chart state with x/y as you already do
      setData(json)
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [cohort, cohortFromStore, devMode, refreshToken])

  useEffect(() => {
    if (view !== 'cal' || !cohort) return
    fetch(`/api/dev/calibration?cohort=${encodeURIComponent(cohort)}`)
      .then(r => r.json())
      .then(j => { if (j?.ok && Array.isArray(j.points)) setCalPoints(j.points) })
      .catch(()=>{ /* ignore */ })
  }, [view, cohort])

  // Base series from metrics
  const xs: number[] = Array.isArray(data?.reliability?.x) ? data.reliability.x : []
  const ys: number[] = Array.isArray(data?.reliability?.y) ? data.reliability.y : []

  // If CAL view, move each x to its calibrated value (y stays empirical)
  let plottedX: number[] = xs
  let eceToShow = Number(data?.ece ?? data?.ece_raw ?? 0)

  if (view === 'cal' && Array.isArray(xs) && xs.length > 0 && Array.isArray(ys) && ys.length === xs.length && calPoints.length >= 2) {
    const cal = makeCalMap(calPoints)
    plottedX = xs.map(cal)
    const n = xs.length
    const w = 1 / Math.max(1, n)
    eceToShow = xs.reduce((acc, _x, i) => acc + w * Math.abs((plottedX[i] ?? 0) - (ys[i] ?? 0)), 0)
  }

  // Labels drive the x-axis; prefer calibrated when available
  const labels = (view === 'cal' && plottedX.length === ys.length && plottedX.length > 0)
    ? plottedX
    : (data?.reliability_raw?.x || data?.reliability?.x || [])
  const datasets: any[] = []
  if (Array.isArray(data?.reliability_raw?.y)) {
    datasets.push({
      label: 'Empirical (raw)',
      data: data.reliability_raw.y,
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.3)'
    })
  } else if (Array.isArray(data?.reliability?.y)) {
    datasets.push({
      label: 'Empirical',
      data: data.reliability.y,
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.3)'
    })
  }
  if (Array.isArray(data?.reliability_cal?.y)) {
    datasets.push({
      label: 'Empirical (cal)',
      data: data.reliability_cal.y,
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.25)'
    })
  }
  datasets.push({
    label: 'Ideal',
    data: labels.map((x: number)=> x),
    borderColor: 'rgba(148,163,184,0.6)',
    backgroundColor: 'rgba(148,163,184,0.2)'
  })
  const chartData = { labels, datasets }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          className={`px-2 py-1 rounded ${view==='raw'?'bg-white/10':'bg-transparent'}`}
          onClick={()=>setView('raw')}
        >RAW</button>
        <button
          className={`px-2 py-1 rounded ${view==='cal'?'bg-white/10':'bg-transparent'}`}
          onClick={()=>setView('cal')}
        >CAL</button>
      </div>
      <div className="text-xs opacity-70">
        DEV · {view === 'raw' ? 'RAW' : 'CAL'} · ECE: {eceToShow.toFixed(3)} · AUC: {(data?.auc ?? 0).toFixed(3)}
      </div>
      <div className="bg-white rounded p-3">
        {Array.isArray(labels) && labels.length > 0 ? (
          <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Reliability Curve' } }, scales: { y: { min: 0, max: 1 }, x: { ticks: { callback: (v: any)=> (labels?.[v]??0).toFixed?.(2) } } } }} />
        ) : (
          <div className="text-sm text-gray-500">{`No data yet${cohort ? ` for ${cohort}` : ''}`}</div>
        )}
      </div>
      {data?.mode === 'dev' && cohort && (
        <div className="text-[11px] text-amber-700">Dev store (synthetic) — cohort: {cohort}</div>
      )}
    </div>
  )
}


