"use client";
import React, { useEffect, useState } from 'react'

export default function CoachPanel({ predictionId, baseScore }: { predictionId: string; baseScore: number }) {
  const [edits, setEdits] = useState<any>(null)
  const [variants, setVariants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [simulate, setSimulate] = useState<{ old: number; next: number } | null>(null)

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const [e, v] = await Promise.all([
          fetch('/api/coach/suggest_edits', { method: 'POST', body: JSON.stringify({ tokens_matched: [], video_features: {} }) }).then(r=>r.json()),
          fetch('/api/coach/generate_variants', { method: 'POST', body: JSON.stringify({ base_score: baseScore }) }).then(r=>r.json())
        ])
        setEdits(e)
        setVariants(Array.isArray(v?.variants) ? v.variants : [])
      } finally { setLoading(false) }
    })()
  }, [baseScore])

  async function onSimulate() {
    try {
      const res = await fetch('/api/simulate/edits', { method: 'POST', body: JSON.stringify({ tokens_add: edits?.add_tokens||[], tokens_remove: edits?.remove_tokens||[], base_score: baseScore }) })
      const j = await res.json()
      setSimulate({ old: baseScore, next: Math.round(j?.new_score || baseScore) })
    } catch {}
  }

  async function onApply(variantId?: string) {
    await fetch('/api/coach/apply', { method: 'POST', body: JSON.stringify({ prediction_id: predictionId, tokens_add: edits?.add_tokens||[], tokens_remove: edits?.remove_tokens||[], variant_id: variantId||null, predicted_delta: variants?.[0]?.predicted_delta_score||0 }) })
  }

  return (
    <div>
      {loading && <div className="text-sm text-gray-500">Loading coach suggestions…</div>}
      {!loading && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Top edit suggestions</h4>
            <ul className="list-disc pl-5 text-sm">
              {(edits?.add_tokens||[]).slice(0,3).map((t:string)=> (<li key={`add-${t}`}>Add: {t}</li>))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Variants</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {variants.slice(0,5).map(v=> (
                <div key={v.id} className="border rounded p-2 text-sm flex items-center justify-between">
                  <div>
                    <div className="font-mono">{v.id}</div>
                    <div>Δ score: <span className="font-semibold">{v.predicted_delta_score}</span></div>
                  </div>
                  <button className="px-2 py-1 text-xs border rounded" onClick={()=>onApply(v.id)}>Apply</button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 border rounded" onClick={onSimulate}>Simulate</button>
            {simulate && (
              <div className="text-sm text-gray-600">old: {simulate.old} → new: <span className="font-semibold">{simulate.next}</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


