'use client'

import useSWR from 'swr'
import { useMemo, useState } from 'react'

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r=> r.json())

export function DagMiniMap() {
  const { data } = useSWR('/api/admin/pipeline/dag', fetcher, { refreshInterval: 30000 })
  const [hoverId, setHoverId] = useState<string | null>(null)
  const nodes = data?.nodes || []
  const edges = data?.edges || []
  const layout = useMemo(()=>{
    // Simple circular layout
    const r = 120
    const cx = 160, cy = 120
    return nodes.map((n: any, i: number) => {
      const a = (i / Math.max(nodes.length,1)) * Math.PI * 2
      return { id: n.id, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), label: n.label || n.id }
    })
  }, [nodes])
  const posById = useMemo(()=> Object.fromEntries(layout.map(n=> [n.id, n])), [layout])

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-4" data-testid="dag-canvas">
      <svg width={320} height={240} className="w-full h-[240px]">
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#71717a" />
          </marker>
        </defs>
        {edges.map((e:any)=>{
          const a = posById[e.upstream_node_id]
          const b = posById[e.downstream_node_id]
          if (!a || !b) return null
          const active = hoverId && (e.upstream_node_id===hoverId || e.downstream_node_id===hoverId)
          return (
            <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={active? '#e5e7eb' : '#71717a'} strokeWidth={active? 2.5: 1.5} markerEnd="url(#arrow)" />
          )
        })}
        {layout.map(n=> (
          <g key={n.id} onMouseEnter={()=> setHoverId(n.id)} onMouseLeave={()=> setHoverId(null)}>
            <circle cx={n.x} cy={n.y} r={14} fill={hoverId===n.id? '#22c55e' : '#3f3f46'} />
            <text x={n.x} y={n.y-18} textAnchor="middle" className="fill-zinc-300 text-[10px]">{n.label}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}



