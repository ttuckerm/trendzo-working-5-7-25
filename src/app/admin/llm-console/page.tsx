"use client"
import React, { useState } from 'react'

type Role = 'teacher' | 'scout' | 'judge'

export default function LLMConsolePage() {
  const isMock = (process.env.NEXT_PUBLIC_LLM_PROVIDER === 'mock') || ((process.env as any).LLM_PROVIDER ?? 'mock') === 'mock'
  const [role, setRole] = useState<Role>('teacher')
  const [maxTokens, setMaxTokens] = useState<number>(isMock ? 128 : 128)
  const [prompt, setPrompt] = useState<string>(isMock ? 'hello world' : '')
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function run(roleToRun: Role) {
    setLoading(true)
    try {
      const res = await fetch(`/api/llm/${roleToRun}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], maxTokens })
      })
      const json = await res.json()
      setHistory(h => [{ ts: new Date().toISOString(), role: roleToRun, data: json }, ...h].slice(0,5))
    } catch (e) {
      setHistory(h => [{ ts: new Date().toISOString(), role: roleToRun, error: String(e) }, ...h].slice(0,5))
    } finally {
      setLoading(false)
    }
  }

  async function runOrchestrator() {
    setLoading(true)
    try {
      const res = await fetch(`/api/llm/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], maxTokens })
      })
      const json = await res.json()
      setHistory(h => [{ ts: new Date().toISOString(), role: 'orchestrator', data: json }, ...h].slice(0,5))
    } catch (e) {
      setHistory(h => [{ ts: new Date().toISOString(), role: 'orchestrator', error: String(e) }, ...h].slice(0,5))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">LLM Console</h1>
      <div className="flex gap-4 items-center">
        <label>
          Role
          <select className="ml-2 border rounded px-2 py-1" value={role} onChange={e=> setRole(e.target.value as Role)}>
            <option value="teacher">Teacher</option>
            <option value="scout">Scout</option>
            <option value="judge">Judge</option>
          </select>
        </label>
        <label>
          Max tokens
          <input className="ml-2 border rounded px-2 py-1 w-24" type="number" value={maxTokens} onChange={e=> setMaxTokens(Number(e.target.value||0))} />
        </label>
      </div>
      <textarea className="w-full border rounded p-3 h-40" placeholder="Enter a prompt" value={prompt} onChange={e=> setPrompt(e.target.value)} />
      <div className="flex gap-3">
        <button className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" disabled={loading} onClick={()=> run(role)}>Run</button>
        <button className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50" disabled={loading} onClick={runOrchestrator}>Run Orchestrator</button>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-medium">Recent</h2>
        {history.length === 0 && <div className="text-sm text-gray-500">No runs yet</div>}
        {history.map((h,i)=> (
          <div key={i} className="border rounded p-3">
            <div className="text-xs text-gray-500">{h.ts} · {h.role}</div>
            <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(h.error ? { error: h.error } : h.data, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  )
}


