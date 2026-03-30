"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { 
  Zap, 
  TrendingUp, 
  Target, 
  Lightbulb,
  Settings,
  Brain,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  Eye,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OptimizationSuggestion {
  id: string
  type: 'hook' | 'structure' | 'visual' | 'audio' | 'timing' | 'cta'
  title: string
  description: string
  current_score: number
  potential_score: number
  impact_estimate: number
  confidence: number
  difficulty: 'easy' | 'medium' | 'hard'
  implementation_time: string
  ai_reasoning: string
  examples: string[]
  priority: 'critical' | 'high' | 'medium' | 'low'
}

interface VideoOptimization {
  id: string
  video_title: string
  current_viral_probability: number
  optimized_viral_probability: number
  optimization_lift: number
  suggestions: OptimizationSuggestion[]
  before_breakdown: {
    hook_score: number
    content_score: number
    engagement_score: number
    platform_fit: number
  }
  after_breakdown: {
    hook_score: number
    content_score: number
    engagement_score: number
    platform_fit: number
  }
  status: 'analyzing' | 'optimized' | 'implemented'
  created_at: string
}

interface AIRecommendationPanel {
  active_optimizations: number
  total_lift_generated: number
  success_rate: number
  avg_implementation_time: string
  trending_optimizations: Array<{
    type: string
    frequency: number
    avg_impact: number
  }>
}

interface OptimizationEngineProps {
  selectedVideo?: any
  onOptimizationComplete?: (optimization: VideoOptimization) => void
}

export function OptimizationEngine({ selectedVideo, onOptimizationComplete }: OptimizationEngineProps) {
  const [optimizations, setOptimizations] = useState<VideoOptimization[]>([])
  const [selectedOptimization, setSelectedOptimization] = useState<VideoOptimization | null>(null)
  const [panelData, setPanelData] = useState<AIRecommendationPanel | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [selectedTab, setSelectedTab] = useState('suggestions')

  // Mock data for demonstration
  useEffect(() => {
    const mockOptimizations: VideoOptimization[] = [
      {
        id: '1',
        video_title: 'How to Build a 7-Figure Business',
        current_viral_probability: 0.76,
        optimized_viral_probability: 0.92,
        optimization_lift: 21.1,
        suggestions: [
          {
            id: '1',
            type: 'hook',
            title: 'Strengthen Opening Hook',
            description: 'Replace generic opening with specific transformation claim',
            current_score: 72,
            potential_score: 89,
            impact_estimate: 12,
            confidence: 0.94,
            difficulty: 'easy',
            implementation_time: '5 minutes',
            ai_reasoning: 'Current hook is too vague. Specific numbers and outcomes perform 23% better in business niche.',
            examples: [
              'Instead of: "Want to build a business?" Try: "How I went from $0 to $7M in 18 months"',
              'Add specific timeframe and dollar amount for credibility'
            ],
            priority: 'critical'
          },
          {
            id: '2',
            type: 'visual',
            title: 'Add Results Screenshot',
            description: 'Include revenue/profit screenshot in first 3 seconds',
            current_score: 65,
            potential_score: 82,
            impact_estimate: 8,
            confidence: 0.87,
            difficulty: 'medium',
            implementation_time: '15 minutes',
            ai_reasoning: 'Visual proof increases engagement by 34% and reduces scroll-away by 28%.',
            examples: [
              'Show bank account screenshot',
              'Display revenue dashboard',
              'Include before/after comparison'
            ],
            priority: 'high'
          },
          {
            id: '3',
            type: 'timing',
            title: 'Optimize Hook Timing',
            description: 'Reduce hook to 2.5 seconds for better retention',
            current_score: 78,
            potential_score: 85,
            impact_estimate: 5,
            confidence: 0.91,
            difficulty: 'easy',
            implementation_time: '10 minutes',
            ai_reasoning: 'Shorter hooks under 3 seconds have 18% higher retention rates.',
            examples: [
              'Cut introduction fluff',
              'Jump straight to value proposition',
              'Use faster pacing'
            ],
            priority: 'medium'
          }
        ],
        before_breakdown: {
          hook_score: 72,
          content_score: 81,
          engagement_score: 74,
          platform_fit: 76
        },
        after_breakdown: {
          hook_score: 89,
          content_score: 85,
          engagement_score: 88,
          platform_fit: 91
        },
        status: 'optimized',
        created_at: '2024-01-16T10:30:00Z'
      },
      {
        id: '2',
        video_title: 'Secret Productivity Method',
        current_viral_probability: 0.68,
        optimized_viral_probability: 0.84,
        optimization_lift: 23.5,
        suggestions: [
          {
            id: '4',
            type: 'structure',
            title: 'Restructure Content Flow',
            description: 'Move the reveal earlier to maintain curiosity',
            current_score: 69,
            potential_score: 86,
            impact_estimate: 15,
            confidence: 0.89,
            difficulty: 'medium',
            implementation_time: '20 minutes',
            ai_reasoning: 'Current structure loses 40% of viewers at 8-second mark. Earlier reveal maintains engagement.',
            examples: [
              'Tease the method in first 3 seconds',
              'Provide partial reveal at 5 seconds',
              'Full explanation after curiosity is built'
            ],
            priority: 'critical'
          },
          {
            id: '5',
            type: 'cta',
            title: 'Strengthen Call-to-Action',
            description: 'Replace weak CTA with question-driven engagement',
            current_score: 58,
            potential_score: 79,
            impact_estimate: 9,
            confidence: 0.85,
            difficulty: 'easy',
            implementation_time: '5 minutes',
            ai_reasoning: 'Question-based CTAs generate 67% more comments than generic follow requests.',
            examples: [
              'Instead of "Follow for more" try "Which step surprised you most?"',
              'Ask about their current productivity struggles',
              'Create polls about implementation challenges'
            ],
            priority: 'high'
          }
        ],
        before_breakdown: {
          hook_score: 75,
          content_score: 69,
          engagement_score: 58,
          platform_fit: 72
        },
        after_breakdown: {
          hook_score: 82,
          content_score: 86,
          engagement_score: 79,
          platform_fit: 88
        },
        status: 'analyzing',
        created_at: '2024-01-16T11:15:00Z'
      }
    ]

    setOptimizations(mockOptimizations)
    setSelectedOptimization(mockOptimizations[0])

    setPanelData({
      active_optimizations: 12,
      total_lift_generated: 287.3,
      success_rate: 89.2,
      avg_implementation_time: '12 minutes',
      trending_optimizations: [
        { type: 'hook', frequency: 34, avg_impact: 14.2 },
        { type: 'visual', frequency: 28, avg_impact: 11.8 },
        { type: 'timing', frequency: 22, avg_impact: 8.5 },
        { type: 'cta', frequency: 16, avg_impact: 9.3 }
      ]
    })
  }, [])

  const handleOptimizeVideo = async (videoTitle: string) => {
    setIsOptimizing(true)
    
    // Simulate AI optimization process
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Generate mock optimization
    const newOptimization: VideoOptimization = {
      id: Math.random().toString(36).substr(2, 9),
      video_title: videoTitle,
      current_viral_probability: Math.random() * 0.3 + 0.5,
      optimized_viral_probability: Math.random() * 0.2 + 0.8,
      optimization_lift: Math.random() * 20 + 10,
      suggestions: [
        {
          id: Math.random().toString(36).substr(2, 9),
          type: 'hook',
          title: 'AI-Generated Hook Optimization',
          description: 'Optimized based on viral pattern analysis',
          current_score: Math.random() * 20 + 60,
          potential_score: Math.random() * 15 + 85,
          impact_estimate: Math.random() * 15 + 5,
          confidence: Math.random() * 0.2 + 0.8,
          difficulty: 'easy',
          implementation_time: '5-10 minutes',
          ai_reasoning: 'Analysis of 10,000+ viral videos shows this pattern increases engagement by 25%.',
          examples: ['Specific optimization example based on content analysis'],
          priority: 'critical'
        }
      ],
      before_breakdown: {
        hook_score: Math.random() * 20 + 60,
        content_score: Math.random() * 20 + 65,
        engagement_score: Math.random() * 20 + 60,
        platform_fit: Math.random() * 20 + 65
      },
      after_breakdown: {
        hook_score: Math.random() * 15 + 85,
        content_score: Math.random() * 15 + 80,
        engagement_score: Math.random() * 15 + 85,
        platform_fit: Math.random() * 15 + 85
      },
      status: 'optimized',
      created_at: new Date().toISOString()
    }

    setOptimizations(prev => [newOptimization, ...prev])
    setSelectedOptimization(newOptimization)
    setIsOptimizing(false)

    if (onOptimizationComplete) {
      onOptimizationComplete(newOptimization)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700'
      case 'high': return 'bg-orange-100 text-orange-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'hard': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (!panelData) {
    return <div className="animate-pulse">Loading optimization engine...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Zap className="h-6 w-6 mr-2 text-yellow-500" />
            AI Optimization Engine
          </h1>
          <p className="text-zinc-400">AI-powered recommendations to maximize viral potential</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => handleOptimizeVideo('New Video Analysis')}
            disabled={isOptimizing}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            {isOptimizing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Run AI Optimization
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI Panel Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{panelData.active_optimizations}</div>
            <div className="text-sm text-gray-600">Active Optimizations</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">+{panelData.total_lift_generated}%</div>
            <div className="text-sm text-gray-600">Total Lift Generated</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{panelData.success_rate}%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{panelData.avg_implementation_time}</div>
            <div className="text-sm text-gray-600">Avg Implementation</div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Optimization List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Recent Optimizations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {optimizations.map((opt) => (
                <div 
                  key={opt.id}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50",
                    selectedOptimization?.id === opt.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                  )}
                  onClick={() => setSelectedOptimization(opt)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm truncate">{opt.video_title}</h4>
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      +{opt.optimization_lift.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>
                      {Math.round(opt.current_viral_probability * 100)}% → {Math.round(opt.optimized_viral_probability * 100)}%
                    </span>
                    <span>{opt.suggestions.length} suggestions</span>
                  </div>
                  
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-green-500 h-1 rounded-full transition-all" 
                        style={{ width: `${opt.optimized_viral_probability * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Optimization View */}
        <div className="lg:col-span-2">
          {selectedOptimization && (
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
                <TabsTrigger value="comparison">Before/After</TabsTrigger>
                <TabsTrigger value="implementation">Implementation</TabsTrigger>
              </TabsList>

              <TabsContent value="suggestions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Lightbulb className="h-5 w-5 mr-2" />
                        {selectedOptimization.video_title}
                      </span>
                      <Badge className="bg-green-100 text-green-700">
                        +{selectedOptimization.optimization_lift.toFixed(1)}% lift
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedOptimization.suggestions.map((suggestion) => (
                      <div key={suggestion.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold flex items-center">
                              {suggestion.type === 'hook' && <Target className="h-4 w-4 mr-2 text-red-500" />}
                              {suggestion.type === 'visual' && <Eye className="h-4 w-4 mr-2 text-blue-500" />}
                              {suggestion.type === 'timing' && <Play className="h-4 w-4 mr-2 text-green-500" />}
                              {suggestion.type === 'cta' && <ArrowRight className="h-4 w-4 mr-2 text-purple-500" />}
                              {suggestion.type === 'structure' && <BarChart3 className="h-4 w-4 mr-2 text-orange-500" />}
                              {suggestion.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-1">
                            <Badge className={getPriorityColor(suggestion.priority)}>
                              {suggestion.priority.toUpperCase()}
                            </Badge>
                            <Badge className={getDifficultyColor(suggestion.difficulty)}>
                              {suggestion.difficulty}
                            </Badge>
                          </div>
                        </div>

                        {/* Impact Metrics */}
                        <div className="grid grid-cols-3 gap-4 mb-3 text-center text-sm">
                          <div>
                            <div className="font-semibold text-blue-600">+{suggestion.impact_estimate}%</div>
                            <div className="text-gray-600">Impact</div>
                          </div>
                          <div>
                            <div className="font-semibold text-green-600">{Math.round(suggestion.confidence * 100)}%</div>
                            <div className="text-gray-600">Confidence</div>
                          </div>
                          <div>
                            <div className="font-semibold text-purple-600">{suggestion.implementation_time}</div>
                            <div className="text-gray-600">Time</div>
                          </div>
                        </div>

                        {/* AI Reasoning */}
                        <div className="bg-blue-50 p-3 rounded-lg mb-3">
                          <h5 className="font-medium text-blue-900 mb-1 flex items-center">
                            <Brain className="h-4 w-4 mr-1" />
                            AI Reasoning
                          </h5>
                          <p className="text-sm text-blue-800">{suggestion.ai_reasoning}</p>
                        </div>

                        {/* Examples */}
                        <div>
                          <h5 className="font-medium mb-2">Implementation Examples:</h5>
                          <ul className="space-y-1">
                            {suggestion.examples.map((example, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <Sparkles className="h-3 w-3 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                                {example}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Button className="w-full mt-3" variant="outline">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Implement Suggestion
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comparison" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      {/* Before */}
                      <div>
                        <h4 className="font-semibold mb-3 text-red-600">Before Optimization</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Viral Probability</span>
                            <span className="font-medium">{Math.round(selectedOptimization.current_viral_probability * 100)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Hook Score</span>
                            <span className="font-medium">{selectedOptimization.before_breakdown.hook_score}/100</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Content Score</span>
                            <span className="font-medium">{selectedOptimization.before_breakdown.content_score}/100</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Engagement Score</span>
                            <span className="font-medium">{selectedOptimization.before_breakdown.engagement_score}/100</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Platform Fit</span>
                            <span className="font-medium">{selectedOptimization.before_breakdown.platform_fit}/100</span>
                          </div>
                        </div>
                      </div>

                      {/* After */}
                      <div>
                        <h4 className="font-semibold mb-3 text-green-600">After Optimization</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Viral Probability</span>
                            <span className="font-medium text-green-600">{Math.round(selectedOptimization.optimized_viral_probability * 100)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Hook Score</span>
                            <span className="font-medium text-green-600">{selectedOptimization.after_breakdown.hook_score}/100</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Content Score</span>
                            <span className="font-medium text-green-600">{selectedOptimization.after_breakdown.content_score}/100</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Engagement Score</span>
                            <span className="font-medium text-green-600">{selectedOptimization.after_breakdown.engagement_score}/100</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Platform Fit</span>
                            <span className="font-medium text-green-600">{selectedOptimization.after_breakdown.platform_fit}/100</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Overall Improvement */}
                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          +{selectedOptimization.optimization_lift.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Overall Viral Probability Increase</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="implementation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Implementation Roadmap</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedOptimization.suggestions
                        .sort((a, b) => {
                          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
                          return priorityOrder[a.priority] - priorityOrder[b.priority]
                        })
                        .map((suggestion, index) => (
                        <div key={suggestion.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                            {index + 1}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{suggestion.title}</h4>
                              <div className="flex items-center space-x-2">
                                <Badge className={getPriorityColor(suggestion.priority)}>
                                  {suggestion.priority}
                                </Badge>
                                <span className="text-sm text-gray-600">{suggestion.implementation_time}</span>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-green-600">
                                Expected: +{suggestion.impact_estimate}% improvement
                              </span>
                              <Button size="sm" variant="outline">
                                Start Implementation
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-2">Implementation Tips:</h5>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Start with critical priority items for maximum impact</li>
                        <li>• Test one optimization at a time to measure effectiveness</li>
                        <li>• Easy difficulty items can be completed quickly</li>
                        <li>• Track performance changes after each implementation</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Trending Optimizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Trending Optimization Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {panelData.trending_optimizations.map((trend, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <div className="text-lg font-bold text-blue-600 capitalize">{trend.type}</div>
                <div className="text-sm text-gray-600">Used {trend.frequency} times</div>
                <div className="text-sm font-medium text-green-600">+{trend.avg_impact}% avg impact</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}