'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useAccuracyStore } from './state'

export default function RunPredictionPanel() {
  const [form, setForm] = useState({
    viewCount: 10000,
    likeCount: 500,
    commentCount: 50,
    shareCount: 20,
    followerCount: 10000,
    platform: 'tiktok',
    hoursSinceUpload: 1,
    templateId: '',
    variantId: ''
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()
  const setSelectedCohort = useAccuracyStore(s => s.setSelectedCohort)
  const bumpRefresh = useAccuracyStore(s => s.bumpRefresh)
  const setLastPrediction = useAccuracyStore(s => s.setLastPrediction)

  async function run() {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/prediction/unified-predict', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-recheck': 'true' },
        body: JSON.stringify({
          viewCount: form.viewCount,
          likeCount: form.likeCount,
          commentCount: form.commentCount,
          shareCount: form.shareCount,
          followerCount: form.followerCount,
          platform: form.platform,
          hoursSinceUpload: form.hoursSinceUpload
        })
      })
      if (!r.ok) {
        const err = await r.json().catch(()=> ({}))
        throw new Error(err?.error || 'run_failed')
      }
      const j = await r.json()
      const prediction = j?.prediction || j?.data || j || {}
      const probability = Number(prediction?.calibratedProbability ?? prediction?.viralProbability ?? prediction?.probability ?? NaN)
      const score = Number(prediction?.viralScore ?? prediction?.score ?? NaN)
      const modelVersion = String(prediction?.meta?.modelVersion || j?.engine || '') || undefined
      const cohortKey = form.templateId && form.variantId ? `${form.templateId}::${form.variantId}` : undefined
      setResult({ probability, score, cohortKey, modelVersion })
      setLastPrediction({ probability, score, cohortKey, modelVersion })
      if (cohortKey) {
        setSelectedCohort(cohortKey)
        bumpRefresh()
      }
      toast({ title: 'Prediction complete', description: `prob ${isNaN(probability)? '—' : (probability*100).toFixed(1)+'%'} • model ${modelVersion || '—'}` })
    } catch (e: any) {
      toast({ title: 'Prediction failed', description: String(e?.message || e), variant: 'destructive' })
    } finally { setLoading(false) }
  }

  function set<K extends keyof typeof form>(k: K, v: any) { setForm(prev => ({ ...prev, [k]: v })) }

  function copy(text: string) {
    try { navigator?.clipboard?.writeText(text) } catch {}
    toast({ title: 'Copied', description: text })
  }

  return (
    <div className="border rounded p-3 space-y-2">
      <div className="font-medium">Run Prediction</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <Input type="number" value={form.viewCount} onChange={e=> set('viewCount', Number(e.target.value))} placeholder="views" />
        <Input type="number" value={form.likeCount} onChange={e=> set('likeCount', Number(e.target.value))} placeholder="likes" />
        <Input type="number" value={form.commentCount} onChange={e=> set('commentCount', Number(e.target.value))} placeholder="comments" />
        <Input type="number" value={form.shareCount} onChange={e=> set('shareCount', Number(e.target.value))} placeholder="shares" />
        <Input type="number" value={form.followerCount} onChange={e=> set('followerCount', Number(e.target.value))} placeholder="followers" />
        <select className="bg-white text-gray-900 dark:text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={form.platform} onChange={e=> set('platform', e.target.value)}>
          <option value="tiktok">tiktok</option>
          <option value="instagram">instagram</option>
          <option value="youtube">youtube</option>
        </select>
        <Input type="number" value={form.hoursSinceUpload} onChange={e=> set('hoursSinceUpload', Number(e.target.value))} placeholder="hours since upload" />
        <Input value={form.templateId} onChange={e=> set('templateId', e.target.value)} placeholder="templateId (optional)" />
        <Input value={form.variantId} onChange={e=> set('variantId', e.target.value)} placeholder="variantId (optional)" />
      </div>
      <button className="text-sm border rounded px-3 py-1" onClick={run} disabled={loading}>{loading? 'Running…' : 'Run'}</button>
      {result && (
        <div className="text-sm text-gray-700 space-y-1">
          <div>prob: {isNaN(result.probability)? '—' : (result.probability*100).toFixed(1)+'%'}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">cohort</span>
            <button
              className="text-xs border rounded-full px-2 py-0.5 bg-white hover:bg-gray-50"
              onClick={()=> result.cohortKey && copy(result.cohortKey)}
              disabled={!result.cohortKey}
            >{result.cohortKey || '—'}</button>
          </div>
          {result.modelVersion && (
            <div className="text-xs text-gray-500">model: {result.modelVersion}</div>
          )}
        </div>
      )}
    </div>
  )
}


