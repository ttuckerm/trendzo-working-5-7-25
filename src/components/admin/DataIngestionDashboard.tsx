"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Download,
  Play,
  Square,
  RefreshCw,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Database,
  TrendingUp,
  Hash,
  User,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface IngestionJob {
  id: string
  type: 'trending' | 'hashtag' | 'user' | 'manual'
  source: 'tiktok' | 'instagram' | 'youtube'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: {
    total: number
    processed: number
    successful: number
    failed: number
  }
  startedAt?: string
  completedAt?: string
  error?: string
  results?: {
    videosCollected: number
    featuresExtracted: number
    predictionsGenerated: number
    duplicatesSkipped: number
  }
}

interface IngestionMetrics {
  totalVideosProcessed: number
  averageProcessingTime: number
  successRate: number
  errorRate: number
  duplicateRate: number
  dataQualityScore: number
}

export function DataIngestionDashboard() {
  const [jobs, setJobs] = useState<IngestionJob[]>([])
  const [metrics, setMetrics] = useState<IngestionMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState('overview')
  
  // Job creation form state
  const [newJobType, setNewJobType] = useState<'trending' | 'hashtag' | 'user'>('trending')
  const [hashtags, setHashtags] = useState('')
  const [usernames, setUsernames] = useState('')
  const [maxVideos, setMaxVideos] = useState('50')
  const [minViews, setMinViews] = useState('10000')

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedTab === 'overview' || selectedTab === 'jobs') {
        fetchJobs()
      }
      if (selectedTab === 'overview' || selectedTab === 'metrics') {
        fetchMetrics()
      }
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [selectedTab])

  // Initial load
  useEffect(() => {
    fetchJobs()
    fetchMetrics()
  }, [])

  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/data-ingestion?endpoint=active_jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    }
  }, [])

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/data-ingestion?endpoint=metrics')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    }
  }, [])

  const startJob = async () => {
    setIsLoading(true)
    try {
      const parameters: any = {
        maxVideos: parseInt(maxVideos),
        minViews: parseInt(minViews)
      }

      if (newJobType === 'hashtag' && hashtags.trim()) {
        parameters.hashtags = hashtags.split(',').map(tag => tag.trim())
      }
      
      if (newJobType === 'user' && usernames.trim()) {
        parameters.usernames = usernames.split(',').map(user => user.trim())
      }

      const response = await fetch('/api/admin/data-ingestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_job',
          type: newJobType,
          source: 'tiktok',
          parameters
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Job started:', data.job)
        await fetchJobs()
        
        // Reset form
        setHashtags('')
        setUsernames('')
        setMaxVideos('50')
        setMinViews('10000')
      } else {
        throw new Error('Failed to start job')
      }
    } catch (error) {
      console.error('❌ Failed to start job:', error)
      alert('Failed to start ingestion job')
    } finally {
      setIsLoading(false)
    }
  }

  const cancelJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/admin/data-ingestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_job',
          jobId
        })
      })

      if (response.ok) {
        console.log('✅ Job cancelled')
        await fetchJobs()
      } else {
        throw new Error('Failed to cancel job')
      }
    } catch (error) {
      console.error('❌ Failed to cancel job:', error)
      alert('Failed to cancel job')
    }
  }

  const getJobIcon = (type: string) => {
    switch (type) {
      case 'trending': return <TrendingUp className="h-4 w-4" />
      case 'hashtag': return <Hash className="h-4 w-4" />
      case 'user': return <User className="h-4 w-4" />
      default: return <Database className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700'
      case 'failed': return 'bg-red-50 text-red-700'
      case 'running': return 'bg-blue-50 text-blue-700'
      default: return 'bg-yellow-50 text-yellow-700'
    }
  }

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return '-'
    const start = new Date(startTime).getTime()
    const end = endTime ? new Date(endTime).getTime() : Date.now()
    const duration = Math.round((end - start) / 1000)
    return `${duration}s`
  }

  const runningJobs = jobs.filter(job => job.status === 'running')
  const completedJobs = jobs.filter(job => job.status === 'completed')
  const failedJobs = jobs.filter(job => job.status === 'failed')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Ingestion Pipeline</h1>
          <p className="text-gray-600">Automated collection and processing of social media content</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {runningJobs.length} active jobs
          </Badge>
          <Button onClick={() => { fetchJobs(); fetchMetrics() }} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Active Jobs</TabsTrigger>
          <TabsTrigger value="start">Start New Job</TabsTrigger>
          <TabsTrigger value="metrics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Running Jobs</p>
                    <p className="text-2xl font-bold text-blue-600">{runningJobs.length}</p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed Today</p>
                    <p className="text-2xl font-bold text-green-600">{completedJobs.length}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Failed Jobs</p>
                    <p className="text-2xl font-bold text-red-600">{failedJobs.length}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {metrics ? `${metrics.successRate.toFixed(1)}%` : '-'}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobs.slice(0, 5).map(job => (
                  <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getJobIcon(job.type)}
                      <div>
                        <p className="font-medium capitalize">{job.type} Ingestion</p>
                        <p className="text-sm text-gray-600">
                          {job.status === 'running' ? 
                            `${job.progress.processed}/${job.progress.total} processed` :
                            `${job.progress.successful} successful, ${job.progress.failed} failed`
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={cn('text-xs', getStatusColor(job.status))}>
                        {getStatusIcon(job.status)}
                        <span className="ml-1 capitalize">{job.status}</span>
                      </Badge>
                      
                      <span className="text-xs text-gray-500">
                        {formatDuration(job.startedAt, job.completedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map(job => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getJobIcon(job.type)}
                        <div>
                          <h4 className="font-medium capitalize">{job.type} Ingestion</h4>
                          <p className="text-sm text-gray-600">Job ID: {job.id}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={cn('', getStatusColor(job.status))}>
                          {getStatusIcon(job.status)}
                          <span className="ml-1 capitalize">{job.status}</span>
                        </Badge>
                        
                        {job.status === 'running' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => cancelJob(job.id)}
                          >
                            <Square className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>

                    {job.status === 'running' && job.progress.total > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{job.progress.processed}/{job.progress.total}</span>
                        </div>
                        <Progress 
                          value={(job.progress.processed / job.progress.total) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Successful:</span>
                        <span className="ml-1 font-medium text-green-600">{job.progress.successful}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Failed:</span>
                        <span className="ml-1 font-medium text-red-600">{job.progress.failed}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-1 font-medium">{formatDuration(job.startedAt, job.completedAt)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Source:</span>
                        <span className="ml-1 font-medium capitalize">{job.source}</span>
                      </div>
                    </div>

                    {job.results && (
                      <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>Videos: {job.results.videosCollected}</div>
                          <div>Features: {job.results.featuresExtracted}</div>
                          <div>Predictions: {job.results.predictionsGenerated}</div>
                          <div>Duplicates: {job.results.duplicatesSkipped}</div>
                        </div>
                      </div>
                    )}

                    {job.error && (
                      <div className="mt-3 p-3 bg-red-50 rounded text-sm text-red-700">
                        <strong>Error:</strong> {job.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="start" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Start New Ingestion Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Job Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['trending', 'hashtag', 'user'] as const).map(type => (
                    <Button
                      key={type}
                      variant={newJobType === type ? 'default' : 'outline'}
                      onClick={() => setNewJobType(type)}
                      className="capitalize"
                    >
                      {getJobIcon(type)}
                      <span className="ml-2">{type}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {newJobType === 'hashtag' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Hashtags (comma-separated)</label>
                  <Input
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="viral, trending, business, tips"
                  />
                </div>
              )}

              {newJobType === 'user' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Usernames (comma-separated)</label>
                  <Input
                    value={usernames}
                    onChange={(e) => setUsernames(e.target.value)}
                    placeholder="user1, user2, user3"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Max Videos</label>
                  <Input
                    type="number"
                    value={maxVideos}
                    onChange={(e) => setMaxVideos(e.target.value)}
                    min="1"
                    max="500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Min Views</label>
                  <Input
                    type="number"
                    value={minViews}
                    onChange={(e) => setMinViews(e.target.value)}
                    min="100"
                  />
                </div>
              </div>

              <Button 
                onClick={startJob} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Start Ingestion Job
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Videos Processed</p>
                    <p className="text-3xl font-bold text-blue-600">{metrics.totalVideosProcessed.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Avg Processing Time</p>
                    <p className="text-3xl font-bold text-green-600">{metrics.averageProcessingTime}s</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-3xl font-bold text-purple-600">{metrics.successRate.toFixed(1)}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Error Rate</p>
                    <p className="text-3xl font-bold text-red-600">{metrics.errorRate.toFixed(1)}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Duplicate Rate</p>
                    <p className="text-3xl font-bold text-yellow-600">{metrics.duplicateRate.toFixed(1)}%</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Data Quality Score</p>
                    <p className="text-3xl font-bold text-orange-600">{metrics.dataQualityScore.toFixed(1)}/100</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}