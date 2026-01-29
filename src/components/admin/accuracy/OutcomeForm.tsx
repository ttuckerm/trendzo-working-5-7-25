'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useAccuracyStore } from './state'

export default function OutcomeForm() {
  const [form, setForm] = useState({
    templateId: '',
    variantId: '',
    platform: 'tiktok',
    views: 10000,
    watchTimePct: 35,
    retention3s: 0.6,
    retention8s: 0.4,
    ctr: 0.03,
    sharesPer1k: 8,
    savesPer1k: 5,
    completionRate: 0.55
  })
  const [loading, setLoading] = useState(false)
  const [resp, setResp] = useState<any>(null)
  const { toast } = useToast()
  const bumpRefresh = useAccuracyStore(s => s.bumpRefresh)
  const selectedCohort = useAccuracyStore(s => s.selectedCohort)

  function set<K extends keyof typeof form>(k: K, v: any) { setForm(prev => ({ ...prev, [k]: v })) }

  async function submit() {
    setLoading(true)
    try {
      const r = await fetch('/api/outcomes/ingest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          templateId: form.templateId,
          variantId: form.variantId || null,
          platform: form.platform,
          metrics: {
            views: form.views,
            watchTimePct: form.watchTimePct,
            retention3s: form.retention3s,
            retention8s: form.retention8s,
            ctr: form.ctr,
            sharesPer1k: form.sharesPer1k,
            savesPer1k: form.savesPer1k,
            completionRate: form.completionRate
          }
        })
      })
      const j = await r.json()
      setResp(j)
      if (r.ok) {
        const lbl = j?.label === true ? 'Viral' : 'Not'
        const pct = (j?.percentile!=null) ? String(j.percentile) : '—'
        toast({ title: 'Outcome logged', description: `label: ${lbl} • percentile: ${pct}` })
        if (selectedCohort) bumpRefresh()
      } else {
        throw new Error(j?.error || 'submit_failed')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="border rounded p-3 space-y-2">
      <div className="font-medium">Log Outcome</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <Input value={form.templateId} onChange={e=> set('templateId', e.target.value)} placeholder="templateId" />
        <Input value={form.variantId} onChange={e=> set('variantId', e.target.value)} placeholder="variantId (optional)" />
        <select className="bg-white text-gray-900 dark:text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={form.platform} onChange={e=> set('platform', e.target.value)}>
          <option value="tiktok">tiktok</option>
          <option value="instagram">instagram</option>
          <option value="youtube">youtube</option>
        </select>
        <Input type="number" value={form.views} onChange={e=> set('views', Number(e.target.value))} placeholder="views" />
        <Input type="number" value={form.watchTimePct} onChange={e=> set('watchTimePct', Number(e.target.value))} placeholder="watchTimePct" />
        <Input type="number" value={form.retention3s} onChange={e=> set('retention3s', Number(e.target.value))} placeholder="retention3s" />
        <Input type="number" value={form.retention8s} onChange={e=> set('retention8s', Number(e.target.value))} placeholder="retention8s" />
        <Input type="number" value={form.ctr} onChange={e=> set('ctr', Number(e.target.value))} placeholder="ctr" />
        <Input type="number" value={form.sharesPer1k} onChange={e=> set('sharesPer1k', Number(e.target.value))} placeholder="shares per 1k" />
        <Input type="number" value={form.savesPer1k} onChange={e=> set('savesPer1k', Number(e.target.value))} placeholder="saves per 1k" />
        <Input type="number" value={form.completionRate} onChange={e=> set('completionRate', Number(e.target.value))} placeholder="completion rate" />
      </div>
      <button className="text-sm border rounded px-3 py-1" onClick={submit} disabled={loading}>{loading? 'Submitting…' : 'Submit'}</button>
      {resp && (
        <div className="text-xs text-gray-600">label: {resp?.label===true? 'Viral':'Not'} • percentile: {resp?.percentile ?? '—'}</div>
      )}
    </div>
  )
}


