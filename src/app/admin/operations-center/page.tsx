"use client";

import { useState } from 'react'
import { KpiRibbon } from './components/KpiRibbon'
import { AlertsStrip } from './components/AlertsStrip'
import { DagMiniMap } from './components/DagMiniMap'
import { ModuleGrid } from './components/ModuleGrid'
import { ModuleSlideOver } from './components/ModuleSlideOver'
import { TimeseriesCharts } from './components/TimeseriesCharts'
import { BacklogCard, DataHealthCard, QualitySafety, ChangeLogCard, ExportsApiCard, DiscoveryCard } from './components/Cards'
import { ControlsBar } from './components/ControlsBar'

const RANGES = ['1h','6h','24h','7d'] as const

type Range = typeof RANGES[number]

export default function OperationsCenterPage() {
  const [range, setRange] = useState<Range>('24h')
  const [openId, setOpenId] = useState<string | null>(null)
  // Guard default view=pipeline via client-side redirect parameters are optional; UI already assumes pipeline view

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#000_0%,#0a0a0a_100%)] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/60 backdrop-blur supports-[backdrop-filter]:bg-black/40">
        <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between">
          <div className="text-lg font-semibold">
            <nav className="text-xs text-zinc-400">
              <span className="hover:underline" onClick={()=> (window.location.href = '/admin/engine-room')}>Engine Room</span>
              <span className="mx-1">›</span>
              <span className="text-white">Operations Center</span>
            </nav>
          </div>
          <div className="flex items-center gap-2" aria-label="Time range">
            {RANGES.map(r => (
              <button key={r} onClick={()=> setRange(r)} className={`px-3 py-1.5 rounded-md text-xs border ${r===range ? 'border-white/30 bg-white/10' : 'border-white/10 hover:border-white/20'}`}>{r}</button>
            ))}
            <span className="ml-3 text-xs rounded-full px-2 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">Online</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-4 space-y-4">
        {/* KPI Ribbon */}
        <KpiRibbon range={range} />

        {/* Alerts */}
        <AlertsStrip />

        {/* DAG */}
        <DagMiniMap />

        {/* Module Grid */}
        <ModuleGrid onOpen={setOpenId} />

        {/* Timeseries Charts */}
        <TimeseriesCharts range={range} />

        {/* Backlog & Schedule + Data Health */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BacklogCard range={range} />
          <DataHealthCard />
          <DiscoveryCard />
        </div>

        {/* Quality & Safety */}
        <QualitySafety />

        {/* Change Log / Audit */}
        <ChangeLogCard />

        {/* Exports & API */}
        <ExportsApiCard />
      </main>

      {/* Controls Bar */}
      <ControlsBar />

      {/* SlideOver */}
      <ModuleSlideOver id={openId} onClose={()=> setOpenId(null)} />
    </div>
  )
}
