"use client"

import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Eye, TrendingUp, Clock, Target, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AURATemplateCard, AURATemplate } from './AURATemplateCard'
import { TemplateModalCapsule } from './TemplateModalCapsule'
import { isTemplateMiniUIEnabled } from '@/config/flags'
import { useTemplateCapsuleStore } from '@/lib/state/templateCapsuleStore'
import { useTemplatesDiscovery } from '@/lib/hooks/useTemplatesDiscovery'
import { useDiscoveryStore } from '@/lib/state/discoveryStore'

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
  thumbnail_url?: string
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
  last_updated: string
  created_at: string
}

interface TemplateGalleryProps {
  onTemplateSelect: (template: ViralTemplate) => void
  onCopyTemplate: (template: ViralTemplate) => void
  // Starter Pack (optional)
  starterEnabled?: boolean
  starterIds?: string[]
  onStarterSelect?: (template: ViralTemplate) => void
}

const mockTemplates: ViralTemplate[] = [
  {
    id: '1',
    title: 'Authority Transform',
    description: 'Establish expertise through transformation story',
    success_rate: 89,
    viral_probability: 0.87,
    avg_views: 2400000,
    category: 'authority',
    platform_optimized: 'tiktok',
    duration_range: '15-30s',
    hook_timing: 3,
    engagement_pattern: 'viral_curve',
    example_videos: [
      { id: '1', title: 'From Broke to Millionaire', views: 5200000, engagement_score: 0.92 },
      { id: '2', title: 'Coding Noob to Senior Dev', views: 3800000, engagement_score: 0.88 }
    ],
    structure: {
      hook: 'I went from [struggling state] to [success state]',
      build: 'Here\'s exactly what I did differently',
      payoff: 'The one thing that changed everything',
      cta: 'Follow for more transformation stories'
    },
    status: 'HOT',
    last_updated: '2024-01-15',
    created_at: '2024-01-10'
  },
  {
    id: '2',
    title: 'Secret Revelation',
    description: 'Reveal insider knowledge that surprises audience',
    success_rate: 84,
    viral_probability: 0.82,
    avg_views: 1900000,
    category: 'tutorial',
    platform_optimized: 'all',
    duration_range: '20-45s',
    hook_timing: 2,
    engagement_pattern: 'quick_spike',
    example_videos: [
      { id: '3', title: 'Gym Employees Don\'t Want You to Know', views: 4100000, engagement_score: 0.85 },
      { id: '4', title: 'Restaurant Secret Menu Hack', views: 2700000, engagement_score: 0.79 }
    ],
    structure: {
      hook: 'Nobody tells you this secret about [topic]',
      build: 'Here\'s what actually happens behind the scenes',
      payoff: 'That\'s why [unexpected outcome]',
      cta: 'Save this for later'
    },
    status: 'HOT',
    last_updated: '2024-01-14',
    created_at: '2024-01-08'
  },
  {
    id: '3',
    title: 'Day in Life - Success',
    description: 'Showcase aspirational lifestyle through daily routine',
    success_rate: 76,
    viral_probability: 0.74,
    avg_views: 1200000,
    category: 'story',
    platform_optimized: 'instagram',
    duration_range: '30-60s',
    hook_timing: 5,
    engagement_pattern: 'steady_growth',
    example_videos: [
      { id: '5', title: 'Day as a CEO at 25', views: 1800000, engagement_score: 0.81 },
      { id: '6', title: 'Morning Routine for Success', views: 1400000, engagement_score: 0.77 }
    ],
    structure: {
      hook: 'Day in my life as [aspirational role]',
      build: 'Morning routine + key activities',
      payoff: 'Why this lifestyle is achievable',
      cta: 'Follow for daily motivation'
    },
    status: 'STABLE',
    last_updated: '2024-01-12',
    created_at: '2024-01-05'
  },
  {
    id: '4',
    title: 'Mistake Prevention',
    description: 'Warn about common mistakes to avoid',
    success_rate: 91,
    viral_probability: 0.89,
    avg_views: 2800000,
    category: 'tutorial',
    platform_optimized: 'youtube',
    duration_range: '45-90s',
    hook_timing: 4,
    engagement_pattern: 'viral_curve',
    example_videos: [
      { id: '7', title: '5 Mistakes That Keep You Poor', views: 3200000, engagement_score: 0.94 },
      { id: '8', title: 'Why Your Business Is Failing', views: 2400000, engagement_score: 0.87 }
    ],
    structure: {
      hook: 'Stop making these [number] mistakes',
      build: 'Here\'s what most people get wrong',
      payoff: 'Do this instead for better results',
      cta: 'Which mistake were you making?'
    },
    status: 'HOT',
    last_updated: '2024-01-16',
    created_at: '2024-01-11'
  }
]

const statusColors = {
  HOT: 'bg-red-500',
  COOLING: 'bg-orange-500',
  NEW: 'bg-green-500',
  STABLE: 'bg-blue-500'
}

const categoryIcons = {
  authority: Target,
  story: Eye,
  tutorial: Play,
  entertainment: TrendingUp,
  trending: Clock
}

export function TemplateGallery({ onTemplateSelect, onCopyTemplate, starterEnabled, starterIds, onStarterSelect }: TemplateGalleryProps) {
  const { range, platform, niche, sort } = useDiscoveryStore()
  const { list, isLoading } = useTemplatesDiscovery({ range, platform, niche, sort })
  const [templates, setTemplates] = useState<ViralTemplate[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'success_rate' | 'viral_probability' | 'avg_views'>('success_rate')

  useEffect(() => {
    if (!Array.isArray(list) || list.length === 0) { setTemplates(mockTemplates); return }
    const mapped = list.map((t:any, idx:number)=> ({
      id: String(t.id || idx + 1),
      title: t.name || 'Template',
      description: 'Auto-discovered viral template',
      success_rate: Math.round((t.sr ?? 0.85) * 100),
      viral_probability: t.sr ?? 0.85,
      avg_views: t.support ? Math.max(0, Math.round(Number(t.support) * 1000)) : 0,
      category: 'trending',
      platform_optimized: 'tiktok',
      duration_range: '15-60s',
      hook_timing: 3,
      engagement_pattern: 'viral_curve',
      example_videos: [],
      structure: { hook: '', build: '', payoff: '', cta: '' },
      status: (String(t.status||'HOT').toUpperCase()) as any,
      last_updated: t.last_seen_at || new Date().toISOString(),
      created_at: new Date().toISOString()
    })) as ViralTemplate[]
    setTemplates(mapped)
  }, [JSON.stringify(list)])

  const filteredTemplates = templates
    .filter(template => selectedCategory === 'all' || template.category === selectedCategory)
    .sort((a, b) => b[sortBy] - a[sortBy])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Viral Recipe Book</h1>
          <p className="text-white">Templates with proven viral success rates</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-white/30 bg-transparent text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="authority">Authority</option>
            <option value="story">Story</option>
            <option value="tutorial">Tutorial</option>
            <option value="entertainment">Entertainment</option>
            <option value="trending">Trending</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-white/30 bg-transparent text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="success_rate">Success Rate</option>
            <option value="viral_probability">Viral Probability</option>
            <option value="avg_views">Average Views</option>
          </select>
        </div>
      </div>

      {/* Template Grid (AURA UI card) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {filteredTemplates.map((t) => {
          const data: AURATemplate = {
            id: String(t.id),
            state: t.status,
            title: t.title,
            description: t.description,
            views: formatNumber(t.avg_views).toUpperCase(),
            likes: formatNumber(Math.max(1, Math.round(t.avg_views * 0.18))).toUpperCase(),
            viralScore: `${t.success_rate}%`,
            sr: t.success_rate,
            uses: Math.max(200, Math.round(t.avg_views * 0.6)),
            examples: Math.max(20, Math.round(t.avg_views / 100000)),
            lastSeen: '5m ago',
            platformName: t.platform_optimized === 'all' ? 'All' : t.platform_optimized,
            platforms: t.platform_optimized === 'all' ? ['📱','📷','📺'] : [t.platform_optimized === 'tiktok' ? '📱' : t.platform_optimized === 'instagram' ? '📷' : '📺'],
            duration: t.duration_range,
            hookTime: `${t.hook_timing}s`,
            signals: ['Before/After','Visual Hook','Transformation'],
            brandSafe: true,
            antiGaming: true,
            reliability: 'well-calibrated',
            sound: 'Trending',
            gradient: 'linear-gradient(135deg, #7b61ff 0%, #ff61a6 100%)',
            credits: { analyze: 3, generate: 8, validate: 2 },
            trendDelta7d: t.success_rate >= 90 ? 12 : (t.success_rate >= 85 ? 5 : -3),
            trendDelta30d: t.success_rate >= 90 ? 8 : (t.success_rate >= 85 ? -2 : -5)
          }
          return (
            <div key={data.id} data-testid={`tpl-card-${data.id}`} className="relative">
              <TemplateModalCapsule
                templateId={data.id}
                title={data.title}
                srPct={data.sr}
                statusLabel={data.state}
                trigger={
                  <AURATemplateCard
                    data={data}
                    onView={() => {
                      const enabled = isTemplateMiniUIEnabled(typeof window !== 'undefined' ? window.location.href : undefined)
                      if (enabled) {
                        if (typeof window !== 'undefined') {
                          const initialHash = (window.location.hash || '#reader')
                          const params = new URLSearchParams(window.location.search)
                          params.set('hash', initialHash)
                          const next = `/membership/viral-recipe-book/templates/${data.id}${params.toString() ? `?${params.toString()}` : ''}`
                          window.location.href = next
                        }
                      } else {
                        onTemplateSelect(t)
                      }
                    }}
                    onCopy={() => onCopyTemplate(t)}
                    onGenerate={() => {
                      if (typeof window !== 'undefined') {
                        const qs = new URLSearchParams({ templateId: data.id }).toString()
                        const url = `/remix?${qs}`
                        window.open(url, '_blank')
                      }
                    }}
                  />
                }
              />
            </div>
          )
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No templates found for the selected category.</div>
        </div>
      )}
    </div>
  )
}