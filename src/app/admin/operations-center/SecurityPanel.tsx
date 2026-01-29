"use client"
import React, { useEffect, useState } from 'react'

export default function SecurityPanel() {
  const [scan, setScan] = useState<any>({ status: 'unknown', highs: 0 })
  useEffect(()=>{ (async()=>{ const r = await fetch('/api/security/scan/status'); const j = await r.json(); setScan(j) })() }, [])
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Security & Compliance</h2>
      <div className="text-sm text-gray-300">Deps/ZAP: {scan.status} • Highs: {scan.highs}</div>
      <a data-testid='zap-report-link' className="underline" href="/artifacts/zap/report.html" target="_blank" rel="noreferrer">ZAP Report</a>
      <div data-testid='access-review-table' className="mt-2 text-sm text-gray-300">Access reviews: see exports under compliance.</div>
    </div>
  )
}










