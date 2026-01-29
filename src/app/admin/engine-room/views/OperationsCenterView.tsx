"use client";

import { useEffect, useState } from 'react'
import { KpiRibbon } from '@/app/admin/operations-center/components/KpiRibbon'
import { AlertsStrip } from '@/app/admin/operations-center/components/AlertsStrip'
import { DagMiniMap } from '@/app/admin/operations-center/components/DagMiniMap'
import { ModuleGrid } from '@/app/admin/operations-center/components/ModuleGrid'
import { ModuleSlideOver } from '@/app/admin/operations-center/components/ModuleSlideOver'
import { TimeseriesCharts } from '@/app/admin/operations-center/components/TimeseriesCharts'
import { BacklogCard, DataHealthCard, QualitySafety, ChangeLogCard, ExportsApiCard } from '@/app/admin/operations-center/components/Cards'
import { ControlsBar } from '@/app/admin/operations-center/components/ControlsBar'
import { ReadinessBanner } from '@/app/admin/operations-center/components/ReadinessBanner'

const RANGES = ['1h','6h','24h','7d'] as const
type Range = typeof RANGES[number]

export default function OperationsCenterView() {
  const [range, setRange] = useState<Range>('24h')
  const [openId, setOpenId] = useState<string | null>(null)
  const [showOnlyFailing, setShowOnlyFailing] = useState<boolean>(false)

  // Remember chip selection
  useEffect(()=>{
    const saved = (typeof window !== 'undefined') ? (window.localStorage.getItem('opsTimeRange') as Range|null) : null
    if (saved && (RANGES as readonly string[]).includes(saved)) setRange(saved as Range)
  }, [])
  useEffect(()=>{
    try { window.localStorage.setItem('opsTimeRange', range) } catch {}
  }, [range])

  // Preserve scroll between tab switches
  useEffect(()=>{
    const y = Number(window.sessionStorage.getItem('opsScrollY') || '0')
    if (y) window.scrollTo({ top: y })
    const onScroll = () => { window.sessionStorage.setItem('opsScrollY', String(window.scrollY)) }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-lg font-semibold">Operations Center — 24/7 Pipeline</h2>
      {/* Time-range chips inside the view for consistency */}
      <div className="flex items-center gap-2" aria-label="Time range">
        {RANGES.map(r => (
          <button key={r} onClick={()=> setRange(r)} className={`px-3 py-1.5 rounded-md text-xs border ${r===range ? 'border-white/30 bg-white/10' : 'border-white/10 hover:border-white/20'}`}>{r}</button>
        ))}
      </div>

      <KpiRibbon range={range} />
      <ReadinessBanner onFilterFailing={()=> setShowOnlyFailing(true)} />
      <AlertsStrip />
      <DagMiniMap />
      <div className="text-sm font-semibold mb-2">Module Status Monitor</div>
      <ModuleGrid onOpen={setOpenId} />
      <TimeseriesCharts range={range} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BacklogCard range={range} />
        <DataHealthCard />
      </div>
      <QualitySafety />
      <ChangeLogCard />
      <ExportsApiCard />

      {/* Fixed controls bar lives at the page bottom */}
      <ControlsBar />

      <ModuleSlideOver id={openId} onClose={()=> setOpenId(null)} />
    </div>
  )
}



