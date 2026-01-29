'use client';
import { useEffect, useState } from 'react'
import AdminProtectionWrapper from '../AdminProtectionWrapper'

export default function DemoPage() {
  const [data, setData] = useState<any>(null)
  const [err, setErr] = useState<string>('')
  const [busy, setBusy] = useState(false)

  async function runDemo() {
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/admin/demo/run')
      if (!res.ok) throw new Error(`Run failed (${res.status})`)
      const json = await res.json()
      setData(json)
    } catch (e: any) {
      setErr(e?.message || 'Run failed')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { runDemo() }, [])

  const copyEvidence = async () => {
    try {
      // Download proof zip
      const zipRes = await fetch('/api/admin/integration/proof/latest/download')
      if (zipRes.ok) {
        const blob = await zipRes.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'demo_proof.zip'
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
      // Download current demo JSON
      const jsonRes = await fetch('/api/admin/demo/current?download=1')
      if (jsonRes.ok) {
        const blob = await jsonRes.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'demo_current.json'
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    } catch {}
  }

  return (
    <AdminProtectionWrapper>
      <div className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Demo Script</h2>
        <p className="text-sm">Steps: frameworks → analyze → simulate → coach → bandit → readiness summary</p>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50" onClick={runDemo} disabled={busy}>Run Demo</button>
          <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={copyEvidence}>Copy Evidence</button>
        </div>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <pre className="text-xs bg-black/5 p-3 rounded overflow-auto">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </AdminProtectionWrapper>
  )
}







