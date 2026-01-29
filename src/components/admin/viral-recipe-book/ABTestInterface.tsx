"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  GitBranch, 
  Play, 
  Pause,
  TrendingUp, 
  TrendingDown,
  Target, 
  Eye,
  BarChart3,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Crown,
  Trophy,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useSWR from 'swr'
import { useToast } from '@/components/ui/use-toast'
import { showBanner } from '@/lib/ui/bannerBus'
import { recordAbEvent } from '@/lib/ab/events'

interface ABTestVariant {
  id: string
  name: string
  description: string
  viral_probability: number
  predicted_views: number
  hook_text: string
  thumbnail_url?: string
  changes_made: string[]
  test_group: 'A' | 'B' | 'C'
  status: 'draft' | 'running' | 'completed' | 'paused'
}

interface ABTestResults {
  variant_id: string
  actual_views: number
  engagement_rate: number
  share_rate: number
  completion_rate: number
  click_through_rate: number
  comments: number
  likes: number
  confidence_interval: number
  statistical_significance: boolean
}

interface ABTest {
  id: string
  test_name: string
  hypothesis: string
  test_type: 'hook' | 'thumbnail' | 'structure' | 'cta' | 'timing'
  variants: ABTestVariant[]
  results?: ABTestResults[]
  winner?: string
  status: 'draft' | 'running' | 'completed' | 'paused'
  start_date: string
  end_date?: string
  sample_size: number
  target_significance: number
  progress_percentage: number
  insights: string[]
  created_at: string
}

interface ABTestInterfaceProps {
  onTestComplete?: (test: ABTest) => void
}

export function ABTestInterface({ onTestComplete }: ABTestInterfaceProps) {
  const [tests, setTests] = useState<ABTest[]>([])
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null)
  const [isCreatingTest, setIsCreatingTest] = useState(false)
  const [selectedTab, setSelectedTab] = useState('active')
  const { toast } = useToast()

  // Mock data for demonstration
  useEffect(() => {
    const mockTests: ABTest[] = [
      {
        id: '1',
        test_name: 'Hook Optimization: Business vs Authority',
        hypothesis: 'Authority-based hooks will outperform generic business hooks by 20%+',
        test_type: 'hook',
        variants: [
          {
            id: 'a1',
            name: 'Generic Business Hook',
            description: 'Standard business advice opening',
            viral_probability: 0.76,
            predicted_views: 850000,
            hook_text: 'Want to grow your business? Here are 5 tips that actually work.',
            changes_made: ['Original hook', 'No changes'],
            test_group: 'A',
            status: 'running'
          },
          {
            id: 'b1',
            name: 'Authority-Based Hook',
            description: 'Establishes credibility and specific results',
            viral_probability: 0.89,
            predicted_views: 1200000,
            hook_text: 'After helping 500+ businesses scale to 7-figures, here\'s what actually works.',
            changes_made: ['Added credibility markers', 'Specific number (500+)', 'Result claim (7-figures)'],
            test_group: 'B',
            status: 'running'
          }
        ],
        results: [
          {
            variant_id: 'a1',
            actual_views: 920000,
            engagement_rate: 0.067,
            share_rate: 0.023,
            completion_rate: 0.72,
            click_through_rate: 0.045,
            comments: 1240,
            likes: 61600,
            confidence_interval: 0.92,
            statistical_significance: true
          },
          {
            variant_id: 'b1',
            actual_views: 1350000,
            engagement_rate: 0.089,
            share_rate: 0.031,
            completion_rate: 0.84,
            click_through_rate: 0.062,
            comments: 2140,
            likes: 120150,
            confidence_interval: 0.94,
            statistical_significance: true
          }
        ],
        winner: 'b1',
        status: 'completed',
        start_date: '2024-01-10T00:00:00Z',
        end_date: '2024-01-15T23:59:59Z',
        sample_size: 10000,
        target_significance: 0.95,
        progress_percentage: 100,
        insights: [
          'Authority-based hooks performed 46.7% better than generic hooks',
          'Specific numbers (500+, 7-figures) increased credibility perception',
          'Completion rate improved by 16.7% with authority positioning',
          'Comments increased by 72.6% - indicating higher engagement quality'
        ],
        created_at: '2024-01-10T00:00:00Z'
      },
      {
        id: '2',
        test_name: 'Thumbnail A/B: Face vs Product',
        hypothesis: 'Face thumbnails will generate higher CTR than product-focused thumbnails',
        test_type: 'thumbnail',
        variants: [
          {
            id: 'a2',
            name: 'Product Focus',
            description: 'Shows product/result without person',
            viral_probability: 0.68,
            predicted_views: 720000,
            hook_text: 'This simple tool changed everything for my business.',
            changes_made: ['Product-centered thumbnail', 'No face visible'],
            test_group: 'A',
            status: 'running'
          },
          {
            id: 'b2',
            name: 'Face + Emotion',
            description: 'Close-up face with surprised expression',
            viral_probability: 0.82,
            predicted_views: 1100000,
            hook_text: 'This simple tool changed everything for my business.',
            changes_made: ['Face close-up', 'Surprised expression', 'Eye contact with camera'],
            test_group: 'B',
            status: 'running'
          }
        ],
        status: 'running',
        start_date: '2024-01-14T00:00:00Z',
        sample_size: 8000,
        target_significance: 0.95,
        progress_percentage: 67,
        insights: [
          'Early data shows face thumbnails leading by 18%',
          'Eye contact appears to increase initial engagement',
          'Need 2,640 more views for statistical significance'
        ],
        created_at: '2024-01-14T00:00:00Z'
      },
      {
        id: '3',
        test_name: 'CTA Comparison: Question vs Command',
        hypothesis: 'Question-based CTAs will drive more comments than command-based',
        test_type: 'cta',
        variants: [
          {
            id: 'a3',
            name: 'Command CTA',
            description: 'Direct instruction to audience',
            viral_probability: 0.74,
            predicted_views: 890000,
            hook_text: 'Follow for more business tips like this.',
            changes_made: ['Direct command', 'Generic follow request'],
            test_group: 'A',
            status: 'draft'
          },
          {
            id: 'b3',
            name: 'Question CTA',
            description: 'Asks audience for their experience',
            viral_probability: 0.79,
            predicted_views: 970000,
            hook_text: 'Which of these business tips surprised you most?',
            changes_made: ['Question format', 'Engages personal experience', 'Multiple choice implied'],
            test_group: 'B',
            status: 'draft'
          },
          {
            id: 'c3',
            name: 'Poll CTA',
            description: 'Creates interactive poll engagement',
            viral_probability: 0.81,
            predicted_views: 1020000,
            hook_text: 'Vote: Which tip will you try first? 👆 Tip 1, ❤️ Tip 2, 💬 Tip 3',
            changes_made: ['Interactive poll format', 'Emoji voting system', 'Clear instructions'],
            test_group: 'C',
            status: 'draft'
          }
        ],
        status: 'draft',
        start_date: '2024-01-17T00:00:00Z',
        sample_size: 12000,
        target_significance: 0.95,
        progress_percentage: 0,
        insights: [
          'Three-way test to maximize learning potential',
          'Poll format predicted to have highest engagement',
          'Question format balances engagement with simplicity'
        ],
        created_at: '2024-01-16T00:00:00Z'
      }
    ]

    setTests(mockTests)
    setSelectedTest(mockTests[0])
  }, [])

  const handleStartTest = async (testId: string) => {
    // Call API to start A/B test and receive a receipt
    try {
      const res = await fetch('/api/ab/start', { method: 'POST', headers: { 'content-type':'application/json','x-user-id':'local-admin' }, body: JSON.stringify({ testId }) })
      if (res.ok) {
        const j = await res.json()
        toast({ title: 'A/B started', description: j?.audit_id ? `Audit #${j.audit_id}` : undefined })
        if (j?.audit_id) showBanner({ title: '✅ Done (Audit #' + j.audit_id + ')', description: 'A/B Test started', variant: 'success', durationMs: 5000 })
        // Add active row with id from server if present
        const newId = j?.id || testId
        setTests(prev => prev.map(test => (
          test.id === testId 
            ? { ...test, id: newId, status: 'running', start_date: new Date().toISOString() } 
            : test
        )))
        // Poll status until completed
        let done = false
        while (!done) {
          const g = await fetch(`/api/ab/${encodeURIComponent(newId)}`)
          if (!g.ok) break
          const jj = await g.json()
          if (jj.status === 'completed') {
            done = true
            setTests(prev => prev.map(t => t.id === newId ? { ...t, status: 'completed', end_date: new Date().toISOString() } as any : t))
            break
          }
          await new Promise(r => setTimeout(r, 2000))
        }
      }
    } catch {}
  }

  const handlePauseTest = async (testId: string) => {
    setTests(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, status: 'paused' }
        : test
    ))
  }

  const handleCreateNewTest = () => {
    setIsCreatingTest(true)
    // In real implementation, this would open a test creation modal/form
    setTimeout(() => {
      setIsCreatingTest(false)
    }, 2000)
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-700'
      case 'completed': return 'bg-blue-100 text-blue-700'
      case 'paused': return 'bg-yellow-100 text-yellow-700'
      case 'draft': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="h-4 w-4" />
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      case 'paused': return <Pause className="h-4 w-4" />
      case 'draft': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getWinnerBadge = (variant: ABTestVariant, test: ABTest) => {
    if (test.winner === variant.id) {
      return <Crown className="h-4 w-4 text-yellow-500" />
    }
    return null
  }

  const activeTests = tests.filter(t => t.status === 'running')
  const completedTests = tests.filter(t => t.status === 'completed')
  const draftTests = tests.filter(t => t.status === 'draft')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <GitBranch className="h-6 w-6 mr-2 text-blue-500" />
            A/B Testing Laboratory
          </h1>
          <p className="text-zinc-400">Compare video variations to optimize viral performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleCreateNewTest}
            disabled={isCreatingTest}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {isCreatingTest ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4 mr-2" />
                Create A/B Test
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{activeTests.length}</div>
            <div className="text-sm text-gray-600">Active Tests</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{completedTests.length}</div>
            <div className="text-sm text-gray-600">Completed Tests</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">87.3%</div>
            <div className="text-sm text-gray-600">Avg Improvement</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">24</div>
            <div className="text-sm text-gray-600">Total Insights</div>
          </CardContent>
        </Card>
      </div>

      {/* Test List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-testid="ab-table">
        {/* Test List */}
        <div className="lg:col-span-1">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-3">
              {activeTests.map((test) => (
                <Card 
                  key={test.id} 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    selectedTest?.id === test.id ? "ring-2 ring-blue-500" : ""
                  )}
                  onClick={() => setSelectedTest(test)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm" data-testid={`ab-row-${test.id}`}>{test.test_name}</h4>
                      <Badge className={getStatusColor(test.status)}>
                        {getStatusIcon(test.status)}
                        <span className="ml-1">{test.status}</span>
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3">{test.hypothesis}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Progress:</span>
                        <span className="font-medium">{test.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-green-500 h-1 rounded-full transition-all" 
                          style={{ width: `${test.progress_percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{test.variants.length} variants</span>
                        <span>Target: {formatNumber(test.sample_size)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-3">
              {completedTests.map((test) => (
                <Card 
                  key={test.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    selectedTest?.id === test.id ? "ring-2 ring-blue-500" : ""
                  )}
                  onClick={() => setSelectedTest(test)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{test.test_name}</h4>
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <Badge className={getStatusColor(test.status)}>
                          {getStatusIcon(test.status)}
                          <span className="ml-1">{test.status}</span>
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3">{test.hypothesis}</p>
                    
                    {test.results && (
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Winner lift:</span>
                          <span className="font-medium text-green-600">
                            +{(((test.results.find(r => r.variant_id === test.winner)?.actual_views || 0) / 
                               (test.results.find(r => r.variant_id !== test.winner)?.actual_views || 1) - 1) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Significance:</span>
                          <span className="font-medium text-blue-600">
                            {(test.results[0]?.confidence_interval * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="draft" className="space-y-3">
              {draftTests.map((test) => (
                <Card 
                  key={test.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    selectedTest?.id === test.id ? "ring-2 ring-blue-500" : ""
                  )}
                  onClick={() => setSelectedTest(test)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{test.test_name}</h4>
                      <Badge className={getStatusColor(test.status)}>
                        {getStatusIcon(test.status)}
                        <span className="ml-1">{test.status}</span>
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3">{test.hypothesis}</p>
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{test.variants.length} variants ready</span>
                      <span>Target: {formatNumber(test.sample_size)}</span>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="w-full mt-2"
                      data-testid="ab-start"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartTest(test.id)
                      }}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start Test
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Test Details */}
        <div className="lg:col-span-2">
          {selectedTest && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <GitBranch className="h-5 w-5 mr-2" />
                    {selectedTest.test_name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {selectedTest.status === 'running' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePauseTest(selectedTest.id)}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    <Badge className={getStatusColor(selectedTest.status)}>
                      {getStatusIcon(selectedTest.status)}
                      <span className="ml-1 capitalize">{selectedTest.status}</span>
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-600">{selectedTest.hypothesis}</p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Progress Bar */}
                {selectedTest.status === 'running' && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Test Progress</span>
                      <span>{selectedTest.progress_percentage}% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all" 
                        style={{ width: `${selectedTest.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Variants Comparison */}
                <div>
                  <h4 className="font-semibold mb-4">Variant Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedTest.variants.map((variant) => {
                      const result = selectedTest.results?.find(r => r.variant_id === variant.id)
                      const isWinner = selectedTest.winner === variant.id
                      
                      return (
                        <div key={variant.id} className={cn(
                          "border rounded-lg p-4",
                          isWinner ? "border-yellow-500 bg-yellow-50" : "border-gray-200"
                        )}>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium flex items-center">
                              {getWinnerBadge(variant, selectedTest)}
                              <span className={cn("ml-1", isWinner && "text-yellow-700")}>
                                Variant {variant.test_group}
                              </span>
                            </h5>
                            {isWinner && (
                              <Badge className="bg-yellow-100 text-yellow-700">
                                Winner
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{variant.description}</p>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Predicted:</span>
                              <span className="font-medium">{formatNumber(variant.predicted_views)}</span>
                            </div>
                            
                            {result && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Actual:</span>
                                  <span className="font-medium text-green-600">
                                    {formatNumber(result.actual_views)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Engagement:</span>
                                  <span className="font-medium">
                                    {(result.engagement_rate * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Completion:</span>
                                  <span className="font-medium">
                                    {(result.completion_rate * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </>
                            )}
                            
                            <div className="pt-2 border-t">
                              <p className="text-xs text-gray-600 italic">"{variant.hook_text}"</p>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" variant="outline" onClick={async()=>{
                              await recordAbEvent({ templateId: selectedTest.id, variantId: variant.id, eventType: 'variant_created', payload: { test_type: selectedTest.test_type } })
                            }}>Create Variant</Button>
                            <Button size="sm" variant="outline" onClick={async()=>{
                              await recordAbEvent({ templateId: selectedTest.id, variantId: variant.id, eventType: 'variant_switched', payload: { group: variant.test_group } })
                            }}>Switch To</Button>
                            {isWinner && (
                              <Button size="sm" onClick={async()=>{
                                await recordAbEvent({ templateId: selectedTest.id, variantId: variant.id, eventType: 'variant_promoted', payload: { reason: 'winner' } })
                              }}>Promote</Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Results Summary */}
                {selectedTest.status === 'completed' && selectedTest.results && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                      <Trophy className="h-5 w-5 mr-2" />
                      Test Results Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-green-700">Winner Performance</div>
                        <div className="text-lg font-bold text-green-900">
                          {formatNumber(selectedTest.results.find(r => r.variant_id === selectedTest.winner)?.actual_views || 0)} views
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-green-700">Improvement</div>
                        <div className="text-lg font-bold text-green-900">
                          +{(((selectedTest.results.find(r => r.variant_id === selectedTest.winner)?.actual_views || 0) / 
                             (selectedTest.results.find(r => r.variant_id !== selectedTest.winner)?.actual_views || 1) - 1) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-green-800">
                      Statistical significance: {(selectedTest.results[0]?.confidence_interval * 100).toFixed(1)}%
                    </div>
                  </div>
                )}

                {/* Insights */}
                <div>
                  <h4 className="font-semibold mb-3">Key Insights</h4>
                  <div className="space-y-2">
                    {selectedTest.insights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Changes Made */}
                <div>
                  <h4 className="font-semibold mb-3">Changes Made</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedTest.variants.map((variant) => (
                      <div key={variant.id} className="border rounded-lg p-3">
                        <h5 className="font-medium mb-2">Variant {variant.test_group}</h5>
                        <ul className="space-y-1">
                          {variant.changes_made.map((change, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <CheckCircle2 className="h-3 w-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                              {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}