"use client";
import { useEffect, useState } from 'react'

type JobRow = { id: string; type: string; status: string; attempts: number; created_at: string }

export default function JobsTab() {
  const [queueDepth, setQueueDepth] = useState<number>(0)
  const [jobs, setJobs] = useState<JobRow[]>([])
  useEffect(() => { load(); const id = setInterval(load, 5000); return () => clearInterval(id) }, [])
  async function load() {
    try {
      const metricsRes = await fetch('/api/ingest/metrics')
      const metrics = await metricsRes.json()
      setQueueDepth(metrics.queued || 0)
    } catch {}
    try {
      const res = await fetch('/api/admin/jobs/list')
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch {}
  }
  async function enqueueTest() {
    await fetch('/api/admin/jobs/enqueue', { method: 'POST', body: JSON.stringify({ type: 'test', payload: {} }), headers: { 'content-type': 'application/json' } })
    await load()
  }
  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div data-testid='queue-depth'>Queue depth: {queueDepth}</div>
        <button onClick={enqueueTest}>Enqueue test job</button>
      </div>
      <div data-testid='backup-status' style={{ marginTop: 8 }}>Latest backup: N/A</div>
      <div style={{ marginTop: 12 }}>
        {jobs.map(j => (
          <div key={j.id} style={{ display: 'flex', gap: 12, padding: 8, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div>{j.type}</div>
            <div>{j.status}</div>
            <div>attempts: {j.attempts}</div>
            <div>{new Date(j.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


