'use client'

import { useEffect, useState } from 'react'

export default function GuardrailsAdminPage() {
  const [cfg, setCfg] = useState<any>(null)
  const [metrics, setMetrics] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const r1 = await fetch('/api/guardrails/config', { cache: 'no-store' })
    setCfg(await r1.json())
    const r2 = await fetch('/api/guardrails/metrics', { cache: 'no-store' })
    setMetrics(await r2.json())
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/guardrails/config', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cfg) })
      await load()
    } finally { setSaving(false) }
  }

  if (!cfg) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Guardrails</h1>
      <div className="grid grid-cols-2 gap-4">
        {Object.keys(cfg).map(k => (
          <label key={k} className="flex flex-col text-sm">
            <span className="text-gray-600 mb-1">{k}</span>
            <input className="border p-2 rounded" value={cfg[k]} onChange={e=>setCfg({ ...cfg, [k]: Number(e.target.value) })} />
          </label>
        ))}
      </div>
      <button onClick={save} disabled={saving} className="px-3 py-2 bg-indigo-600 text-white rounded">
        {saving ? 'Saving…' : 'Save'}
      </button>
      <div className="mt-6">
        <h2 className="font-semibold mb-2">Metrics</h2>
        <pre className="text-xs bg-black/10 p-3 rounded">{JSON.stringify(metrics, null, 2)}</pre>
      </div>
    </div>
  )
}


