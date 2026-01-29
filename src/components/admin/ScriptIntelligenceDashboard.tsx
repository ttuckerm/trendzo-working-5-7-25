"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Brain,
  Zap,
  TrendingUp,
  Target,
  Microscope,
  Sparkles,
  BarChart3,
  Eye,
  Lightbulb,
  Cpu,
  Dna,
  Flame,
  Globe,
  Clock,
  Star,
  ArrowUp,
  ArrowDown,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScriptGenome {
  opening_hook_type: string
  emotional_arc: string
  linguistic_features: {
    pronoun_ratio: number
    certainty_words: number
    power_verbs: number
    specificity_score: number
    authority_signals: number
    curiosity_gaps: number
  }
  viral_genes: string[]
  persuasion_techniques: string[]
  cultural_markers: string[]
}

interface ScriptAnalysis {
  script_text: string
  genome: ScriptGenome
  predicted_performance: {
    viral_probability: number
    engagement_rate: number
    completion_rate: number
    predicted_views: number
  }
  virality_indicators: any
  optimization_opportunities: string[]
}

interface ScriptMemory {
  id: string
  script_text: string
  niche: string
  virality_coefficient: number
  performance_metrics: any
  genome_highlights: any
  memory_type: string
  memory_strength: number
  created_at: string
}

interface SingularityMetrics {
  overall_singularity_score: number
  component_scores: {
    prediction_accuracy: number
    pattern_discovery: number
    evolution_prediction: number
    cultural_anticipation: number
    real_time_optimization: number
    cross_module_synthesis: number
  }
  performance_vs_human: {
    script_generation_speed: number
    pattern_recognition_accuracy: number
    trend_prediction_horizon: number
    optimization_improvement: number
  }
}

export function ScriptIntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState('analyze')
  const [isLoading, setIsLoading] = useState(false)
  
  // Analysis state
  const [scriptText, setScriptText] = useState('')
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null)
  
  // Generation state
  const [genNiche, setGenNiche] = useState('business')
  const [genPlatform, setGenPlatform] = useState('tiktok')
  const [genAudience, setGenAudience] = useState('')
  const [generatedScript, setGeneratedScript] = useState<any>(null)
  
  // Memory state
  const [memories, setMemories] = useState<ScriptMemory[]>([])
  const [memoryFilters, setMemoryFilters] = useState({
    niche: '',
    viral_threshold: 0.7
  })
  
  // Intelligence metrics
  const [singularityMetrics, setSingularityMetrics] = useState<SingularityMetrics | null>(null)
  const [winningPatterns, setWinningPatterns] = useState<any>(null)
  const [culturalZeitgeist, setCulturalZeitgeist] = useState<any>(null)

  useEffect(() => {
    // Load initial data
    loadSingularityMetrics()
    loadWinningPatterns()
    loadCulturalZeitgeist()
  }, [])

  const analyzeScript = async () => {
    if (!scriptText.trim()) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/script-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_script',
          script_text: scriptText,
          context: { platform: 'tiktok', niche: 'general' }
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
      } else {
        throw new Error('Analysis failed')
      }
    } catch (error) {
      console.error('Script analysis error:', error)
      alert('Failed to analyze script')
    } finally {
      setIsLoading(false)
    }
  }

  const generateScript = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/script-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_script',
          niche: genNiche,
          platform: genPlatform,
          target_audience: genAudience || 'general',
          viral_target: 0.8
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setGeneratedScript(data.generation)
      } else {
        throw new Error('Generation failed')
      }
    } catch (error) {
      console.error('Script generation error:', error)
      alert('Failed to generate script')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMemories = async () => {
    try {
      const response = await fetch('/api/admin/script-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'query_memory',
          ...memoryFilters,
          limit: 20
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setMemories(data.memories)
      }
    } catch (error) {
      console.error('Memory loading error:', error)
    }
  }

  const loadSingularityMetrics = async () => {
    try {
      const response = await fetch('/api/admin/script-intelligence?endpoint=singularity_metrics')
      if (response.ok) {
        const data = await response.json()
        setSingularityMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Singularity metrics error:', error)
    }
  }

  const loadWinningPatterns = async () => {
    try {
      const response = await fetch('/api/admin/script-intelligence?endpoint=winning_patterns&platform=tiktok')
      if (response.ok) {
        const data = await response.json()
        setWinningPatterns(data.patterns)
      }
    } catch (error) {
      console.error('Winning patterns error:', error)
    }
  }

  const loadCulturalZeitgeist = async () => {
    try {
      const response = await fetch('/api/admin/script-intelligence?endpoint=cultural_zeitgeist')
      if (response.ok) {
        const data = await response.json()
        setCulturalZeitgeist(data.zeitgeist)
      }
    } catch (error) {
      console.error('Cultural zeitgeist error:', error)
    }
  }

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getViralityColor = (score: number): string => {
    if (score >= 0.9) return 'text-green-600 bg-green-50'
    if (score >= 0.7) return 'text-blue-600 bg-blue-50'
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getSingularityLevel = (score: number): { label: string; color: string } => {
    if (score >= 0.95) return { label: 'SINGULARITY', color: 'text-purple-600' }
    if (score >= 0.8) return { label: 'SUPERHUMAN', color: 'text-blue-600' }
    if (score >= 0.6) return { label: 'ADVANCED', color: 'text-green-600' }
    return { label: 'LEARNING', color: 'text-yellow-600' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Brain className="h-7 w-7 mr-2 text-purple-600" />
            Script Intelligence System
          </h1>
          <p className="text-zinc-400">Omniscient script intelligence that learns from every data point</p>
        </div>
        
        {singularityMetrics && (
          <div className="text-right">
            <div className={cn('text-2xl font-bold', getSingularityLevel(singularityMetrics.overall_singularity_score).color)}>
              {getSingularityLevel(singularityMetrics.overall_singularity_score).label}
            </div>
            <div className="text-sm text-gray-600">
              {formatPercentage(singularityMetrics.overall_singularity_score)} to Singularity
            </div>
          </div>
        )}
      </div>

      {/* Singularity Progress */}
      {singularityMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Cpu className="h-5 w-5 mr-2" />
              Singularity Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Progress</span>
                  <span>{formatPercentage(singularityMetrics.overall_singularity_score)}</span>
                </div>
                <Progress 
                  value={singularityMetrics.overall_singularity_score * 100} 
                  className="h-3"
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {Object.entries(singularityMetrics.component_scores).map(([key, value]) => (
                  <div key={key} className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900">{formatPercentage(value as number)}</div>
                    <div className="text-xs text-gray-600 capitalize">{key.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {singularityMetrics.performance_vs_human.script_generation_speed}x
                  </div>
                  <div className="text-xs text-gray-600">Faster Generation</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">
                    {singularityMetrics.performance_vs_human.pattern_recognition_accuracy}x
                  </div>
                  <div className="text-xs text-gray-600">More Accurate</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">
                    {singularityMetrics.performance_vs_human.trend_prediction_horizon}
                  </div>
                  <div className="text-xs text-gray-600">Days Ahead</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-600">
                    +{formatPercentage(singularityMetrics.performance_vs_human.optimization_improvement)}
                  </div>
                  <div className="text-xs text-gray-600">Avg Improvement</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="memory">Memory Bank</TabsTrigger>
          <TabsTrigger value="patterns">Live Patterns</TabsTrigger>
          <TabsTrigger value="zeitgeist">Cultural Intel</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Microscope className="h-5 w-5 mr-2" />
                Script Genome Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Script Text</label>
                <Textarea
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Paste your script here for omniscient analysis..."
                  rows={6}
                />
              </div>
              
              <Button 
                onClick={analyzeScript} 
                disabled={isLoading || !scriptText.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Genome...
                  </>
                ) : (
                  <>
                    <Dna className="h-4 w-4 mr-2" />
                    Analyze Script DNA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {analysis && (
            <div className="space-y-6">
              {/* Performance Prediction */}
              <Card>
                <CardHeader>
                  <CardTitle>Predicted Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatPercentage(analysis.predicted_performance.viral_probability)}
                      </div>
                      <div className="text-xs text-gray-600">Viral Probability</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {(analysis.predicted_performance.predicted_views / 1000).toFixed(0)}K
                      </div>
                      <div className="text-xs text-gray-600">Predicted Views</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatPercentage(analysis.predicted_performance.engagement_rate)}
                      </div>
                      <div className="text-xs text-gray-600">Engagement Rate</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatPercentage(analysis.predicted_performance.completion_rate)}
                      </div>
                      <div className="text-xs text-gray-600">Completion Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Script Genome */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Dna className="h-5 w-5 mr-2" />
                    Script Genome Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Structure Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Hook Type:</span>
                          <Badge variant="outline">{analysis.genome.opening_hook_type.replace(/_/g, ' ')}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Emotional Arc:</span>
                          <Badge variant="outline">{analysis.genome.emotional_arc.replace(/_/g, ' ')}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Linguistic Features</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>You-Focus:</span>
                          <span>{formatPercentage(analysis.genome.linguistic_features.pronoun_ratio)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Certainty Words:</span>
                          <span>{analysis.genome.linguistic_features.certainty_words}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Power Verbs:</span>
                          <span>{analysis.genome.linguistic_features.power_verbs}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Specificity:</span>
                          <span>{formatPercentage(analysis.genome.linguistic_features.specificity_score)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Viral Genes</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.genome.viral_genes.map((gene, index) => (
                        <Badge key={index} className="bg-green-50 text-green-700">
                          {gene.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Persuasion Techniques</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.genome.persuasion_techniques.map((technique, index) => (
                        <Badge key={index} className="bg-blue-50 text-blue-700">
                          {technique.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Optimization Opportunities */}
              {analysis.optimization_opportunities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2" />
                      Optimization Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.optimization_opportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                          <Sparkles className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <span className="text-sm">{opportunity}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Generate Scroll-Stopping Script
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Niche</label>
                  <Select value={genNiche} onValueChange={setGenNiche}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="tech">Technology</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Platform</label>
                  <Select value={genPlatform} onValueChange={setGenPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Target Audience</label>
                  <Input
                    value={genAudience}
                    onChange={(e) => setGenAudience(e.target.value)}
                    placeholder="e.g., entrepreneurs, fitness enthusiasts"
                  />
                </div>
              </div>
              
              <Button 
                onClick={generateScript} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Generating from Omniscient Memory...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Script
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedScript && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Generated Script
                  </span>
                  <Badge className={cn('', getViralityColor(generatedScript.predicted_performance.viral_probability))}>
                    {formatPercentage(generatedScript.predicted_performance.viral_probability)} Viral Probability
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900 leading-relaxed">{generatedScript.script}</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-bold text-blue-600">
                      {formatPercentage(generatedScript.predicted_performance.viral_probability)}
                    </div>
                    <div className="text-xs text-gray-600">Viral Probability</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-bold text-green-600">
                      {formatPercentage(generatedScript.confidence_score)}
                    </div>
                    <div className="text-xs text-gray-600">Confidence</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <div className="font-bold text-purple-600">
                      {(generatedScript.predicted_performance.predicted_views / 1000).toFixed(0)}K
                    </div>
                    <div className="text-xs text-gray-600">Predicted Views</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="font-bold text-orange-600">
                      {formatPercentage(generatedScript.predicted_performance.engagement_rate)}
                    </div>
                    <div className="text-xs text-gray-600">Engagement</div>
                  </div>
                </div>
                
                {generatedScript.optimization_suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Optimization Suggestions</h4>
                    <div className="space-y-2">
                      {generatedScript.optimization_suggestions.map((suggestion: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                          <Sparkles className="h-3 w-3" />
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="memory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                Omniscient Memory Bank
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <Input
                  placeholder="Filter by niche..."
                  value={memoryFilters.niche}
                  onChange={(e) => setMemoryFilters({...memoryFilters, niche: e.target.value})}
                />
                <Button onClick={loadMemories}>
                  <Eye className="h-4 w-4 mr-1" />
                  Query Memory
                </Button>
              </div>
              
              <div className="space-y-3">
                {memories.map((memory) => (
                  <Card key={memory.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{memory.niche}</Badge>
                        <Badge className={cn('text-xs', getViralityColor(memory.virality_coefficient))}>
                          {formatPercentage(memory.virality_coefficient)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {memory.memory_type}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(memory.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">
                      {memory.script_text.length > 200 
                        ? `${memory.script_text.substring(0, 200)}...`
                        : memory.script_text
                      }
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      {memory.genome_highlights.viral_genes?.slice(0, 3).map((gene: string, index: number) => (
                        <Badge key={index} className="text-xs bg-green-50 text-green-600">
                          {gene.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          {winningPatterns && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Flame className="h-5 w-5 mr-2" />
                    Hot Patterns (Real-Time)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {winningPatterns.hot_patterns.map((pattern: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{pattern.pattern_name}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-green-50 text-green-700">
                              {formatPercentage(pattern.current_performance)}
                            </Badge>
                            <ArrowUp className="h-4 w-4 text-green-500" />
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 font-mono bg-gray-50 p-2 rounded">
                          {pattern.pattern}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 text-xs">
                          {pattern.optimal_niches.map((niche: string, i: number) => (
                            <Badge key={i} variant="outline">{niche}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Emerging Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {winningPatterns.emerging_patterns.map((pattern: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 bg-blue-50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{pattern.pattern_name}</h4>
                          <Badge className="bg-blue-50 text-blue-700">
                            {formatPercentage(pattern.early_performance)} early
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 font-mono bg-white p-2 rounded">
                          {pattern.pattern}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="zeitgeist" className="space-y-6">
          {culturalZeitgeist && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Current Cultural Moments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {culturalZeitgeist.current_moments.map((moment: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{moment.moment}</h4>
                          <div className="text-right">
                            <div className="text-sm font-bold text-purple-600">
                              {formatPercentage(moment.intensity)}
                            </div>
                            <div className="text-xs text-gray-500">intensity</div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {moment.impact_on_scripts}
                        </p>
                        
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Duration: {moment.duration_prediction}</span>
                          <span>Affects: {moment.affected_patterns.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-600">
                      <ArrowUp className="h-5 w-5 mr-2" />
                      Emerging Signals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {culturalZeitgeist.emerging_signals.map((signal: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">{signal}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-600">
                      <ArrowDown className="h-5 w-5 mr-2" />
                      Declining Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {culturalZeitgeist.declining_patterns.map((pattern: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-sm">{pattern}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}