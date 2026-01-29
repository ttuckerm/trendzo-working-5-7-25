'use client'

import React, { useEffect, useMemo, useState } from 'react'

type FeedItem = {
  id: string
  platform: string
  creatorId: string
  caption?: string
  niche?: string
  publishTs: string
  views48h: number
  viral: boolean
  templateState: string | null
}

export function ViralFeed({ platform, niche, limit = 30 }: { platform?: string; niche?: string; limit?: number }) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string>('')

  const qs = useMemo(() => {
    const u = new URLSearchParams()
    u.set('limit', String(limit))
    if (platform) u.set('platform', platform)
    if (niche) u.set('niche', niche)
    return u.toString()
  }, [platform, niche, limit])

  async function load(reset = false) {
    setLoading(true)
    setErr('')
    try {
      const params = new URLSearchParams(qs)
      if (!reset && cursor) params.set('cursor', cursor)
      const res = await fetch(`/api/videos?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('failed to load')
      const j = await res.json()
      setItems((old) => (reset ? j.items : [...old, ...j.items]))
      setCursor(j.nextCursor)
    } catch (e:any) {
      setErr(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(true) }, [qs])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Trending Videos</h3>
        <div className="text-xs text-gray-500">{platform || 'all'} • {niche || 'all'}</div>
      </div>
      {err && <div className="text-xs text-red-400">{err}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.id} className="p-3 border rounded relative">
            {it.viral && (
              <div title="This video is outperforming almost all videos from creators like you on this platform and is taking off fast." className="absolute top-2 left-2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                Viral • Beating 95% of similar videos
              </div>
            )}
            <div className="text-xs text-gray-500">{it.platform} • {it.niche || '-'}</div>
            <div className="text-sm font-medium line-clamp-2">{it.caption || '—'}</div>
            <div className="text-xs text-gray-500">{new Date(it.publishTs).toLocaleString()}</div>
            <div className="text-xs">48h views: <span className="font-mono">{it.views48h.toLocaleString()}</span></div>
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        {cursor ? (
          <button disabled={loading} onClick={() => load()} className="px-3 py-1 text-xs rounded border">
            {loading ? 'Loading…' : 'Load more'}
          </button>
        ) : (
          <span className="text-xs text-gray-500">End of list</span>
        )}
      </div>
    </div>
  )
}


