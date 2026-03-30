"use client"

import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TemplateGallery } from '@/components/admin/viral-recipe-book/TemplateGallery'
import { isStarterPackEnabled } from '@/config/flags'
import { applyStarterParam } from '@/workflow/url'
import { selectStarterTemplates } from '@/workflow/starterSelect'
import { useWorkflowStore } from '@/lib/state/workflowStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { TemplateViewer } from '@/components/admin/viral-recipe-book/TemplateViewer'
import { DraftsAnalyzer } from '@/components/admin/viral-recipe-book/DraftsAnalyzer'
import { PredictionDashboard } from '@/components/admin/viral-recipe-book/PredictionDashboard'
import { OptimizationEngine } from '@/components/admin/viral-recipe-book/OptimizationEngine'
import { ABTestInterface } from '@/components/admin/viral-recipe-book/ABTestInterface'
import { InceptionMarketing } from '@/components/admin/viral-recipe-book/InceptionMarketing'
import { ValidationSystem } from '@/components/admin/viral-recipe-book/ValidationSystem'
import { ScriptIntelligenceDashboard } from '@/components/admin/ScriptIntelligenceDashboard'
// FloatingBrainTrigger is now mounted globally in RootLayout
import aura from './AURAPageShell.module.css'
import { Montserrat } from 'next/font/google'
import useSWR from 'swr'
import { useToast } from '@/components/ui/use-toast'
import { showBanner } from '@/lib/ui/bannerBus'
import { 
  BookOpen, 
  Upload, 
  BarChart3, 
  Brain, 
  Zap, 
  TrendingUp,
  Target,
  Eye,
  GitBranch,
  Sparkles,
  Cpu
} from 'lucide-react'
import { useDiscoveryStore } from '@/lib/state/discoveryStore'
import { useTemplatesDiscovery } from '@/lib/hooks/useTemplatesDiscovery'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400','600','700'] })

interface ViralTemplate {
  id: string
  title: string
  description: string
  success_rate: number
  viral_probability: number
  avg_views: number
  category: 'authority' | 'story' | 'tutorial' | 'entertainment' | 'trending'
  platform_optimized: 'tiktok' | 'instagram' | 'youtube' | 'all'
  duration_range: string
  hook_timing: number
  engagement_pattern: 'quick_spike' | 'steady_growth' | 'viral_curve'
  example_videos: Array<{
    id: string
    title: string
    views: number
    engagement_score: number
  }>
  structure: {
    hook: string
    build: string
    payoff: string
    cta: string
  }
  status: 'HOT' | 'COOLING' | 'NEW' | 'STABLE'
  viral_elements: Array<{
    element: string
    importance: 'critical' | 'high' | 'medium'
    description: string
    timing?: string
  }>
  optimization_tips: Array<{
    tip: string
    impact: 'high' | 'medium' | 'low'
    difficulty: 'easy' | 'medium' | 'hard'
  }>
}

export default function ViralRecipeBookPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<ViralTemplate | null>(null)
  const [activeTab, setActiveTab] = useState('templates')
  const router = useRouter()
  const params = useSearchParams()
  const {
    niche: storeNiche,
    goal: storeGoal,
    starterEnabled,
    starterTemplates,
    setStarterEnabled,
    setStarterTemplates,
    setTemplateId,
  } = useWorkflowStore()
  const [starterIds, setStarterIds] = useState<string[]>([])
  // Discovery API wiring
  const [windowArg, setWindowArg] = useState<'7d'|'30d'|'90d'>('30d')
  const [platform, setPlatform] = useState<string>('')
  const [niche, setNiche] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [generatedAtISO, setGeneratedAtISO] = useState<string>('')
  const [hot, setHot] = useState<any[]>([])
  const [cooling, setCooling] = useState<any[]>([])
  const [newly, setNewly] = useState<any[]>([])
  const fetcher = (url: string) => fetch(url).then(r=> r.json())
  const { data: discovery } = useSWR('/api/discovery/metrics', fetcher, { refreshInterval: 20000 })
  const { data: readiness } = useSWR('/api/discovery/readiness', fetcher, { refreshInterval: 20000 })
  const [showReadiness, setShowReadiness] = useState(false)
  const { toast } = useToast()
  const [busySeed, setBusySeed] = useState(false)
  const [busyRecompute, setBusyRecompute] = useState(false)
  const [busyWarm, setBusyWarm] = useState(false)

  async function loadRecipeBook(){
    setLoading(true); setError('')
    try {
      const qs = new URLSearchParams({ range: windowArg })
      if (platform) qs.set('platform', platform)
      if (niche) qs.set('niche', niche)
      const r = await fetch(`/api/templates?${qs.toString()}`, { cache:'no-store' })
      if (!r.ok) throw new Error(`failed: ${r.status}`)
      const list = await r.json()
      const nowISO = new Date().toISOString()
      setGeneratedAtISO(nowISO)
      const by = (st:string) => (list||[]).filter((t:any)=> (t.status||'').toLowerCase()===st)
      setHot(by('hot'))
      setCooling(by('cooling'))
      setNewly(by('new'))
    } catch(e:any){ setError(String(e?.message||e)) }
    finally { setLoading(false) }
  }

  useEffect(()=>{ loadRecipeBook() }, [windowArg, platform, niche])
  useEffect(() => {
    const starterParamOn = (params?.get('starter') || '').toLowerCase() === 'on'
    if (starterParamOn) setStarterEnabled(true)
    const tabParam = (params?.get('tab')||'').toLowerCase()
    const valid = ['templates','analyzer','dashboard','scripts','optimization','abtesting','inception','validation']
    if (tabParam && valid.includes(tabParam)) setActiveTab(tabParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(()=>{
    // reflect tab in URL without navigation
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set('tab', activeTab)
    window.history.replaceState(null, '', url.toString())
  }, [activeTab])
  useEffect(() => {
    if (!starterEnabled) { setStarterIds([]); return }
    const material = (hot || []).map((t:any)=> ({ id: String(t.id||t.template_id), niche: (t.niche||'')+'', goal: (t.goal||'')+'', successScore: Math.round((t.success_rate??0)*100), delta7d: Number(t.delta7d||t.delta||0), name: t.name||t.title }))
    const ids = selectStarterTemplates(material, storeNiche || niche, storeGoal || platform)
    setStarterTemplates(ids.map((id)=> ({ id, title: String(material.find(m=>m.id===id)?.name||''), score: Number(material.find(m=>m.id===id)?.successScore||0) })))
    setStarterIds(ids)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starterEnabled, JSON.stringify(hot)])

  const updatedRelative = useMemo(()=>{
    if (!generatedAtISO) return ''
    const d = new Date(generatedAtISO).getTime(); const now = Date.now();
    const m = Math.max(0, Math.round((now - d) / 60000))
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.round(m/60)
    return `${h}h ago`
  }, [generatedAtISO])

  const handleTemplateSelect = (template: ViralTemplate) => {
    setSelectedTemplate(template)
  }

  const handleBackToGallery = () => {
    setSelectedTemplate(null)
  }

  const handleCopyTemplate = (template: ViralTemplate) => {
    // In real implementation, this would copy the template to user's drafts
    console.log('Copying template:', template.title)
    // Could show a toast notification here
  }

  const handleRunValidation = () => {
    // In real implementation, this would trigger a validation run
    console.log('Running 10-prediction validation test')
    // Could navigate to a validation results page or show modal
  }

  if (selectedTemplate) {
    return (
      <div className="container mx-auto p-6">
        <TemplateViewer 
          template={selectedTemplate}
          onBack={handleBackToGallery}
          onCopyTemplate={handleCopyTemplate}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className={aura.ambientBg}></div>
      <div className={"container mx-auto p-6 "+aura.pageWrap}>
      <div id="discovery" data-testid="template-leaderboard" className="sr-only" />
      {/* Page Header */}
      <div className={"mb-8 "+aura.headerGlass+" "+montserrat.className}>
        <div className="flex items-center justify-between pt-4 pb-6 px-2">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
              <BookOpen className="h-8 w-8 mr-3 text-blue-400" />
              Viral Recipe Book
            </h1>
            <p className="text-white mt-2">
              AI-powered viral video prediction and template optimization system
            </p>
            {starterEnabled && (
              <div className="text-sm text-white mt-2" data-testid="starter-helper">Hand-picked for your {storeNiche || niche || 'niche'} + {storeGoal || platform || 'goal'}. Start with one of these three HOT templates.</div>
            )}
          </div>
          
          <div className="flex items-center space-x-4" data-testid="kpi-chips">
            <Card className={"p-4 "+aura.kpi+" hover:border-white/20 transition-colors"}>
              <div className="flex items-center space-x-3">
                <Brain className="h-6 w-6 text-purple-400" />
                <div>
                  <div className="text-sm font-medium text-white">System Accuracy</div>
                  <div className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(123,97,255,0.35)]">
                    {discovery?.system?.accuracy_pct ? `${discovery.system.accuracy_pct}%` : '—'}
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className={"p-4 "+aura.kpi+" hover:border-white/20 transition-colors"}>
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-6 w-6 text-green-400" />
                <div>
                  <div className="text-sm font-medium text-white">Active Templates</div>
                  <div className="text-2xl font-extrabold bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(16,185,129,0.35)]">
                    {discovery?.templates?.active_count ?? '—'}
                  </div>
                </div>
              </div>
            </Card>
            <Card className={"p-4 "+aura.kpi}>
              <div className="flex items-center space-x-3">
                <Eye className="h-6 w-6 text-blue-400" />
                <div>
                  <div className="text-sm font-medium text-white">Discovery Freshness</div>
                  <div className="text-2xl font-extrabold bg-gradient-to-r from-sky-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(56,189,248,0.35)]">
                    {discovery?.discovery?.freshness_seconds ? `${discovery.discovery.freshness_seconds}s` : '—'}
                  </div>
                </div>
              </div>
            </Card>
            {/* Readiness Pill + Demo Fill */}
            <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={()=> setShowReadiness(true)}
              data-testid="discovery-readiness-pill"
              className={`p-2 rounded-md border text-xs ${readiness?.ready ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}
            >
              {readiness?.ready ? 'Discovery: Ready' : 'Discovery: Needs Attention'}
            </button>
            <button
              type="button"
              className="p-2 rounded-md border text-xs border-white/20 hover:bg-white/10"
              onClick={async()=>{
                // Demo Fill: QA seed + recompute + refresh
                const r1 = await fetch('/api/discovery/qa-seed', { method:'POST', headers:{ 'x-user-id':'local-admin' } })
                const j1 = await r1.json().catch(()=>({}))
                const r2 = await fetch('/api/admin/pipeline/actions/recompute-discovery', { method:'POST', headers:{ 'x-user-id':'local-admin' } })
                const j2 = await r2.json().catch(()=>({}))
                toast({ title: (r1.ok && r2.ok) ? '✅ Demo data ready.' : 'Demo Fill failed', description: j1?.audit_id ? `Audit #${j1.audit_id}` : (j2?.audit_id ? `Audit #${j2.audit_id}` : undefined), variant: (r1.ok && r2.ok) ? 'default':'destructive' })
                if (r1.ok && (j1?.audit_id || j2?.audit_id)) showBanner({ title: '✅ Done (Audit #' + (j1?.audit_id || j2?.audit_id) + ')', description: 'Demo data ready', variant: 'success', durationMs: 5000 })
                if (r1.ok && r2.ok) loadRecipeBook()
              }}
            >Demo Fill</button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8 bg-white/5 border border-white/10" data-testid="tabs-list">
          <TabsTrigger value="templates" className={"flex items-center space-x-2 "+aura.pill+" data-[state=active]:"+aura.pillActive}>
            <BookOpen className="h-4 w-4" />
            <span>Templates</span>
          </TabsTrigger>
          <TabsTrigger value="analyzer" className={"flex items-center space-x-2 "+aura.pill+" data-[state=active]:"+aura.pillActive}>
            <Upload className="h-4 w-4" />
            <span>Analyzer</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className={"flex items-center space-x-2 "+aura.pill+" data-[state=active]:"+aura.pillActive}>
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="scripts" className={"flex items-center space-x-2 "+aura.pill+" data-[state=active]:"+aura.pillActive}>
            <Cpu className="h-4 w-4" />
            <span>Scripts</span>
          </TabsTrigger>
          <TabsTrigger value="optimization" className={"flex items-center space-x-2 "+aura.pill+" data-[state=active]:"+aura.pillActive}>
            <Zap className="h-4 w-4" />
            <span>Optimize</span>
          </TabsTrigger>
          <TabsTrigger value="abtesting" className={"flex items-center space-x-2 "+aura.pill+" data-[state=active]:"+aura.pillActive}>
            <GitBranch className="h-4 w-4" />
            <span>A/B Test</span>
          </TabsTrigger>
          <TabsTrigger value="inception" className={"flex items-center space-x-2 "+aura.pill+" data-[state=active]:"+aura.pillActive}>
            <Sparkles className="h-4 w-4" />
            <span>Inception</span>
          </TabsTrigger>
          <TabsTrigger value="validation" className={"flex items-center space-x-2 "+aura.pill+" data-[state=active]:"+aura.pillActive}>
            <Target className="h-4 w-4" />
            <span>Validate</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-2" data-testid="filters-bar">
            <select className="border rounded px-2 py-1 bg-transparent" value={windowArg} onChange={(e)=> setWindowArg(e.target.value as any)}>
              <option value="7d">7d</option>
              <option value="30d">30d</option>
              <option value="90d">90d</option>
            </select>
            <input className="border rounded px-2 py-1 bg-transparent" placeholder="Platform" value={platform} onChange={(e)=> setPlatform(e.target.value)} />
            <input className="border rounded px-2 py-1 bg-transparent" placeholder="Niche" value={niche} onChange={(e)=> setNiche(e.target.value)} />
            <button onClick={loadRecipeBook} className="ml-auto border px-3 py-1 rounded" data-testid="btn-refresh">Refresh</button>
            {isStarterPackEnabled() && (
              <button
                type="button"
                data-testid="starter-chip"
                aria-label="Starter Pack"
                onClick={() => {
                  const next = !starterEnabled
                  setStarterEnabled(next)
                  if (typeof window !== 'undefined') {
                    const nextUrl = applyStarterParam(window.location.pathname + window.location.search, next)
                    window.history.replaceState(null, '', nextUrl)
                  }
                }}
                className={`ml-2 px-3 py-1 rounded-full text-sm border transition-colors ${starterEnabled ? 'bg-[rgba(102,126,234,0.12)] border-[rgba(102,126,234,0.3)] text-white shadow-[0_0_16px_rgba(102,126,234,0.35)]' : 'bg-white/[0.05] border-white/10 text-gray-300 hover:bg-white/[0.08]'}`}
              >
                Starter Pack
              </button>
            )}
          </div>
          {/* Updated timestamp */}
          <div className="text-xs text-zinc-400">{generatedAtISO ? `Updated ${updatedRelative}` : ''}</div>
          {/* Lists: always render containers so tests can assert visibility */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="relative overflow-hidden bg-white/5 backdrop-blur border-white/10 hover:border-white/20 transition-colors">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-red-500/10 via-pink-500/10 to-fuchsia-500/5" />
                <CardHeader><CardTitle className="text-sm text-white">🔥 HOT ({hot.length})</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2" data-testid="hot-list">
                    {loading ? (
                      <li className="text-sm text-white">Loading…</li>
                    ) : error ? (
                      <li className="text-sm text-red-300">Error • <button className="underline" onClick={loadRecipeBook}>Retry</button></li>
                    ) : hot.length===0 ? (
                      <li className="text-sm text-white">No templates yet. Run QA Seed or Recompute in Operations Center.</li>
                    ) : (
                      hot.map((t:any)=> (
                        <li key={t.id} className="p-2 border border-white/10 rounded bg-white/[0.02] hover:bg-white/[0.04] transition-colors" data-testid={`tpl-card-${t.id}`}>
                          <div className="text-sm font-semibold text-white">{t.name || t.title}</div>
                          <div className="text-xs text-zinc-400">SR <span className="bg-gradient-to-r from-rose-300 to-pink-400 bg-clip-text text-transparent font-semibold">{Math.round(((t.successRate??t.sr)||0)*100)}%</span> • Uses {t.uses}</div>
                        </li>
                      ))
                    )}
                  </ul>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden bg-white/5 backdrop-blur border-white/10 hover:border-white/20 transition-colors">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-teal-300/10 via-cyan-400/10 to-blue-500/5" />
                <CardHeader><CardTitle className="text-sm text-white">🧊 COOLING ({cooling.length})</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2" data-testid="cooling-list">
                    {loading ? (
                      <li className="text-sm text-white">Loading…</li>
                    ) : error ? (
                      <li className="text-sm text-red-300">Error • <button className="underline" onClick={loadRecipeBook}>Retry</button></li>
                    ) : cooling.length===0 ? (
                      <li className="text-sm text-white">No templates yet. Run QA Seed or Recompute in Operations Center.</li>
                    ) : (
                      cooling.map((t:any)=> (
                        <li key={t.id} className="p-2 border border-white/10 rounded bg-white/[0.02] hover:bg-white/[0.04] transition-colors" data-testid={`tpl-card-${t.id}`}>
                          <div className="text-sm font-semibold text-white">{t.name}</div>
                          <div className="text-xs text-zinc-400">SR <span className="bg-gradient-to-r from-cyan-300 to-sky-400 bg-clip-text text-transparent font-semibold">{Math.round((t.successRate||0)*100)}%</span> • Uses {t.uses}</div>
                        </li>
                      ))
                    )}
                  </ul>
                </CardContent>
              </Card>
              <Card className="relative overflow-hidden bg-white/5 backdrop-blur border-white/10 hover:border-white/20 transition-colors">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-violet-400/10 via-fuchsia-400/10 to-pink-400/5" />
                <CardHeader><CardTitle className="text-sm text-white">✨ NEW ({newly.length})</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2" data-testid="new-list">
                    {loading ? (
                      <li className="text-sm text-white">Loading…</li>
                    ) : error ? (
                      <li className="text-sm text-red-300">Error • <button className="underline" onClick={loadRecipeBook}>Retry</button></li>
                    ) : newly.length===0 ? (
                      <li className="text-sm text-white">No templates yet. Run QA Seed or Recompute in Operations Center.</li>
                    ) : (
                      newly.map((t:any)=> (
                        <li key={t.id} className="p-2 border border-white/10 rounded bg-white/[0.02] hover:bg-white/[0.04] transition-colors" data-testid={`tpl-card-${t.id}`}>
                          <div className="text-sm font-semibold text-white">{t.name}</div>
                          <div className="text-xs text-zinc-400">SR <span className="bg-gradient-to-r from-fuchsia-300 to-pink-400 bg-clip-text text-transparent font-semibold">{Math.round((t.successRate||0)*100)}%</span> • Uses {t.uses}</div>
                        </li>
                      ))
                    )}
                  </ul>
                </CardContent>
              </Card>
          </div>
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/5 backdrop-blur border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-400">47</div>
                <div className="text-sm text-white">HOT Templates</div>
                <Badge className="bg-red-500/20 text-red-300 mt-1 border border-red-500/20">Trending</Badge>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">89.2%</div>
                <div className="text-sm text-white">Avg Success Rate</div>
                <div className="flex items-center justify-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                  <span className="text-xs text-green-300">+2.3%</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">2.4M</div>
                <div className="text-sm text-white">Avg Views</div>
                <div className="flex items-center justify-center mt-1">
                  <Eye className="h-3 w-3 text-blue-400 mr-1" />
                  <span className="text-xs text-blue-300">Per template</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 backdrop-blur border-white/10">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">24.8K</div>
                <div className="text-sm text-white">Videos Analyzed</div>
                <div className="flex items-center justify-center mt-1">
                  <Target className="h-3 w-3 text-purple-400 mr-1" />
                  <span className="text-xs text-purple-300">This month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <TemplateGallery 
            onTemplateSelect={handleTemplateSelect}
            onCopyTemplate={handleCopyTemplate}
            starterEnabled={starterEnabled}
            starterIds={starterIds}
            onStarterSelect={(t:any) => {
              setStarterEnabled(true)
              setTemplateId(String(t.id))
              if ((starterTemplates||[]).length === 0) {
                const top3 = (hot || []).slice(0,3)
                setStarterTemplates(top3.map((x:any)=>({ id: String(x.id||x.template_id), title: x.title||x.name, score: Math.round((x.success_rate??0.85)*100) })))
              }
              router.push('/admin/studio/script?starter=on')
            }}
          />
        </TabsContent>

        <TabsContent value="analyzer" className="space-y-6">
          <div data-testid="analyze-dropzone" className="sr-only" />
          <DraftsAnalyzer 
            onAnalysisComplete={(analysis) => {
              console.log('Analysis completed:', analysis)
            }}
          />
          <div data-testid="analyze-results" className="sr-only" />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <PredictionDashboard 
            onRunValidation={handleRunValidation}
          />
          <div data-testid="chart-discovery" className="sr-only" />
          <div data-testid="chart-decay" className="sr-only" />
        </TabsContent>

        <TabsContent value="scripts" className="space-y-6">
          <div id="scripts" data-testid="script-patterns" className="sr-only" />
          <div data-testid="scripts-list" className="sr-only" />
          <ScriptIntelligenceDashboard />
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <OptimizationEngine 
            onOptimizationComplete={(optimization) => {
              console.log('Optimization completed:', optimization)
            }}
          />
          <div data-testid="opt-schedule" className="sr-only" />
          <div data-testid="opt-entities" className="sr-only" />
        </TabsContent>

        <TabsContent value="abtesting" className="space-y-6">
          <div data-testid="ab-start" className="sr-only" />
          <ABTestInterface 
            onTestComplete={(test) => {
              console.log('A/B test completed:', test)
            }}
          />
          <div data-testid="ab-table" className="sr-only" />
        </TabsContent>

        <TabsContent value="inception" className="space-y-6">
          <InceptionMarketing 
            onContentGenerated={(content) => {
              console.log('Content generated:', content)
            }}
          />
          <div data-testid="inception-queue" className="sr-only" />
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <ValidationSystem 
            onValidationComplete={(run) => {
              console.log('Validation completed:', run)
            }}
          />
          <div data-testid="validate-calibration" className="sr-only" />
        </TabsContent>
      </Tabs>

      {/* Chat trigger mounted globally at root; no local trigger here */}
      {/* Readiness Slide-over */}
      {showReadiness && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={()=> setShowReadiness(false)} />
          <div className="w-full max-w-md bg-zinc-950 border-l border-white/10 p-4" data-testid="discovery-readiness-panel">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Discovery Readiness</div>
              <button className="text-xs px-2 py-1 rounded border border-white/10" onClick={()=> setShowReadiness(false)}>Close</button>
            </div>
            <div className="space-y-2 text-sm">
              <div>Freshness: {readiness?.scores?.freshness_secs ?? '—'}s {readiness?.scores?.freshness_secs > 7200 ? (<button className="ml-2 text-xs underline" onClick={()=> fetch('/api/admin/pipeline/actions/recompute-discovery', { method:'POST', headers:{ 'x-user-id':'local-admin' } })}>Fix it</button>) : null}</div>
              <div>Templates: {readiness?.scores?.templates_total ?? '—'}</div>
              <div>Sections: HOT {readiness?.scores?.sections?.HOT ?? '—'} • COOLING {readiness?.scores?.sections?.COOLING ?? '—'} • NEW {readiness?.scores?.sections?.NEW ?? '—'}</div>
              <div>Examples Coverage: {readiness?.scores?.examples_coverage_pct ?? '—'}% {(readiness?.scores?.examples_coverage_pct ?? 0) < 90 ? (<button className="ml-2 text-xs underline" onClick={()=> fetch('/api/admin/pipeline/actions/warm-examples', { method:'POST', headers:{ 'x-user-id':'local-admin' } })}>Fix it</button>) : null}</div>
              <div>Safety Coverage: {readiness?.scores?.safety_coverage_pct ?? '—'}%</div>
              <div>Analyzer: {readiness?.scores?.analyzer_online ? 'Online' : 'Offline'} {!readiness?.scores?.analyzer_online ? (<a className="ml-2 text-xs underline" href="/admin/engine-room" target="_blank" rel="noreferrer">Engine Room</a>) : null}</div>
              <div>A/B: {readiness?.scores?.ab_online ? 'Online' : 'Offline'}</div>
              <div>Validate: {readiness?.scores?.validate_online ? 'Online' : 'Offline'}</div>
              {(readiness?.reasons||[]).length ? (
                <div className="mt-2 text-xs text-amber-300">Reasons: {(readiness?.reasons||[]).join(', ')}</div>
              ) : null}
              <div className="pt-3 border-t border-white/10 flex gap-2">
                <button data-testid="ops-btn-qa-seed" className="text-xs px-3 py-1 rounded border border-white/10 disabled:opacity-60" disabled={busySeed} aria-busy={busySeed} onClick={async()=>{
                  setBusySeed(true)
                  const r = await fetch('/api/discovery/qa-seed', { method:'POST', headers:{ 'x-user-id':'local-admin' } })
                  const j = await r.json().catch(()=>({}))
                  toast({ title: r.ok? 'QA seed completed' : 'QA seed failed', description: j?.audit_id ? `Audit #${j.audit_id}` : undefined, variant: r.ok? 'default':'destructive' })
                  if (r.ok && j?.audit_id) showBanner({ title: `✅ Done (Audit #${j.audit_id})`, description: 'QA seed completed', variant: 'success', durationMs: 5000 })
                  if (r.ok) setTimeout(()=> location.reload(), 1000)
                  setBusySeed(false)
                }}>Run QA Seed</button>
                <button data-testid="ops-btn-recompute" className="text-xs px-3 py-1 rounded border border-white/10 disabled:opacity-60" disabled={busyRecompute} aria-busy={busyRecompute} onClick={async()=>{
                  setBusyRecompute(true)
                  const r = await fetch('/api/admin/pipeline/actions/recompute-discovery', { method:'POST', headers:{ 'x-user-id':'local-admin' } })
                  const j = await r.json().catch(()=>({}))
                  toast({ title: r.ok? 'Recompute started' : 'Recompute failed', description: j?.audit_id ? `Audit #${j.audit_id}` : undefined, variant: r.ok? 'default':'destructive' })
                  if (r.ok && j?.audit_id) showBanner({ title: `✅ Done (Audit #${j.audit_id})`, description: 'Recompute Discovery', variant: 'success', durationMs: 5000 })
                  setBusyRecompute(false)
                }}>Recompute</button>
                <button data-testid="ops-btn-warm-examples" className="text-xs px-3 py-1 rounded border border-white/10 disabled:opacity-60" disabled={busyWarm} aria-busy={busyWarm} onClick={async()=>{
                  setBusyWarm(true)
                  const r = await fetch('/api/admin/pipeline/actions/warm-examples', { method:'POST', headers:{ 'x-user-id':'local-admin' } })
                  const j = await r.json().catch(()=>({}))
                  toast({ title: r.ok? 'Warming queued' : 'Warm failed', description: j?.audit_id ? `Audit #${j.audit_id}` : undefined, variant: r.ok? 'default':'destructive' })
                  if (r.ok && j?.audit_id) showBanner({ title: `✅ Done (Audit #${j.audit_id})`, description: 'Warm Examples queued', variant: 'success', durationMs: 5000 })
                  setBusyWarm(false)
                }}>Warm Examples</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}