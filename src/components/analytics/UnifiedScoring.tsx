"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-component'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, LineChart, TrendingUp, Volume2, Play } from 'lucide-react'

// Types
interface UnifiedScoreItem {
  id: string
  name: string
  type: 'template' | 'sound'
  score: number
  engagement: number
  growth: number
  virality: number
  recommendation: string
  category?: string
}

interface UnifiedScoringProps {
  soundId?: string
  templateId?: string
  className?: string
}

export default function UnifiedScoring({ soundId, templateId, className = "" }: UnifiedScoringProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scoreData, setScoreData] = useState<UnifiedScoreItem[]>([])
  const [scoreType, setScoreType] = useState<'all' | 'templates' | 'sounds'>('all')
  
  useEffect(() => {
    const fetchUnifiedScores = async () => {
      setLoading(true)
      try {
        // Build query params
        const params = new URLSearchParams()
        if (soundId) params.append('soundId', soundId)
        if (templateId) params.append('templateId', templateId)
        
        // Fetch unified scores
        const response = await fetch(`/api/analytics/unified-scores?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch unified scores: ${response.status}`)
        }
        
        const { success, data, error } = await response.json()
        
        if (!success) {
          throw new Error(error || 'Failed to fetch unified scores')
        }
        
        setScoreData(data)
      } catch (err) {
        console.error('Error fetching unified scores:', err)
        setError((err as Error).message || 'Failed to load unified scores')
      } finally {
        setLoading(false)
      }
    }
    
    fetchUnifiedScores()
  }, [soundId, templateId])
  
  // Filter data based on selected type
  const filteredData = scoreData.filter(item => {
    if (scoreType === 'all') return true
    if (scoreType === 'templates') return item.type === 'template'
    if (scoreType === 'sounds') return item.type === 'sound'
    return true
  })
  
  // Sort by score (descending)
  const sortedData = [...filteredData].sort((a, b) => b.score - a.score)
  
  // Render loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Unified Scoring</CardTitle>
          <CardDescription>
            Combined analysis of templates and sounds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Render error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Unified Scoring</CardTitle>
          <CardDescription>
            Combined analysis of templates and sounds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 text-red-800 rounded-md">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Helper function to render score
  const renderScore = (score: number) => {
    let color = 'text-gray-500'
    if (score >= 80) color = 'text-green-600'
    else if (score >= 60) color = 'text-blue-600'
    else if (score >= 40) color = 'text-amber-600'
    else color = 'text-red-600'
    
    return <span className={`font-bold ${color}`}>{score}</span>
  }
  
  // Helper function to render item type icon
  const renderTypeIcon = (type: 'template' | 'sound') => {
    if (type === 'template') {
      return <BarChart3 className="h-5 w-5 text-purple-500" />
    } else {
      return <Volume2 className="h-5 w-5 text-blue-500" />
    }
  }
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Unified Scoring</CardTitle>
          <CardDescription>
            Combined analysis of templates and sounds
          </CardDescription>
        </div>
        <Select value={scoreType} onValueChange={(value) => setScoreType(value as 'all' | 'templates' | 'sounds')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="templates">Templates</SelectItem>
            <SelectItem value="sounds">Sounds</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedData.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No {scoreType === 'all' ? 'data' : scoreType} found
            </div>
          ) : (
            sortedData.map((item) => (
              <div 
                key={item.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {renderTypeIcon(item.type)}
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {item.type} {item.category ? `• ${item.category}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-lg">{renderScore(item.score)}</div>
                    <p className="text-xs text-muted-foreground">Unified Score</p>
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-sm font-medium">{item.engagement}%</div>
                    <div className="text-xs text-muted-foreground">Engagement</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-sm font-medium">
                      <span className={item.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.growth > 0 ? '+' : ''}{item.growth}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">Growth</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-sm font-medium">{item.virality}</div>
                    <div className="text-xs text-muted-foreground">Virality</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-sm">
                    <span className="font-medium">Recommendation:</span> {item.recommendation}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
} 