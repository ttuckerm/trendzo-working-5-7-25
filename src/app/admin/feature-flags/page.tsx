"use client"
import React, { useEffect, useMemo, useState } from 'react'

type FeatureRow = { key: string; description?: string | null; default_state: boolean }

async function fetchFeatures(): Promise<FeatureRow[]> {
  const res = await fetch('/api/admin/flags', { cache: 'no-store' })
  if (!res.ok) return []
  return (await res.json())?.rows || []
}

async function toggleFeature(key: string, next: boolean){
  await fetch('/api/admin/flags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, default_state: next, action: 'toggle' }) })
}

export default function FeatureFlagsPage(){
  const [rows, setRows] = useState<FeatureRow[]>([])
  const [loading, setLoading] = useState(true)
  const [previewUserId, setPreviewUserId] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewResult, setPreviewResult] = useState<Record<string, boolean>>({})

  useEffect(() => { (async () => { setLoading(true); setRows(await fetchFeatures()); setLoading(false) })() }, [])

  const onToggle = async (key: string, cur: boolean) => {
    const next = !cur
    await toggleFeature(key, next)
    setRows(r => r.map(x => x.key === key ? { ...x, default_state: next } : x))
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('EVT.Flag.Toggled', { detail: { key, value: next } }))
  }

  const keys = useMemo(() => rows.map(r => r.key), [rows])
  const doPreview = async () => {
    const res = await fetch('/api/admin/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: previewUserId, keys }) })
    const json = await res.json()
    setPreviewResult(json || {})
  }

  return (
    <div className="p-6" data-testid="FF.List.Root">
      <div className="flex items-center gap-3 mb-4">
        <button className="px-3 py-2 rounded bg-gray-200" onClick={() => (async()=>{ setRows(await fetchFeatures()) })()}>
          Refresh
        </button>
        <button className="px-3 py-2 rounded bg-blue-600 text-white" data-testid="FF.PreviewOpen" onClick={() => setPreviewOpen(true)}>Preview as user</button>
      </div>
      {loading ? <div>Loading...</div> : (
        <div className="divide-y">
          {rows.map(r => (
            <div key={r.key} className="flex items-center justify-between py-3" data-testid={`FF.Row-${r.key}`}>
              <div className="flex flex-col">
                <span className="font-medium">{r.key}</span>
                <span className="text-xs text-gray-500">{r.description || ''}</span>
              </div>
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={!!r.default_state} onChange={() => onToggle(r.key, !!r.default_state)} data-testid={`FF.Toggle-${r.key}`} />
                  <span>{r.default_state ? 'ON' : 'OFF'}</span>
                </label>
                <input className="w-20 border rounded px-2 py-1" type="number" placeholder="%" min={0} max={100} data-testid={`FF.Percent-${r.key}`} readOnly />
                <input className="w-56 border rounded px-2 py-1" placeholder="segments" data-testid={`FF.Segments-${r.key}`} readOnly />
                <input className="w-56 border rounded px-2 py-1" type="datetime-local" data-testid={`FF.ScheduleStart-${r.key}`} readOnly />
                <input className="w-56 border rounded px-2 py-1" type="datetime-local" data-testid={`FF.ScheduleEnd-${r.key}`} readOnly />
              </div>
            </div>
          ))}
        </div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded shadow p-6 w-full max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Preview as user</h2>
              <button onClick={() => setPreviewOpen(false)}>Close</button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input value={previewUserId} onChange={e => setPreviewUserId(e.target.value)} className="flex-1 border rounded px-2 py-1" placeholder="User ID" data-testid="FF.PreviewUserId" />
              <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={doPreview}>Run</button>
            </div>
            <pre className="bg-gray-50 border rounded p-3 text-xs" data-testid="FF.PreviewResult">{JSON.stringify(previewResult, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}







