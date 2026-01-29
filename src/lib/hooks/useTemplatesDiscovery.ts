import useSWR from 'swr'
import { useMemo } from 'react'

export interface TemplateListItem {
  id: string
  name: string
  status: 'hot' | 'cooling' | 'new' | 'stable'
  sr: number
  uses: number
  examples: number
  entity?: { sound?: string; hashtags?: string[] }
  last_seen_at?: string
  trend?: number[]
  safety?: { nsfw?: number; copyright?: number }
  uplift_pct?: number
  support?: number
}

const fetcher = (url: string) => fetch(url).then(r=> {
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
})

export function useTemplatesDiscovery(params: { range: '7d'|'30d'|'90d'; platform?: string; niche?: string; sort?: string }) {
  const { range, platform, niche, sort } = params
  const qs = new URLSearchParams({ range })
  if (platform) qs.set('platform', platform)
  if (niche) qs.set('niche', niche)
  if (sort) qs.set('sort', sort)
  const { data, error, isLoading, mutate } = useSWR<TemplateListItem[]>(`/api/templates?${qs.toString()}`, fetcher, { refreshInterval: 20000 })
  const byState = useMemo(()=>{
    const items = Array.isArray(data)? data : []
    const as = (s: string) => items.filter(t=> (t.status||'').toLowerCase()===s)
    return { hot: as('hot'), cooling: as('cooling'), newly: as('new') }
  }, [JSON.stringify(data)])
  return { list: data||[], ...byState, error, isLoading, refresh: mutate }
}


