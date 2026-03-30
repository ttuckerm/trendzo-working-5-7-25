"use client";
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

type Flags = {
  demo_mode: boolean
  allow_live_db_writes: boolean
  allow_external_api_calls: boolean
  allow_billing: boolean
  allow_webhooks: boolean
}

export default function Flipboard() {
  const [flags, setFlags] = useState<Flags | null>(null)
  const [error, setError] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<any>(null)
  const [preview, setPreview] = useState<{ for: string; target: 'live'|'mock'; data: any }|null>(null)

  useEffect(() => {
    fetch('/api/admin/flipboard/status').then(r => r.json()).then(d => setStatus(d.flipboard)).catch(e => setError(String(e)))
  }, [])

  async function update(partial: Partial<Flags>) {
    if (!flags) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/flipboard/flags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...flags, ...partial }) })
      if (!res.ok) throw new Error(`Save failed (${res.status})`)
      const json = await res.json()
      setFlags(json.flags)
    } catch (e: any) {
      setError(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (error) return <div className="p-4 text-red-600">{error}</div>
  if (!status) return <div className="p-4">Loading…</div>

  const Warning = ({ children }: { children: ReactNode }) => (
    <div className="border border-red-400 bg-red-50 text-red-800 px-3 py-2 rounded text-sm">{children}</div>
  )

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Super Admin Flipboard</h2>
      <Warning>
        DEMO MODE forces all live switches OFF. Enabling live switches is irreversible in production. Proceed with extreme caution.
      </Warning>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {['ingestion','validation','telemetry','billing','alarms'].map((id) => (
          <div key={id} className="p-3 border rounded space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold capitalize">{id}</div>
              <div className={status?.[id]?.mode === 'live' ? 'text-green-600' : 'text-gray-500'}>{status?.[id]?.mode?.toUpperCase()||'MOCK'}</div>
            </div>
            <div className="text-xs">Prereqs: {status?.[id]?.prereq_ok ? 'OK' : `Missing ${status?.[id]?.missing?.length||0}`}</div>
            <div className="flex gap-2">
              <button className="px-2 py-1 text-xs rounded border" onClick={async ()=>{
                const res = await fetch('/api/admin/flipboard/preview', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ switch: id, target: status?.[id]?.mode==='live'?'mock':'live' }) })
                const json = await res.json()
                setPreview({ for: id, target: status?.[id]?.mode==='live'?'mock':'live', data: json })
              }}>Preview</button>
              <button className="px-2 py-1 text-xs rounded border" disabled>Apply</button>
            </div>
          </div>
        ))}
      </div>
      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white text-black p-4 rounded w-[520px] max-w-[92vw] space-y-3">
            <div className="font-semibold">Preview: {preview.for} → {preview.target.toUpperCase()}</div>
            <pre className="text-xs bg-black/5 p-2 rounded max-h-[40vh] overflow-auto">{JSON.stringify(preview.data, null, 2)}</pre>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 border rounded" onClick={()=>setPreview(null)}>Close</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50" disabled={!preview.data?.ok} onClick={async ()=>{
                const ts = Date.now()
                const res = await fetch('/api/admin/flipboard/apply', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ switch: preview.for, target: preview.target, confirm_token: preview.data.confirm_token, ts }) })
                const json = await res.json()
                if (json.applied) {
                  // refresh status
                  const st = await fetch('/api/admin/flipboard/status').then(r=>r.json())
                  setStatus(st.flipboard)
                  setPreview(null)
                }
              }}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


