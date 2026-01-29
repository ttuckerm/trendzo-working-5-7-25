"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ViralVideoGallery } from '@/components/value-template-editor/ViralVideoGallery'
import { DynamicWorkspace } from '@/components/value-template-editor/DynamicWorkspace'
import { PhonePreview3D } from '@/components/value-template-editor/PhonePreview3D'
import { ViralScoreDisplay } from '@/components/value-template-editor/ViralScoreDisplay'
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  Play,
  Zap,
  Eye,
  Heart,
  MessageCircle,
  Share2
} from 'lucide-react'

interface ViralVideo {
  id: string
  title: string
  creator_name: string
  thumbnail_url: string
  view_count: number
  viral_score: number
  platform: 'tiktok' | 'instagram' | 'youtube'
  duration_seconds: number
}

interface WorkspaceConfig {
  workspaceId: string
  suggestedHooks: string[]
  timingGuidance: {
    optimal_duration: number
    hook_timing_seconds: number
  }
  scriptGuidance: {
    tone: string
    style_hints: string[]
    pattern_suggestions: string[]
  }
}

interface ViralPrediction {
  viral_score: number
  confidence: number
  predicted_views: number
  estimated_engagement_rate: number
  suggestions: string[]
}

export default function ValueTemplateEditorPage() {
  // State management
  const [selectedVideo, setSelectedVideo] = useState<ViralVideo | null>(null)
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig | null>(null)
  const [userContent, setUserContent] = useState({
    script: '',
    style: '',
    hook: ''
  })
  const [viralPrediction, setViralPrediction] = useState<ViralPrediction | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Handle viral video selection
  const handleVideoSelection = async (video: ViralVideo) => {
    setSelectedVideo(video)
    setIsLoading(true)
    
    try {
      // Fetch workspace configuration for selected video
      const response = await fetch(`/api/value-template-editor/workspace-config?video_id=${video.id}`)
      const config = await response.json()
      
      if (config.success) {
        setWorkspaceConfig(config.data)
        // Reset user content when changing videos
        setUserContent({
          script: '',
          style: '',
          hook: ''
        })
        setViralPrediction(null)
      }
    } catch (error) {
      console.error('Failed to load workspace configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle content changes and real-time prediction
  const handleContentChange = async (content: typeof userContent) => {
    setUserContent(content)
    
    if (!selectedVideo || !workspaceConfig) return
    
    // Debounced viral prediction update
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/value-template-editor/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: selectedVideo.id,
          user_content: content,
          workspace_context: workspaceConfig.workspaceId
        })
      })
      
      const prediction = await response.json()
      if (prediction.success) {
        setViralPrediction(prediction.data)
      }
    } catch (error) {
      console.error('Failed to get viral prediction:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  🎯 Value Template Editor
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Create viral content inspired by proven success patterns
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                91.3% Accuracy
              </Badge>
              <Badge variant="outline" className="text-sm">
                <Target className="h-4 w-4 mr-1" />
                Phase 3.2 Active
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Viral Video Gallery */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="h-5 w-5 mr-2 text-purple-600" />
                  🎬 Viral Success Gallery
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select a viral video to inspire your content creation
                </p>
              </CardHeader>
              <CardContent>
                <ViralVideoGallery 
                  onVideoSelect={handleVideoSelection}
                  selectedVideo={selectedVideo}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </div>

          {/* Center Column: 3D Phone Preview & Viral Score */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              
              {/* Viral Score Display */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                    Viral Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ViralScoreDisplay 
                    prediction={viralPrediction}
                    isAnalyzing={isAnalyzing}
                    selectedVideo={selectedVideo}
                  />
                </CardContent>
              </Card>

              {/* 3D Phone Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    📱 Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PhonePreview3D 
                    userContent={userContent}
                    selectedVideo={selectedVideo}
                    viralPrediction={viralPrediction}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Dynamic Workspace */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
                  🎭 Dynamic Workspace
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedVideo 
                    ? `Editing style inspired by ${selectedVideo.creator_name}'s viral video`
                    : 'Select a viral video to begin creating'
                  }
                </p>
              </CardHeader>
              <CardContent>
                <DynamicWorkspace
                  selectedVideo={selectedVideo}
                  workspaceConfig={workspaceConfig}
                  userContent={userContent}
                  onContentChange={handleContentChange}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Success Metrics Footer */}
        {viralPrediction && (
          <div className="mt-8">
            <Card>
              <CardContent className="py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Eye className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="text-2xl font-bold text-blue-600">
                        {viralPrediction.predicted_views.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Predicted Views</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Heart className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-2xl font-bold text-red-600">
                        {(viralPrediction.estimated_engagement_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Engagement Rate</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-2xl font-bold text-green-600">
                        {viralPrediction.viral_score}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Viral Score</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="h-5 w-5 text-purple-500 mr-2" />
                      <span className="text-2xl font-bold text-purple-600">
                        {viralPrediction.confidence}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Confidence</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 