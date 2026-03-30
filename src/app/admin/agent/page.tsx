'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminProtectionWrapper from '@/app/admin/AdminProtectionWrapper'

const API_BASE = '/api/admin/agent'

type TaskState =
  | 'pending'
  | 'awaiting_approval'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'paused'
  | 'cancelled'

interface Task {
  id: string
  state: TaskState
  goal: string
  context?: any
  data?: any
  requiresApproval?: boolean
  result?: any
  error?: { message: string }
  createdAt: number
  updatedAt: number
  approvedBy?: string
}

export default function AgentAdminPage(){
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [goal, setGoal] = useState('Generate a prediction for the provided input')
  const [contextText, setContextText] = useState('{}')
  const [dataText, setDataText] = useState('{}')
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [killActive, setKillActive] = useState<boolean>(false)
  const [busy, setBusy] = useState(false)
  const [actor, setActor] = useState<string>('creator@local')
  const [error, setError] = useState<string>('')

  function safeJson(text: string) {
    try { return text?.trim() ? JSON.parse(text) : {} } catch { return { __parseError: true } as any }
  }

  async function fetchKill(){
    const r = await fetch(`${API_BASE}/kill-switch`, { cache: 'no-store', headers: actor ? { 'x-actor-id': actor } : undefined })
    const j = await r.json()
    setKillActive(!!j?.active)
  }

  async function setKill(active: boolean){
    setBusy(true)
    try {
      const r = await fetch(`${API_BASE}/kill-switch`, { method: 'POST', headers: { 'content-type': 'application/json', ...(actor ? { 'x-actor-id': actor } : {}) }, body: JSON.stringify({ active }) })
      const j = await r.json()
      setKillActive(!!j?.active)
    } finally {
      setBusy(false)
    }
  }

  async function refreshTasks(){
    setLoading(true)
    try {
      const r = await fetch(`${API_BASE}/tasks`, { cache: 'no-store', headers: actor ? { 'x-actor-id': actor } : undefined })
      const j = await r.json()
      setTasks(j?.tasks ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function createTask(){
    setBusy(true)
    try {
      const ctx = safeJson(contextText)
      const data = safeJson(dataText)
      if ((ctx as any).__parseError || (data as any).__parseError) {
        setError('Context/Data must be valid JSON')
        return
      }
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(actor ? { 'x-actor-id': actor } : {}),
        },
        body: JSON.stringify({
          input: { goal, context: ctx, data },
          requiresApproval,
        }),
      })
      if (!res.ok) {
        const text = await res.text();
        let code = '', message = '', raw = '';
        try { const j = JSON.parse(text); code = j.code || ''; message = j.message || ''; raw = JSON.stringify(j); }
        catch { raw = text }
        setError(`Create failed: ${res.status} ${res.statusText}${code ? ` | code=${code}` : ''}${message ? ` | message=${message}` : ''}${raw ? ` | raw=${raw}` : ''}`);
        return;
      }
      setError('')
      await refreshTasks()
    } finally {
      setBusy(false)
    }
  }

  async function action(id: string, action: 'approve'|'start'|'pause'|'resume'|'cancel'){
    setBusy(true)
    try {
      const r = await fetch(`${API_BASE}/tasks`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', ...(actor ? { 'x-actor-id': actor } : {}) },
        body: JSON.stringify(action === 'approve' ? { id, action, approver: actor || 'approver@local' } : { id, action })
      })
      if (!r.ok) {
        const text = await r.text();
        let code = '', message = '', raw = '';
        try { const j = JSON.parse(text); code = j.code || ''; message = j.message || ''; raw = JSON.stringify(j); }
        catch { raw = text }
        setError(`Action failed: ${r.status} ${r.statusText}${code ? ` | code=${code}` : ''}${message ? ` | message=${message}` : ''}${raw ? ` | raw=${raw}` : ''}`);
        return;
      }
      const j = await r.json()
      if (j?.code === 'KILL_SWITCH_ACTIVE') {
        await fetchKill()
        return
      }
      if (j?.task) setTasks(prev => prev.map(t => t.id === id ? j.task : t))
    } finally {
      setBusy(false)
    }
  }

  function safeParse(s: string){
    try { return JSON.parse(s) } catch { return {} }
  }

  useEffect(() => {
    refreshTasks(); fetchKill()
    const i = setInterval(() => refreshTasks(), 4000)
    return () => clearInterval(i)
  }, [])

  return (
    <AdminProtectionWrapper>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Agentic Control Center</h1>
          <div className="flex items-center gap-3">
            <span className={`text-sm px-2 py-1 rounded ${killActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>Kill-Switch: {killActive ? 'ACTIVE' : 'OFF'}</span>
            <button disabled={busy} onClick={() => setKill(!killActive)} className="px-3 py-2 rounded bg-gray-900 text-white disabled:opacity-50">{killActive ? 'Disable' : 'Enable'}</button>
          </div>
        </div>

        {error ? (
          <div className="bg-red-100 text-red-800 px-3 py-2 rounded border border-red-300 text-sm">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Actor ID (dev)</label>
              <input value={actor} onChange={e=>setActor(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 placeholder-gray-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Goal</label>
              <input value={goal} onChange={e=>setGoal(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 placeholder-gray-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Context (JSON)</label>
              <textarea value={contextText} onChange={e=>setContextText(e.target.value)} rows={5} className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-xs bg-white text-gray-900 placeholder-gray-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data (JSON)</label>
              <textarea value={dataText} onChange={e=>setDataText(e.target.value)} rows={5} className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-xs bg-white text-gray-900 placeholder-gray-500" />
            </div>
            <div className="flex items-center gap-2">
              <input id="req" type="checkbox" checked={requiresApproval} onChange={e=>setRequiresApproval(e.target.checked)} />
              <label htmlFor="req" className="text-sm">Requires second-person approval</label>
            </div>
            <button type="button" disabled={busy} onClick={createTask} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">Create Task</button>
          </div>

          <div className="lg:col-span-2">
            <div className="overflow-auto border rounded">
              <table className="min-w-full text-sm bg-white text-gray-900">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 text-gray-900">ID</th>
                    <th className="text-left p-2 text-gray-900">State</th>
                    <th className="text-left p-2 text-gray-900">Goal</th>
                    <th className="text-left p-2 text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t.id} className="border-t">
                      <td className="p-2 font-mono text-xs">{t.id}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded ${badgeFor(t.state)}`}>{t.state}</span>
                        {t.requiresApproval && !t.approvedBy ? <span className="ml-2 text-xs text-yellow-700">needs approval</span> : null}
                      </td>
                      <td className="p-2 truncate max-w-[28rem]" title={t.goal}>{t.goal}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-2">
                          {t.state === 'awaiting_approval' && (
                            <button disabled={busy} onClick={()=>action(t.id,'approve')} className="px-2 py-1 rounded bg-emerald-600 text-white">Approve</button>
                          )}
                          {t.state === 'pending' && (
                            <button disabled={busy} onClick={()=>action(t.id,'start')} className="px-2 py-1 rounded bg-blue-600 text-white">Start</button>
                          )}
                          {t.state === 'running' && (
                            <button disabled={busy} onClick={()=>action(t.id,'pause')} className="px-2 py-1 rounded bg-yellow-600 text-white">Pause</button>
                          )}
                          {t.state === 'paused' && (
                            <button disabled={busy} onClick={()=>action(t.id,'resume')} className="px-2 py-1 rounded bg-indigo-600 text-white">Resume</button>
                          )}
                          {['pending','awaiting_approval','running','paused'].includes(t.state) && (
                            <button disabled={busy} onClick={()=>action(t.id,'cancel')} className="px-2 py-1 rounded bg-red-600 text-white">Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-4">
              {tasks.filter(t=>t.state==='succeeded' || t.state==='failed').map(t => (
                <div key={t.id} className="border rounded p-3">
                  <div className="text-sm mb-2">{t.state === 'succeeded' ? 'Result' : 'Error'} — <span className="font-mono">{t.id}</span></div>
                  <pre className="text-xs bg-gray-50 text-gray-900 p-2 rounded overflow-auto max-h-64">{JSON.stringify(t.state==='succeeded'?t.result:t.error, null, 2)}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminProtectionWrapper>
  )
}

function badgeFor(state: TaskState){
  switch (state) {
    case 'awaiting_approval': return 'bg-yellow-100 text-yellow-800'
    case 'pending': return 'bg-gray-100 text-gray-800'
    case 'running': return 'bg-blue-100 text-blue-800'
    case 'paused': return 'bg-indigo-100 text-indigo-800'
    case 'succeeded': return 'bg-green-100 text-green-800'
    case 'failed': return 'bg-red-100 text-red-800'
    case 'cancelled': return 'bg-gray-200 text-gray-700'
    default: return 'bg-gray-100 text-gray-800'
  }
}


