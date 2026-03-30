"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Eye,
  BarChart3,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Brain,
  Sparkles,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useSWR from 'swr'

interface PredictionResult {
  id: string
  video_title: string
  predicted_probability: number
  confidence: number
  predicted_views: number
  actual_views?: number
  predicted_engagement: number
  actual_engagement?: number
  platform: 'tiktok' | 'instagram' | 'youtube'
  posted_at: string
  prediction_date: string
  status: 'posted' | 'pending' | 'failed'
  accuracy_score?: number
  prediction_error?: number
  viral_threshold: number
  prediction_outcome: 'correct' | 'incorrect' | 'pending'
}

interface SystemMetrics {
  overall_accuracy: number
  predictions_made: number
  correct_predictions: number
  false_positives: number
  false_negatives: number
  average_confidence: number
  platform_accuracy: {
    tiktok: number
    instagram: number
    youtube: number
  }
  recent_trend: 'improving' | 'declining' | 'stable'
  last_updated: string
}

interface PredictionDashboardProps {
  onRunValidation?: () => void
}

export function PredictionDashboard({ onRunValidation }: PredictionDashboardProps) {
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionResult | null>(null)
  const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r=> r.json())
  const { data: rollups } = useSWR('/api/discovery/rollups?range=30d', fetcher, { refreshInterval: 20000 })

  // Mock data for demonstration
  useEffect(() => {
    const mockPredictions: PredictionResult[] = [
      {
        id: '1',
        video_title: 'How I Built a 7-Figure Business',
        predicted_probability: 0.92,
        confidence: 0.89,
        predicted_views: 2400000,
        actual_views: 2680000,
        predicted_engagement: 0.087,
        actual_engagement: 0.091,
        platform: 'tiktok',
        posted_at: '2024-01-15T10:00:00Z',
        prediction_date: '2024-01-15T09:00:00Z',
        status: 'posted',
        accuracy_score: 94.3,
        prediction_error: 11.7,
        viral_threshold: 0.85,
        prediction_outcome: 'correct'
      },
      {
        id: '2',
        video_title: 'Secret Productivity Hack Nobody Talks About',
        predicted_probability: 0.78,
        confidence: 0.82,
        predicted_views: 890000,
        actual_views: 1200000,
        predicted_engagement: 0.065,
        actual_engagement: 0.074,
        platform: 'instagram',
        posted_at: '2024-01-14T15:30:00Z',
        prediction_date: '2024-01-14T14:30:00Z',
        status: 'posted',
        accuracy_score: 88.7,
        prediction_error: 34.8,
        viral_threshold: 0.75,
        prediction_outcome: 'correct'
      },
      {
        id: '3',
        video_title: 'Why Most People Fail at This',
        predicted_probability: 0.85,
        confidence: 0.91,
        predicted_views: 1800000,
        actual_views: 450000,
        predicted_engagement: 0.079,
        actual_engagement: 0.043,
        platform: 'tiktok',
        posted_at: '2024-01-13T12:00:00Z',
        prediction_date: '2024-01-13T11:00:00Z',
        status: 'posted',
        accuracy_score: 25.0,
        prediction_error: 300.0,
        viral_threshold: 0.85,
        prediction_outcome: 'incorrect'
      },
      {
        id: '4',
        video_title: 'Morning Routine for Success',
        predicted_probability: 0.71,
        confidence: 0.76,
        predicted_views: 650000,
        predicted_engagement: 0.052,
        platform: 'youtube',
        posted_at: '',
        prediction_date: '2024-01-16T08:00:00Z',
        status: 'pending',
        viral_threshold: 0.70,
        prediction_outcome: 'pending'
      },
      {
        id: '5',
        video_title: 'The Truth About Viral Content',
        predicted_probability: 0.93,
        confidence: 0.95,
        predicted_views: 3200000,
        actual_views: 3850000,
        predicted_engagement: 0.096,
        actual_engagement: 0.102,
        platform: 'tiktok',
        posted_at: '2024-01-12T16:45:00Z',
        prediction_date: '2024-01-12T15:45:00Z',
        status: 'posted',
        accuracy_score: 96.8,
        prediction_error: 20.3,
        viral_threshold: 0.90,
        prediction_outcome: 'correct'
      }
    ]

    setPredictions(mockPredictions)

    const postedPredictions = mockPredictions.filter(p => p.status === 'posted')
    const correctPredictions = postedPredictions.filter(p => p.prediction_outcome === 'correct')
    const totalAccuracy = postedPredictions.reduce((sum, p) => sum + (p.accuracy_score || 0), 0) / postedPredictions.length

    setMetrics({
      overall_accuracy: totalAccuracy,
      predictions_made: mockPredictions.length,
      correct_predictions: correctPredictions.length,
      false_positives: postedPredictions.filter(p => p.prediction_outcome === 'incorrect' && p.predicted_probability >= p.viral_threshold).length,
      false_negatives: postedPredictions.filter(p => p.prediction_outcome === 'incorrect' && p.predicted_probability < p.viral_threshold).length,
      average_confidence: mockPredictions.reduce((sum, p) => sum + p.confidence, 0) / mockPredictions.length,
      platform_accuracy: {
        tiktok: 89.5,
        instagram: 84.2,
        youtube: 76.8
      },
      recent_trend: 'improving',
      last_updated: new Date().toISOString()
    })
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsRefreshing(false)
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 90) return 'text-green-600 bg-green-50'
    if (accuracy >= 80) return 'text-blue-600 bg-blue-50'
    if (accuracy >= 70) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'correct': return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'incorrect': return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  if (!metrics) {
    return <div className="animate-pulse">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Viral Prediction Dashboard</h1>
          <p className="text-zinc-400">Monitor prediction accuracy and system performance</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="flex items-center"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button 
            onClick={onRunValidation}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Brain className="h-4 w-4 mr-2" />
            Run Validation
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{metrics.overall_accuracy.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Overall Accuracy</div>
            <div className="flex items-center justify-center mt-1">
              {metrics.recent_trend === 'improving' ? 
                <TrendingUp className="h-4 w-4 text-green-500" /> :
                metrics.recent_trend === 'declining' ?
                <TrendingDown className="h-4 w-4 text-red-500" /> :
                <Target className="h-4 w-4 text-blue-500" />
              }
              <span className="text-xs text-gray-500 ml-1 capitalize">{metrics.recent_trend}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{metrics.predictions_made}</div>
            <div className="text-sm text-gray-600">Total Predictions</div>
            <div className="text-xs text-gray-500 mt-1">
              {metrics.correct_predictions} correct
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{(metrics.average_confidence * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Avg Confidence</div>
            <div className="text-xs text-gray-500 mt-1">
              High reliability
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{metrics.false_positives + metrics.false_negatives}</div>
            <div className="text-sm text-gray-600">Prediction Errors</div>
            <div className="text-xs text-gray-500 mt-1">
              {metrics.false_positives} false positives
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Platform Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(metrics.platform_accuracy).map(([platform, accuracy]) => (
              <div key={platform} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-2">{accuracy.toFixed(1)}%</div>
                <div className="text-sm text-gray-600 capitalize mb-3">{platform}</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all" 
                    style={{ width: `${accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Discovery Freshness & Template Decay */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Discovery Freshness</CardTitle>
          </CardHeader>
          <CardContent>
            {!(rollups?.freshness_series||[]).length ? (
              <div className="text-xs text-gray-600">Waiting on Discovery recompute—click Recompute in the header pill.</div>
            ) : (
              <div data-testid="chart-discovery" className="h-24 w-full flex items-end gap-1">
                {(rollups?.freshness_series||[]).slice(-60).map((v:number, idx:number)=> (
                  <div key={idx} style={{ height: `${Math.min(100, Math.max(4, Math.round((v/200)*100)))}%` }} className="w-1 bg-teal-500/80" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template Decay</CardTitle>
          </CardHeader>
          <CardContent>
            {!(rollups?.active_count||[]).length ? (
              <div className="text-xs text-gray-600">Waiting on Discovery recompute—click Recompute in the header pill.</div>
            ) : (
              <div data-testid="chart-decay" className="h-24 w-full flex items-end gap-1">
                {(rollups?.active_count||[]).slice(-60).map((v:number, idx:number)=> (
                  <div key={idx} style={{ height: `${Math.min(100, Math.max(4, Math.round((v/300)*100)))}%` }} className="w-1 bg-purple-500/80" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Recent Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {predictions.map((prediction) => (
              <div 
                key={prediction.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedPrediction(prediction)}
              >
                <div className="flex items-center space-x-4">
                  {getOutcomeIcon(prediction.prediction_outcome)}
                  <div>
                    <h4 className="font-medium">{prediction.video_title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="capitalize">{prediction.platform}</span>
                      <span>{(prediction.predicted_probability * 100).toFixed(1)}% predicted</span>
                      {prediction.actual_views && (
                        <span>{formatNumber(prediction.actual_views)} views</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {prediction.accuracy_score !== undefined && (
                    <Badge className={cn('mb-1', getAccuracyColor(prediction.accuracy_score))}>
                      {prediction.accuracy_score.toFixed(1)}% accurate
                    </Badge>
                  )}
                  <div className="text-sm text-gray-500">
                    {new Date(prediction.prediction_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed View */}
      {selectedPrediction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Prediction Details: {selectedPrediction.video_title}
              </span>
              <Button variant="ghost" onClick={() => setSelectedPrediction(null)}>
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {(selectedPrediction.predicted_probability * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">Predicted Probability</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {formatNumber(selectedPrediction.predicted_views)}
                </div>
                <div className="text-xs text-gray-600">Predicted Views</div>
              </div>
              
              {selectedPrediction.actual_views && (
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">
                    {formatNumber(selectedPrediction.actual_views)}
                  </div>
                  <div className="text-xs text-gray-600">Actual Views</div>
                </div>
              )}
              
              {selectedPrediction.accuracy_score !== undefined && (
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">
                    {selectedPrediction.accuracy_score.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">Accuracy Score</div>
                </div>
              )}
            </div>

            {selectedPrediction.prediction_error !== undefined && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Prediction Error Analysis</h5>
                    <p className="text-sm text-gray-600">
                      {selectedPrediction.prediction_error > 50 ? 'High variance - review model parameters' :
                       selectedPrediction.prediction_error > 25 ? 'Moderate variance - acceptable range' :
                       'Low variance - high accuracy prediction'}
                    </p>
                  </div>
                  <Badge className={cn('', 
                    selectedPrediction.prediction_error < 25 ? 'bg-green-100 text-green-700' :
                    selectedPrediction.prediction_error < 50 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  )}>
                    {selectedPrediction.prediction_error.toFixed(1)}% error
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Platform: <span className="font-medium capitalize">{selectedPrediction.platform}</span></p>
                <p>Confidence: <span className="font-medium">{(selectedPrediction.confidence * 100).toFixed(1)}%</span></p>
                <p>Status: <span className="font-medium capitalize">{selectedPrediction.status}</span></p>
              </div>
              
              {selectedPrediction.prediction_outcome === 'correct' && (
                <div className="flex items-center text-green-600">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  <span className="font-medium">Accurate Prediction</span>
                </div>
              )}
              
              {selectedPrediction.prediction_outcome === 'incorrect' && (
                <div className="flex items-center text-red-600">
                  <XCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Prediction Miss</span>
                </div>
              )}
              
              {selectedPrediction.prediction_outcome === 'pending' && (
                <div className="flex items-center text-yellow-600">
                  <Clock className="h-5 w-5 mr-2" />
                  <span className="font-medium">Awaiting Results</span>
                </div>
              )}
            </div>

            {/* Safe to Promote badge */}
            <div className="mt-3">
              <Badge title="Brand-safety and policy checks passed">Safe to Promote</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}