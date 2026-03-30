'use client'

import { useEffect, useState } from 'react'

type BaselinePayload = {
  cohort_version: string
  last_30d: { n: number; auroc: number; precision_at_100: number; ece: number }
  computed_at: string
}

export default function BaselinePage() {
  const [data, setData] = useState<BaselinePayload | null>(null)
  useEffect(() => {
    fetch('/status/baseline').then(r=>r.json()).then(setData).catch(()=>{})
  }, [])
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">Baseline Metrics</h1>
      {data && (
        <div className="mt-4 space-y-2">
          <div>Cohort: {data.cohort_version}</div>
          <div>N (30d): {data.last_30d.n}</div>
          <div>AUROC: {data.last_30d.auroc}</div>
          <div>Precision@100: {data.last_30d.precision_at_100}</div>
          <div>ECE: {data.last_30d.ece}</div>
          <div className="text-sm text-gray-600">Computed at: {data.computed_at}</div>
          <div className="text-sm text-gray-600 mt-2">Methods: cohorting by follower band, 48h validation window, heated exclusion.</div>
        </div>
      )}
    </div>
  )
}


