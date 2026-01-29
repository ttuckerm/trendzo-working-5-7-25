"use client"
import React, { useEffect, useState } from 'react'

type Progress = { tenant_id: string; stripe_connected: boolean; sdk_installed: boolean; qa_seed_run: boolean; preflight_passed: boolean }

export default function OnboardingPanel() {
  const [progress, setProgress] = useState<Progress | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('admin')
  const [tenant, setTenant] = useState('demo')

  const reload = async () => {
    const r = await fetch('/api/onboarding/status')
    const j = await r.json()
    setProgress(j.progress)
  }
  useEffect(()=>{ reload() }, [])

  const mark = async (key: keyof Progress, value: boolean) => {
    await fetch('/api/onboarding/mark', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ key, value, tenant_id: tenant }) })
    reload()
  }

  const invite = async () => {
    await fetch('/api/invites', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, role, tenant_id: tenant }) })
    reload()
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Onboarding</h2>
      <div data-testid='onboarding-checklist' className="text-sm text-gray-300 mb-2">
        <ul className="list-disc ml-5">
          <li>Stripe Connected: {progress?.stripe_connected ? 'COMPLETE' : 'PENDING'} <button className="ml-2 underline" onClick={()=>mark('stripe_connected', true)}>mark</button></li>
          <li>SDK Installed: {progress?.sdk_installed ? 'COMPLETE' : 'PENDING'} <button className="ml-2 underline" onClick={()=>mark('sdk_installed', true)}>mark</button></li>
          <li>QA Seed Run: {progress?.qa_seed_run ? 'COMPLETE' : 'PENDING'} <button className="ml-2 underline" onClick={()=>mark('qa_seed_run', true)}>mark</button></li>
          <li>Preflight Passed: {progress?.preflight_passed ? 'COMPLETE' : 'PENDING'} <button className="ml-2 underline" onClick={()=>mark('preflight_passed', true)}>mark</button></li>
        </ul>
      </div>
      <div className="mt-2">
        <div className="text-sm text-gray-400 mb-1">Invite user</div>
        <div className="flex gap-2">
          <input aria-label="Tenant" value={tenant} onChange={e=>setTenant(e.target.value)} className="px-2 py-1 bg-black/30 border border-white/10 rounded" placeholder="tenant id" />
          <input aria-label="Email" value={email} onChange={e=>setEmail(e.target.value)} className="px-2 py-1 bg-black/30 border border-white/10 rounded" placeholder="user@example.com" />
          <select aria-label="Role" value={role} onChange={e=>setRole(e.target.value)} className="px-2 py-1 bg-black/30 border border-white/10 rounded">
            <option value="admin">admin</option>
            <option value="editor">editor</option>
            <option value="viewer">viewer</option>
          </select>
          <button onClick={invite} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Invite</button>
        </div>
      </div>
    </div>
  )
}


