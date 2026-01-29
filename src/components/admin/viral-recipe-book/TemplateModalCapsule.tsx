"use client"

import React, { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MorphingDialog, MorphingDialogContainer, MorphingDialogContent, MorphingDialogTrigger, MorphingDialogClose } from '@/components/ui/morphing-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { X, Play, Pause } from 'lucide-react'
import { useTemplateCapsuleStore } from '@/lib/state/templateCapsuleStore'

type TabKey = 'template' | 'quickwin' | 'analysis' | 'predict' | 'optimize' | 'validate' | 'ab' | 'schedule'

export interface TemplateCapsuleProps {
  templateId: string
  title: string
  srPct?: number
  statusLabel?: string
  onClose?: () => void
  // layer-3 renderers (lazy)
  RenderTemplate?: React.ComponentType<{ templateId: string }>
  RenderQuickWin?: React.ComponentType<{ templateId: string }>
  RenderAnalysis?: React.ComponentType<{ templateId: string }>
  RenderPredict?: React.ComponentType<{ templateId: string }>
  RenderOptimize?: React.ComponentType<{ templateId: string }>
  RenderValidate?: React.ComponentType<{ templateId: string }>
  RenderAB?: React.ComponentType<{ templateId: string }>
  RenderSchedule?: React.ComponentType<{ templateId: string }>
  // slot for the card content used as the trigger
  trigger: React.ReactNode
}

export function TemplateModalCapsule(props: TemplateCapsuleProps) {
  const {
    templateId,
    title,
    srPct,
    statusLabel,
    onClose,
    RenderTemplate,
    RenderQuickWin,
    RenderAnalysis,
    RenderPredict,
    RenderOptimize,
    RenderValidate,
    RenderAB,
    RenderSchedule,
    trigger
  } = props

  const { templateIdToTab, setActiveTab, templateIdToVideoMode, setVideoMode } = useTemplateCapsuleStore()
  const active = (templateIdToTab[templateId] as TabKey) || 'template'
  const mode = templateIdToVideoMode[templateId] || 'analysis'
  const setActive = (t: TabKey) => setActiveTab(templateId, t)
  const toggleVideoMode = () => setVideoMode(templateId, mode === 'analysis' ? 'playback' : 'analysis')

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'template', label: 'Template' },
    { key: 'quickwin', label: 'Quick Win' },
    { key: 'analysis', label: 'Analysis' },
    { key: 'predict', label: 'Predict' },
    { key: 'optimize', label: 'Optimize' },
    { key: 'validate', label: 'Validate' },
    { key: 'ab', label: 'A/B Test' },
    { key: 'schedule', label: 'Schedule' },
  ]

  const header = (
    <div className="flex items-center justify-between p-3 border-b border-white/10">
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-white font-semibold truncate">{title}</div>
        <div className="text-xs text-zinc-300 whitespace-nowrap">SR {typeof srPct==='number'? `${srPct}%`:'—'}</div>
        {statusLabel ? <div className="text-[10px] px-2 py-0.5 rounded-full border border-white/20 text-zinc-300">{statusLabel}</div> : null}
      </div>
      <MorphingDialogClose className="shrink-0 p-2 rounded hover:bg-white/10" variants={{}}>
        <X className="h-4 w-4 text-white" />
      </MorphingDialogClose>
    </div>
  )

  const sharedBar = (
    <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 text-xs text-zinc-300">
      <div className="flex items-center gap-3">
        <span>Audit: —</span>
        <span>Updated: just now</span>
        <span>Progress: —</span>
      </div>
      <button className="px-2 py-1 rounded border border-white/20 hover:bg-white/10" onClick={toggleVideoMode}>
        {mode==='analysis' ? (<span className="inline-flex items-center gap-1"><Play className="h-3 w-3"/>Playback</span>) : (<span className="inline-flex items-center gap-1"><Pause className="h-3 w-3"/>Analysis</span>)}
      </button>
    </div>
  )

  const contentFor = (k: TabKey) => {
    switch(k){
      case 'template': return RenderTemplate ? <RenderTemplate templateId={templateId} /> : <div className="p-4 text-sm text-zinc-300">Template overview</div>
      case 'quickwin': return RenderQuickWin ? <RenderQuickWin templateId={templateId} /> : <div className="p-4 text-sm text-zinc-300">Quick Win</div>
      case 'analysis': return RenderAnalysis ? <RenderAnalysis templateId={templateId} /> : <div className="p-4 text-sm text-zinc-300">Analysis</div>
      case 'predict': return RenderPredict ? <RenderPredict templateId={templateId} /> : <div className="p-4 text-sm text-zinc-300">Predict</div>
      case 'optimize': return RenderOptimize ? <RenderOptimize templateId={templateId} /> : <div className="p-4 text-sm text-zinc-300">Optimize</div>
      case 'validate': return RenderValidate ? <RenderValidate templateId={templateId} /> : <div className="p-4 text-sm text-zinc-300">Validate</div>
      case 'ab': return RenderAB ? <RenderAB templateId={templateId} /> : <div className="p-4 text-sm text-zinc-300">A/B Test</div>
      case 'schedule': return RenderSchedule ? <RenderSchedule templateId={templateId} /> : <div className="p-4 text-sm text-zinc-300">Schedule</div>
    }
  }

  return (
    <MorphingDialog>
      <MorphingDialogTrigger>
        <div>
          {trigger}
        </div>
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent className="relative rounded-2xl overflow-hidden bg-zinc-950/95 border border-white/10 shadow-2xl w-[900px] max-w-[92vw] h-[80vh] text-white">
          {/* Layer 1: Header */}
          {header}

          {/* Layer 2: Video + Tabs */}
          <div className="p-3">
            <div className="relative h-48 mb-3 rounded-lg overflow-hidden bg-gradient-to-tr from-fuchsia-500/20 via-purple-500/10 to-indigo-500/10 border border-white/10">
              <button className="absolute inset-0" onClick={toggleVideoMode} aria-label="Toggle video mode" />
              <div className="absolute left-3 bottom-3 text-xs px-2 py-1 rounded bg-black/40 border border-white/10">Mode: {mode}</div>
            </div>
            <Tabs value={active} onValueChange={(v)=> setActive(v as TabKey)}>
              <TabsList className="grid w-full grid-cols-8 bg-white/5 border border-white/10">
                {tabs.map(t => (
                  <TabsTrigger key={t.key} value={t.key} className="text-xs">
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="border border-white/10 rounded-b-lg border-t-0 bg-white/[0.02] min-h-[320px]">
                <TabsContent value={active} className="m-0">
                  {/* Layer 3: Dynamic Content */}
                  {contentFor(active)}
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Shared context bar */}
          <div className="absolute top-[40px] left-0 right-0">{sharedBar}</div>
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  )
}


