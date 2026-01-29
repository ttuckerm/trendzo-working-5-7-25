'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function OpsValidationPage() {
  const [cohort, setCohort] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()

  async function load() {
    setLoading(true)
    try {
      const qs = new URLSearchParams({})
      if (cohort) qs.set('cohort', cohort)
      const r = await fetch(`/api/metrics/accuracy?${qs.toString()}`, { cache: 'no-store' })
      const j = await r.json()
      setData(j)
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  async function seedDemo() {
    setBusy(true)
    try {
      const r = await fetch('/api/debug/seed-p1-demo', { method: 'POST' })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'seed_failed')
      if (!cohort) setCohort('demo_tmp_0::A')
      toast({ title: 'Seed complete', description: `Inserted ${j.insertedPredictions} predictions, ${j.insertedOutcomes} outcomes` })
      await load()
    } catch (e: any) {
      toast({ title: 'Seed failed', description: String(e?.message || e), variant: 'destructive' })
    } finally { setBusy(false) }
  }

  async function recalibrate() {
    setBusy(true)
    try {
      const r = await fetch('/api/jobs/calibrate', { method: 'POST' })
      const j = await r.json().catch(()=> ({}))
      if (!r.ok) throw new Error(j?.error || 'calibrate_failed')
      toast({ title: 'Recalibration complete', description: `Cohorts ${j.cohorts ?? '—'} • avgECE ${(j.avgECE ?? 0).toFixed?.(3)}` })
      await load()
    } catch (e: any) {
      toast({ title: 'Recalibration failed', description: String(e?.message || e), variant: 'destructive' })
    } finally { setBusy(false) }
  }

  const chartData = {
    labels: data?.reliability?.x || [],
    datasets: [
      {
        label: 'Empirical',
        data: data?.reliability?.y || [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.3)'
      },
      {
        label: 'Ideal',
        data: (data?.reliability?.x || []).map((x: number)=> x),
        borderColor: 'rgba(148,163,184,0.6)',
        backgroundColor: 'rgba(148,163,184,0.2)'
      }
    ]
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Model Validation</h1>
            <p className="text-sm text-gray-500">Reliability and accuracy by cohort</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-sm border rounded px-3 py-1" onClick={seedDemo} disabled={busy}>Seed demo data</button>
            <button className="text-sm border rounded px-3 py-1" onClick={recalibrate} disabled={busy}>Recalibrate now</button>
          </div>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Accuracy Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 mb-4">
            <input className="border rounded px-2 py-1" placeholder="cohort key (optional)" value={cohort} onChange={e=> setCohort(e.target.value)} />
            <button className="text-sm border rounded px-3 py-1" onClick={load} disabled={loading}>{loading? 'Loading…' : 'Refresh'}</button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div><div className="text-sm text-gray-500">Accuracy</div><div className="text-xl">{(data?.accuracy!=null)? (data.accuracy*100).toFixed(1)+'%':'—'}</div></div>
            <div><div className="text-sm text-gray-500">ECE</div><div className="text-xl">{(data?.ece!=null)? data.ece.toFixed(3):'—'}</div></div>
            <div><div className="text-sm text-gray-500">AUROC</div><div className="text-xl">{(data?.auc!=null)? data.auc.toFixed(3):'—'}</div></div>
          </div>
          <div className="bg-white rounded p-4">
            <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Reliability Curve' } }, scales: { y: { min: 0, max: 1 }, x: { ticks: { callback: (v: any)=> (data?.reliability?.x?.[v]??0).toFixed?.(2) } } } }} />
          </div>
          {data?.lastCalibration && (
            <div className="text-xs text-gray-500 mt-3">Last calibration: {data.lastCalibration.at} • Model {data.lastCalibration.modelVersion || '—'}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


