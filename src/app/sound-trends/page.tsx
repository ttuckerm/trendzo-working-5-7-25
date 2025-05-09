"use client"

// This file serves as a proper entry point to the sound trends dashboard
// It maintains the sidebar navigation structure while using our existing implementation

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-component'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, BarChart2, Music, Zap, Clock } from 'lucide-react'
import SoundGrowthChart from '@/components/analytics/SoundGrowthChart'
import SoundTemplateCorrelation from '@/components/analytics/SoundTemplateCorrelation'
import SoundEngagementCorrelation from '@/components/analytics/SoundEngagementCorrelation'
import SoundLifecycleChart from '@/components/analytics/SoundLifecycleChart'
import { Button } from '@/components/ui/button'

// Types
interface SoundTrendReport {
  id: string
  date: string
  topSounds: {
    daily: string[]
    weekly: string[]
    monthly: string[]
  }
  emergingSounds: string[]
  peakingSounds: string[]
  decliningTrends: string[]
  genreDistribution: Record<string, number>
  createdAt: any
}

interface SoundWithTrend {
  id: string
  title: string
  authorName: string
  duration: number
  usageCount: number
  trend: 'rising' | 'stable' | 'falling'
  lifecycle?: {
    stage: 'emerging' | 'growing' | 'peaking' | 'declining' | 'stable'
  }
  stats: {
    growthVelocity7d?: number
  }
  soundCategory?: string
}

export default function SoundTrendsPage() {
  const [timeframe, setTimeframe] = useState<'7d' | '14d' | '30d'>('7d')
  const [trendReport, setTrendReport] = useState<SoundTrendReport | null>(null)
  const [trendingSounds, setTrendingSounds] = useState<SoundWithTrend[]>([])
  const [selectedSound, setSelectedSound] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch trend report and trending sounds
  useEffect(() => {
    const fetchTrendData = async () => {
      setLoading(true)
      try {
        // Fetch trend report
        const reportRes = await fetch('/api/sounds/trend-report/latest')
        const reportData = await reportRes.json()
        
        if (reportData.success) {
          setTrendReport(reportData.data)
        }

        // Fetch trending sounds
        const soundsRes = await fetch(`/api/sounds/trending?timeframe=${timeframe}`)
        const soundsData = await soundsRes.json()
        
        if (soundsData.success) {
          setTrendingSounds(soundsData.sounds)
          // Set first sound as selected if none selected
          if (!selectedSound && soundsData.sounds.length > 0) {
            setSelectedSound(soundsData.sounds[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching trend data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrendData()
  }, [timeframe])

  // Helper to render lifecycle stage badge
  const renderLifecycleBadge = (stage?: string) => {
    if (!stage) return null
    
    const stageColors: Record<string, string> = {
      emerging: 'bg-blue-100 text-blue-800',
      growing: 'bg-green-100 text-green-800',
      peaking: 'bg-yellow-100 text-yellow-800',
      declining: 'bg-red-100 text-red-800',
      stable: 'bg-purple-100 text-purple-800'
    }
    
    return (
      <Badge className={stageColors[stage] || 'bg-gray-100'} variant="outline">
        {stage.charAt(0).toUpperCase() + stage.slice(1)}
      </Badge>
    )
  }

  // Helper to render trend indicator
  const renderTrendIndicator = (trend?: string, velocity?: number) => {
    if (!trend) return null
    
    const indicators: Record<string, { icon: React.ReactNode, className: string }> = {
      rising: { 
        icon: <TrendingUp className="h-4 w-4 mr-1" />, 
        className: 'text-green-600' 
      },
      stable: { 
        icon: <BarChart2 className="h-4 w-4 mr-1" />, 
        className: 'text-amber-600' 
      },
      falling: { 
        icon: <TrendingUp className="h-4 w-4 mr-1 transform rotate-180" />, 
        className: 'text-red-600' 
      }
    }
    
    const indicator = indicators[trend] || indicators.stable
    
    return (
      <div className={`flex items-center ${indicator.className}`}>
        {indicator.icon}
        <span>
          {velocity ? `${velocity > 0 ? '+' : ''}${velocity.toFixed(1)}%` : trend}
        </span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sound Trend Analysis</h1>
        <Select value={timeframe} onValueChange={(value) => setTimeframe(value as '7d' | '14d' | '30d')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="14d">Last 14 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trending">Trending Sounds</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle Analysis</TabsTrigger>
          <TabsTrigger value="correlations">Template Correlations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Trending Sound Count */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Trending Sounds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {loading ? <Skeleton className="h-8 w-16" /> : trendingSounds.length}
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            {/* Emerging Sound Count */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Emerging Sounds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      trendReport?.emergingSounds.length || 0
                    )}
                  </div>
                  <Zap className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            {/* Peaking Sound Count */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Peaking Sounds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      trendReport?.peakingSounds.length || 0
                    )}
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Growth Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sound Growth Trends</CardTitle>
              <CardDescription>
                Usage growth for top trending sounds over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <SoundGrowthChart soundId={selectedSound || undefined} isPremium={true} />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Remaining tabs would be implemented here */}
      </Tabs>
    </div>
  )
} 