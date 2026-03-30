"use client"

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Copy, 
  Play, 
  TrendingUp, 
  Clock, 
  Target, 
  Eye,
  BarChart3,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface TemplateViewerProps {
  template: ViralTemplate | null
  onBack: () => void
  onCopyTemplate: (template: ViralTemplate) => void
}

export function TemplateViewer({ template, onBack, onCopyTemplate }: TemplateViewerProps) {
  const [selectedTab, setSelectedTab] = useState('structure')
  const [copyBusy, setCopyBusy] = useState(false)
  const fetcher = (url: string) => fetch(url).then(r=> r.json())

  const { data: detail } = useSWR(template ? `/api/templates/${template.id}?range=30d` : null, fetcher)
  const { data: examples } = useSWR(template ? `/api/templates/${template.id}/examples?limit=20` : null, fetcher)

  if (!template) {
    return null
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const statusColors = {
    HOT: 'bg-red-500',
    COOLING: 'bg-orange-500',
    NEW: 'bg-green-500',
    STABLE: 'bg-blue-500'
  }

  const importanceColors = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-yellow-600 bg-yellow-50'
  }

  const impactColors = {
    high: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-gray-600 bg-gray-50'
  }

  // Mock viral elements and optimization tips
  const viralElements = [
    {
      element: 'Strong Hook',
      importance: 'critical' as const,
      description: 'First 3 seconds must capture attention and promise value',
      timing: '0-3s'
    },
    {
      element: 'Pattern Interrupt',
      importance: 'high' as const,
      description: 'Unexpected element that breaks viewer\'s scroll pattern',
      timing: '2-4s'
    },
    {
      element: 'Social Proof',
      importance: 'high' as const,
      description: 'Evidence of credibility or results',
      timing: '5-10s'
    },
    {
      element: 'Emotional Trigger',
      importance: 'critical' as const,
      description: 'Content that evokes strong emotional response',
      timing: 'Throughout'
    },
    {
      element: 'Clear Value Prop',
      importance: 'medium' as const,
      description: 'Obvious benefit for watching the content',
      timing: '3-8s'
    }
  ]

  const optimizationTips = [
    {
      tip: 'Use "You" instead of "I" in the hook for direct address',
      impact: 'high' as const,
      difficulty: 'easy' as const
    },
    {
      tip: 'Add trending sounds/music for algorithm boost',
      impact: 'medium' as const,
      difficulty: 'easy' as const
    },
    {
      tip: 'Include face close-up in first frame for human connection',
      impact: 'high' as const,
      difficulty: 'medium' as const
    },
    {
      tip: 'Use specific numbers instead of vague terms (e.g., "3 ways" vs "some ways")',
      impact: 'medium' as const,
      difficulty: 'easy' as const
    },
    {
      tip: 'End with question to drive comments for engagement',
      impact: 'high' as const,
      difficulty: 'easy' as const
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{detail?.name || template.title}</h1>
            <p className="text-zinc-400">{template.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge className={cn('text-white', statusColors[template.status])}>
            {template.status}
          </Badge>
          <Button 
            onClick={async () => {
              setCopyBusy(true)
              try {
                const res = await fetch('/api/templates/copy-winner', { method:'POST', headers:{ 'content-type':'application/json','x-user-id':'local-admin' }, body: JSON.stringify({ template_id: template.id }) })
                if (res.ok) {
                  const j = await res.json()
                  // naive toast: use alert substitute if toast system not injected here
                  if (typeof window !== 'undefined') {
                    alert(`Draft created: ${j.draft_id}`)
                  }
                } else {
                  const j = await res.json().catch(()=>({}))
                  alert(`Failed to copy: ${j?.message||res.status}`)
                }
              } finally { setCopyBusy(false) }
            }}
            disabled={copyBusy}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Copy className="h-4 w-4 mr-2" />
            {copyBusy? 'Copying...' : 'Copy Viral Winner'}
          </Button>
          <a
            href={`/admin/viral-recipe-book?tab=analyzer&template_id=${encodeURIComponent(template.id)}`}
            className="text-xs px-3 py-2 rounded border border-white/20"
            title="Analyze this template"
          >Analyze this template</a>
          <a
            href={`/admin/studio/script?starter=on&from=recipe-book&template_id=${encodeURIComponent(template.id)}`}
            className="text-xs px-3 py-2 rounded border border-white/20"
            title="Export to Studio"
          >Export to Studio</a>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{detail? Math.round((detail.sr||0)*100) : template.success_rate}%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{detail? Math.round((detail.uplift_pct||0)) : Math.round(template.viral_probability * 100)}%</div>
            <div className="text-sm text-gray-600">Viral Probability</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{formatNumber(detail?.support || template.avg_views)}</div>
            <div className="text-sm text-gray-600">Support</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{detail?.uses ?? 0}</div>
            <div className="text-sm text-gray-600">Uses</div>
          </CardContent>
        </Card>
      </div>

      {/* Sparkline & Safety/Entities */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>30d Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="tpl-sparkline" className="h-16 w-full flex items-end gap-1">
              {(detail?.trend||[]).slice(-30).map((v:number, idx:number)=> (
                <div key={idx} style={{ height: `${Math.max(4, Math.min(100, Math.round(v*50)))}%` }} className="w-1 bg-blue-500 rounded-sm" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Safety</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="tpl-safety" className="flex gap-2 text-xs">
              <span className={`px-2 py-1 rounded ${((detail?.safety?.nsfw||0)>0?'bg-red-100 text-red-700':'bg-green-100 text-green-700')}`}>NSFW {(detail?.safety?.nsfw||0)}</span>
              <span className={`px-2 py-1 rounded ${((detail?.safety?.copyright||0)>0?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700')}`}>Copyright {(detail?.safety?.copyright||0)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div>Sound: <span className="font-medium">{detail?.entity?.sound || '—'}</span></div>
              <div>Hashtags: {(detail?.entity?.hashtags||[]).map((h:string)=> `#${h.replace(/^#/, '')}`).join(' ') || '—'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5" data-testid="tpl-slide-tabs">
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="elements">Viral Elements</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Template Structure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-red-500 bg-red-50">
                    <h4 className="font-semibold text-red-700">Hook (0-{template.hook_timing}s)</h4>
                    <p className="text-sm text-gray-700 mt-1">{template.structure.hook}</p>
                  </div>
                  
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h4 className="font-semibold text-blue-700">Build ({template.hook_timing}-15s)</h4>
                    <p className="text-sm text-gray-700 mt-1">{template.structure.build}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-green-500 bg-green-50">
                    <h4 className="font-semibold text-green-700">Payoff (15-25s)</h4>
                    <p className="text-sm text-gray-700 mt-1">{template.structure.payoff}</p>
                  </div>
                  
                  <div className="p-4 border-l-4 border-purple-500 bg-purple-50">
                    <h4 className="font-semibold text-purple-700">Call-to-Action (25-30s)</h4>
                    <p className="text-sm text-gray-700 mt-1">{template.structure.cta}</p>
                  </div>
                </div>
              </div>

              {/* Visual Timeline */}
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Visual Timeline</h4>
                <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-red-400 opacity-75" style={{width: `${(template.hook_timing / 30) * 100}%`}}>
                    <div className="p-2 text-xs font-medium text-white">Hook</div>
                  </div>
                  <div className="absolute top-0 h-full bg-blue-400 opacity-75" style={{left: `${(template.hook_timing / 30) * 100}%`, width: `${((15 - template.hook_timing) / 30) * 100}%`}}>
                    <div className="p-2 text-xs font-medium text-white">Build</div>
                  </div>
                  <div className="absolute top-0 h-full bg-green-400 opacity-75" style={{left: '50%', width: '33.33%'}}>
                    <div className="p-2 text-xs font-medium text-white">Payoff</div>
                  </div>
                  <div className="absolute top-0 right-0 h-full bg-purple-400 opacity-75" style={{width: '16.67%'}}>
                    <div className="p-2 text-xs font-medium text-white">CTA</div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0s</span>
                  <span>15s</span>
                  <span>30s</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="elements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Viral Elements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {viralElements.map((element, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <div className={cn('px-2 py-1 rounded text-xs font-medium', importanceColors[element.importance])}>
                      {element.importance.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{element.element}</h4>
                        {element.timing && <span className="text-sm text-gray-500">{element.timing}</span>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{element.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Example Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {template.example_videos.map((video, index) => (
                  <div key={video.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Play className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{video.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{formatNumber(video.views)} views</span>
                          <span>{Math.round(video.engagement_score * 100)}% engagement</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Analyze
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Optimization Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {optimizationTips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">{tip.tip}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={cn('px-2 py-1 rounded text-xs font-medium', impactColors[tip.impact])}>
                          {tip.impact} impact
                        </span>
                        <span className="text-xs text-gray-500">{tip.difficulty} difficulty</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Template Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 rounded-lg p-6 text-white">
                <div className="text-center">
                  <div className="w-64 h-96 mx-auto bg-gray-800 rounded-lg border-2 border-gray-700 relative">
                    {/* Mock Mobile Video Preview */}
                    <div className="absolute top-4 left-4 right-4">
                      <div className="text-xs text-center text-gray-400">TikTok Preview</div>
                    </div>
                    
                    <div className="absolute bottom-20 left-4 right-4 space-y-2">
                      <div className="text-sm font-bold">@yourusername</div>
                      <div className="text-xs">{template.structure.hook}</div>
                      <div className="text-xs text-gray-400">{template.structure.cta}</div>
                    </div>
                    
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-xs">
                      <div className="flex space-x-4">
                        <span>❤️ 12.5K</span>
                        <span>💬 892</span>
                        <span>📤 Share</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-400">
                    <p>This is what a {template.success_rate}% viral video looks like</p>
                    <p className="mt-2">Expected performance: {formatNumber(template.avg_views)} views</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}