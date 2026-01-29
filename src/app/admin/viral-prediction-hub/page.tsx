/**
 * Viral Prediction Hub - Complete Integration Dashboard
 * 
 * Comprehensive interface for the entire viral prediction ecosystem
 * including Script Intelligence, DNA Sequencing, Real-time Optimization,
 * and all omniscient AI systems.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Brain, 
  Dna,
  Zap,
  BarChart3,
  TestTube,
  Settings,
  Activity,
  TrendingUp,
  Users,
  Eye,
  Target,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Network,
  Cpu,
  Play,
  Pause,
  RotateCcw,
  Download
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

interface SystemStatus {
  system_name: string
  status: 'online' | 'offline' | 'degraded'
  response_time: number
  accuracy: number
  last_update: string
}

interface PredictionResult {
  prediction_id: string
  viral_probability: number
  viral_score: number
  confidence: number
  platform: string
  niche: string
  script_text: string
  timestamp: string
  enhancement_applied: boolean
}

interface OmniscienceMetrics {
  omniscience_level: number
  total_knowledge_records: number
  learning_velocity: number
  cross_correlations: number
  predictive_accuracy: number
}

// Pack 1/2 types for UI
interface AttributeScore {
  attribute: string
  score: number
  evidence: string
}

interface IdeaLegos {
  lego_1: boolean
  lego_2: boolean
  lego_3: boolean
  lego_4: boolean
  lego_5: boolean
  lego_6: boolean
  lego_7: boolean
  notes: string
}

interface EditChange {
  priority: number
  what_to_change: string
  how_to_change: string
  example: string
  estimated_lift: number
  confidence: number
}

interface PackResult {
  unified_grading?: {
    attribute_scores: AttributeScore[]
    idea_legos: IdeaLegos
    hook: {
      type: string
      clarity_score: number
      evidence: string
    }
    pacing: { score: number; evidence: string }
    clarity: { score: number; evidence: string }
    novelty: { score: number; evidence: string }
    grader_confidence: number
  }
  editing_suggestions?: {
    pack: string
    predicted_before: number
    predicted_after_estimate: number
    changes: EditChange[]
    notes: string
  }
}

export default function ViralPredictionHubPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [systemStatuses, setSystemStatuses] = useState<SystemStatus[]>([])
  const [omniscienceMetrics, setOmniscienceMetrics] = useState<OmniscienceMetrics | null>(null)
  const [recentPredictions, setRecentPredictions] = useState<PredictionResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [scriptText, setScriptText] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('tiktok')
  const [selectedNiche, setSelectedNiche] = useState('business')
  // Pack 1/2 results state
  const [packResult, setPackResult] = useState<PackResult | null>(null)
  const [latestDPS, setLatestDPS] = useState<number | null>(null)

  useEffect(() => {
    fetchSystemOverview()
  }, [])

  const fetchSystemOverview = async () => {
    setIsLoading(true)
    try {
      // Fetch system statuses
      const systemsResponse = await fetch('/api/admin/viral-prediction-hub?action=system_status')
      if (systemsResponse.ok) {
        const systemsData = await systemsResponse.json()
        setSystemStatuses(systemsData.data || [])
      }

      // Fetch omniscience metrics
      const omniscienceResponse = await fetch('/api/admin/viral-prediction-hub?action=omniscience_status')
      if (omniscienceResponse.ok) {
        const omniscienceData = await omniscienceResponse.json()
        setOmniscienceMetrics(omniscienceData.data || null)
      }

      // Fetch recent predictions
      const predictionsResponse = await fetch('/api/admin/viral-prediction-hub?action=recent_predictions')
      if (predictionsResponse.ok) {
        const predictionsData = await predictionsResponse.json()
        setRecentPredictions(predictionsData.data || [])
      }
    } catch (error) {
      console.error('Error fetching system overview:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunPrediction = async () => {
    if (!scriptText.trim()) return

    setIsLoading(true)
    setPackResult(null)
    setLatestDPS(null)

    try {
      // Use canonical /api/predict endpoint for Pack 1/2 integration
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: scriptText,
          niche: selectedNiche,
          goal: 'viral_content'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Store Pack 1/2 results
          setPackResult({
            unified_grading: data.unified_grading,
            editing_suggestions: data.editing_suggestions
          })
          setLatestDPS(data.prediction?.final_dps_prediction || null)

          // Add to recent predictions (legacy format)
          const newPrediction: PredictionResult = {
            prediction_id: data.run_id,
            viral_probability: (data.prediction?.final_dps_prediction || 0) / 100,
            viral_score: data.prediction?.final_dps_prediction || 0,
            confidence: data.prediction?.confidence || 0,
            platform: selectedPlatform,
            niche: selectedNiche,
            script_text: scriptText.substring(0, 100) + '...',
            timestamp: new Date().toISOString(),
            enhancement_applied: false
          }
          setRecentPredictions(prev => [newPrediction, ...prev.slice(0, 9)])
        }
      }
    } catch (error) {
      console.error('Error running prediction:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-50'
      case 'degraded': return 'text-yellow-600 bg-yellow-50'
      case 'offline': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4" />
      case 'degraded': return <AlertCircle className="h-4 w-4" />
      case 'offline': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Viral Prediction Hub</h1>
          <p className="text-muted-foreground">
            Complete AI-powered viral prediction ecosystem with omniscient intelligence
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchSystemOverview} disabled={isLoading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Omniscience Level Indicator */}
      {omniscienceMetrics && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              System Omniscience Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Intelligence</span>
              <span className="text-2xl font-bold text-purple-600">
                {(omniscienceMetrics.omniscience_level * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={omniscienceMetrics.omniscience_level * 100} 
              className="h-2 mb-4"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Knowledge Records</span>
                <div className="font-medium">{omniscienceMetrics.total_knowledge_records.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Learning Velocity</span>
                <div className="font-medium">{(omniscienceMetrics.learning_velocity * 100).toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-muted-foreground">Cross-Correlations</span>
                <div className="font-medium">{omniscienceMetrics.cross_correlations.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Predictive Accuracy</span>
                <div className="font-medium">{(omniscienceMetrics.predictive_accuracy * 100).toFixed(1)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prediction">Live Prediction</TabsTrigger>
          <TabsTrigger value="systems">AI Systems</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Systems</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatuses.filter(s => s.status === 'online').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {systemStatuses.length} systems online
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatuses.length > 0 
                    ? Math.round(systemStatuses.reduce((sum, s) => sum + s.response_time, 0) / systemStatuses.length)
                    : 0}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  across all systems
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemStatuses.length > 0 
                    ? (systemStatuses.reduce((sum, s) => sum + s.accuracy, 0) / systemStatuses.length * 100).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  prediction accuracy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Predictions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentPredictions.length}</div>
                <p className="text-xs text-muted-foreground">
                  last 24 hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Status Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {systemStatuses.map((system) => (
              <Card key={system.system_name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{system.system_name}</CardTitle>
                  <Badge className={getStatusColor(system.status)}>
                    {getStatusIcon(system.status)}
                    <span className="ml-1 capitalize">{system.status}</span>
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-lg font-semibold">{(system.accuracy * 100).toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{system.response_time}ms</div>
                      <p className="text-xs text-muted-foreground">Response</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Predictions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Predictions</CardTitle>
              <CardDescription>Latest viral prediction results from the AI systems</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPredictions.slice(0, 5).map((prediction) => (
                  <div key={prediction.prediction_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium truncate max-w-md">{prediction.script_text}</div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span>{prediction.platform}</span>
                        <span>•</span>
                        <span>{prediction.niche}</span>
                        <span>•</span>
                        <span>{new Date(prediction.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {(prediction.viral_probability * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Viral Prob</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {prediction.viral_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      {prediction.enhancement_applied && (
                        <Badge variant="secondary">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Enhanced
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Prediction Tab */}
        <TabsContent value="prediction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Viral Prediction</CardTitle>
              <CardDescription>
                Test script content against our complete AI prediction ecosystem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="niche">Niche</Label>
                  <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="script">Script Content</Label>
                <Textarea
                  id="script"
                  placeholder="Enter your script content here..."
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <Button
                onClick={handleRunPrediction}
                disabled={isLoading || !scriptText.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Cpu className="h-4 w-4 mr-2 animate-spin" />
                    Running AI Analysis...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Viral Prediction
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Pack 1/2 Results Display */}
          {packResult && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Pack 1: Unified Grading Rubric */}
              {packResult.unified_grading && (
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-blue-700">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Pack 1: Unified Grading Rubric
                    </CardTitle>
                    <CardDescription>
                      9 Attribute Scores • 7 Idea Legos • Hook Analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* DPS Score */}
                    {latestDPS !== null && (
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-700">{latestDPS.toFixed(1)}</div>
                        <div className="text-sm text-muted-foreground">Predicted DPS</div>
                      </div>
                    )}

                    {/* Attribute Scores */}
                    <div>
                      <h4 className="font-medium mb-2">Attribute Scores</h4>
                      <div className="space-y-2">
                        {packResult.unified_grading.attribute_scores?.map((attr: AttributeScore) => (
                          <div key={attr.attribute} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{attr.attribute.replace(/_/g, ' ')}</span>
                            <div className="flex items-center">
                              <Progress value={attr.score * 10} className="w-20 h-2 mr-2" />
                              <span className="text-sm font-medium w-6">{attr.score}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Idea Legos */}
                    <div>
                      <h4 className="font-medium mb-2">Idea Legos</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                          const key = `lego_${num}` as keyof IdeaLegos
                          const present = packResult.unified_grading?.idea_legos?.[key]
                          return (
                            <div key={num} className={`p-2 rounded text-center text-xs ${present ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                              {present ? <CheckCircle className="h-4 w-4 mx-auto" /> : <AlertCircle className="h-4 w-4 mx-auto" />}
                              <div>Lego {num}</div>
                            </div>
                          )
                        })}
                      </div>
                      {packResult.unified_grading.idea_legos?.notes && (
                        <p className="text-xs text-muted-foreground mt-2">{packResult.unified_grading.idea_legos.notes}</p>
                      )}
                    </div>

                    <Separator />

                    {/* Hook Analysis */}
                    <div>
                      <h4 className="font-medium mb-2">Hook Analysis</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <Badge variant="outline" className="ml-2">{packResult.unified_grading.hook?.type}</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Clarity:</span>
                          <span className="ml-2 font-medium">{packResult.unified_grading.hook?.clarity_score}/10</span>
                        </div>
                      </div>
                    </div>

                    {/* Dimension Scores */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="font-bold">{packResult.unified_grading.pacing?.score || '-'}</div>
                        <div className="text-xs text-muted-foreground">Pacing</div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="font-bold">{packResult.unified_grading.clarity?.score || '-'}</div>
                        <div className="text-xs text-muted-foreground">Clarity</div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="font-bold">{packResult.unified_grading.novelty?.score || '-'}</div>
                        <div className="text-xs text-muted-foreground">Novelty</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pack 2: Editing Coach */}
              {packResult.editing_suggestions && (
                <Card className="border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-purple-700">
                      <Sparkles className="h-5 w-5 mr-2" />
                      Pack 2: Editing Coach
                    </CardTitle>
                    <CardDescription>
                      Top 3 Improvements • Estimated Lift
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Lift Summary */}
                    <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                      <div>
                        <div className="text-sm text-muted-foreground">Current</div>
                        <div className="text-xl font-bold">{packResult.editing_suggestions.predicted_before?.toFixed(1)}</div>
                      </div>
                      <TrendingUp className="h-6 w-6 text-purple-500" />
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Potential</div>
                        <div className="text-xl font-bold text-purple-700">
                          {packResult.editing_suggestions.predicted_after_estimate?.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div className="space-y-3">
                      {packResult.editing_suggestions.changes?.map((change: EditChange, idx: number) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="bg-purple-50">
                              #{change.priority} Priority
                            </Badge>
                            <span className="text-sm font-medium text-green-600">
                              +{change.estimated_lift?.toFixed(1)} DPS
                            </span>
                          </div>
                          <h5 className="font-medium">{change.what_to_change}</h5>
                          <p className="text-sm text-muted-foreground mt-1">{change.how_to_change}</p>
                          {change.example && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm italic">
                              "{change.example}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Coach Notes */}
                    {packResult.editing_suggestions.notes && (
                      <div className="p-3 bg-yellow-50 rounded-lg text-sm">
                        <strong>Coach Notes:</strong> {packResult.editing_suggestions.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Other tabs would be implemented similarly */}
        <TabsContent value="systems">
          <Card>
            <CardHeader>
              <CardTitle>AI Systems Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>AI Systems management interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle>Validation System</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Validation system interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>System Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p>System monitoring interface coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}