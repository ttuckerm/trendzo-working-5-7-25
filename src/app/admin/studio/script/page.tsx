'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { isStarterPackEnabled } from '@/config/flags'
import { getStarterParam, applyStarterParam } from '@/workflow/url'
import { save as persistSave, load as persistLoad } from '@/workflow/persist'
import { useWorkflowStore } from '@/workflow/workflowStore'
import { listPatterns } from '@/lib/script/patterns'
import { exportSRT } from '@/app/sandbox/workflow/_services/exports'

type DraftDoc = { id: string; title: string; body: string; hooks: string[]; cta: string; beats: string[]; shots: string[]; version: number; savedAtISO: string }

function nowIso(){ return new Date().toISOString() }

export default function ScriptPage(){
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { toast } = useToast()

  const starterOn = getStarterParam(params?.toString() || '')
  const { starterEnabled, templateId, saveScript, selectTemplate, enableStarter } = useWorkflowStore()

  // Reconcile starter state from URL
  useEffect(() => {
    if (isStarterPackEnabled() && starterOn) enableStarter(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starterOn])

  // Guard: require templateId when Starter flow is on
  useEffect(() => {
    if (!isStarterPackEnabled() || !starterOn) return
    if (!templateId) {
      toast({ description: 'Select a Starter Pack template', variant: 'default' })
      router.replace('/admin/viral-recipe-book?starter=on')
    }
  }, [templateId, starterOn, router, toast])

  // Prefill from patterns (production library) — choose three hook variants and baseline beats/cta
  const initialDoc: DraftDoc | null = useMemo(() => {
    if (!starterOn) return null
    const patterns = listPatterns()
    const hooks: string[] = []
    for (const p of patterns) {
      for (const h of p.hookTemplates) {
        if (hooks.length < 3) hooks.push(h)
        else break
      }
      if (hooks.length >= 3) break
    }
    const beats = ['Hook', 'Build', 'Payoff', 'CTA']
    const shots = ['Opener', 'Demo/Proof', 'Payoff', 'CTA Close']
    const body = [
      `Hook: ${hooks[0] || ''}`,
      'Build: Here are the steps…',
      'Payoff: Why this works…',
      'CTA: Follow for more / Link in bio'
    ].join('\n')
    return { id: String(templateId || ''), title: 'Starter Draft', body, hooks, cta: 'Follow for more', beats, shots, version: 1, savedAtISO: nowIso() }
  }, [starterOn, templateId])

  const [doc, setDoc] = useState<DraftDoc | null>(null)
  const [openTele, setOpenTele] = useState(false)
  const saveTimer = useRef<any>(null)
  const SAVED_KEY = 'script'

  // Load existing draft or prefill
  useEffect(() => {
    if (!starterOn) return
    const prior = persistLoad<DraftDoc | null>(SAVED_KEY, null)
    if (prior && prior.id === templateId) {
      setDoc(prior)
      saveScript({ id: prior.id, title: prior.title, content: prior.body })
    } else if (initialDoc) {
      setDoc(initialDoc)
      saveScript({ id: initialDoc.id, title: initialDoc.title, content: initialDoc.body })
      persistSave(SAVED_KEY, initialDoc)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starterOn, templateId, initialDoc])

  // Debounced autosave
  const scheduleSave = (next: DraftDoc) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const withMeta = { ...next, version: (next.version || 0) + 1, savedAtISO: nowIso() }
      setDoc(withMeta)
      saveScript({ id: withMeta.id, title: withMeta.title, content: withMeta.body })
      persistSave(SAVED_KEY, withMeta)
    }, 700)
  }

  const onExportSRT = () => {
    const lines = (doc?.body || '').split(/\n+/).filter(Boolean)
    const srt = lines.map((text, i) => ({ start: i * 3, end: i * 3 + 3, text }))
    exportSRT(srt)
  }

  const goAnalyze = () => {
    if (!doc || !doc.body.trim()) {
      toast({ description: 'Add content before analyzing.' })
      return
    }
    window.dispatchEvent(new CustomEvent('starter_pack.script_saved'))
    const nextUrl = applyStarterParam('/admin/studio/analysis', true)
    router.push(nextUrl)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">Script Intelligence</h1>
            {starterOn && (
              <div className="text-sm text-zinc-300 mt-2" data-testid="starter-progress">Starter Pack • Step 1 of 4</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setOpenTele(true)}>Teleprompter</Button>
            <Button variant="outline" onClick={onExportSRT}>Export SRT</Button>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600" onClick={goAnalyze}>Save draft & Analyze</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Beats & Draft</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {doc?.beats.map((b, i) => (
                    <Badge key={i}>{b}</Badge>
                  ))}
                </div>
                <textarea
                  className="w-full h-64 rounded bg-white/5 border border-white/10 p-3 focus:outline-none"
                  value={doc?.body || ''}
                  onChange={(e) => { const next = { ...(doc as DraftDoc), body: e.target.value }; scheduleSave(next) }}
                />
                <div className="text-xs text-zinc-400">Saved • {doc?.savedAtISO ? new Date(doc.savedAtISO).toLocaleTimeString() : '—'}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shot List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {doc?.shots.map((s, i) => (
                    <Badge key={i} variant="outline">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hooks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(doc?.hooks || []).map((h, i) => (
                  <div key={i} className="p-2 rounded border border-white/10 text-sm">{h}</div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CTA</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  className="w-full rounded bg-white/5 border border-white/10 p-2 focus:outline-none text-sm"
                  value={doc?.cta || ''}
                  onChange={(e) => { const next = { ...(doc as DraftDoc), cta: e.target.value }; scheduleSave(next) }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={openTele} onOpenChange={setOpenTele}>
        <DialogContent className="max-w-3xl">
          <div className="max-h-[70vh] overflow-auto p-4 text-lg leading-7">
            {(doc?.body || '').split(/\n+/).map((line, idx) => (
              <div key={idx} className="py-1">{line}</div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}



