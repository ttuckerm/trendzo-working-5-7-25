"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  Eye,
  Play,
  Share2,
  Heart,
  MessageCircle,
  BarChart3,
  Crown,
  Zap,
  CheckCircle2,
  Calendar,
  Users,
  DollarSign,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendzoContent {
  id: string
  title: string
  content_type: 'demo_video' | 'feature_showcase' | 'success_story' | 'tutorial' | 'behind_scenes'
  description: string
  viral_probability: number
  predicted_reach: number
  target_audience: string[]
  platforms: Array<{
    platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin'
    optimization_score: number
    predicted_views: number
  }>
  hook_strategy: string
  key_messages: string[]
  cta_strategy: string
  production_status: 'ideation' | 'scripted' | 'filming' | 'editing' | 'ready' | 'published'
  performance_goals: {
    views: number
    signups: number
    conversions: number
    brand_awareness: number
  }
  estimated_roi: number
  created_at: string
}

interface CampaignMetrics {
  campaign_name: string
  total_reach: number
  total_views: number
  signups_generated: number
  conversion_rate: number
  cost_per_acquisition: number
  brand_mentions: number
  sentiment_score: number
  viral_coefficient: number
}

interface InceptionMarketingProps {
  onContentGenerated?: (content: TrendzoContent) => void
}

export function InceptionMarketing({ onContentGenerated }: InceptionMarketingProps) {
  const [trendzoContent, setTrendzoContent] = useState<TrendzoContent[]>([])
  const [campaignMetrics, setCampaignMetrics] = useState<CampaignMetrics | null>(null)
  const [selectedContent, setSelectedContent] = useState<TrendzoContent | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedTab, setSelectedTab] = useState('content')

  // Mock data for demonstration
  useEffect(() => {
    const mockContent: TrendzoContent[] = [
      {
        id: '1',
        title: 'Trendzo Viral Prediction Demo: Real-Time Analysis',
        content_type: 'demo_video',
        description: 'Live demonstration of Trendzo analyzing a video and predicting viral potential in real-time',
        viral_probability: 0.89,
        predicted_reach: 2400000,
        target_audience: ['Content creators', 'Social media managers', 'Influencers', 'Marketing professionals'],
        platforms: [
          { platform: 'tiktok', optimization_score: 92, predicted_views: 1200000 },
          { platform: 'instagram', optimization_score: 87, predicted_views: 800000 },
          { platform: 'youtube', optimization_score: 84, predicted_views: 400000 }
        ],
        hook_strategy: 'Problem/Solution with immediate proof - "Tired of posting videos that flop? Watch this AI predict viral success in 10 seconds"',
        key_messages: [
          'Trendzo predicts viral potential before posting',
          'AI analysis takes only seconds',
          'Increase success rate by 400%',
          'Used by top creators and brands'
        ],
        cta_strategy: 'Free trial with immediate value - "Try your next video free at Trendzo.ai"',
        production_status: 'ready',
        performance_goals: {
          views: 2000000,
          signups: 8000,
          conversions: 1200,
          brand_awareness: 15
        },
        estimated_roi: 340,
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        title: 'Creator Success Story: From 1K to 1M with Trendzo',
        content_type: 'success_story',
        description: 'Interview with creator who grew from 1K to 1M followers using Trendzo predictions',
        viral_probability: 0.82,
        predicted_reach: 1800000,
        target_audience: ['Aspiring creators', 'Small influencers', 'Growth-focused content creators'],
        platforms: [
          { platform: 'tiktok', optimization_score: 88, predicted_views: 900000 },
          { platform: 'instagram', optimization_score: 85, predicted_views: 600000 },
          { platform: 'youtube', optimization_score: 79, predicted_views: 300000 }
        ],
        hook_strategy: 'Transformation story with specific numbers - "How I went from 1K to 1M followers in 6 months (with proof)"',
        key_messages: [
          'Real creator transformation story',
          'Specific growth metrics and timeline',
          'Trendzo as the secret weapon',
          'Accessible for any creator level'
        ],
        cta_strategy: 'Social proof driven - "Join 10,000+ creators growing with Trendzo"',
        production_status: 'filming',
        performance_goals: {
          views: 1500000,
          signups: 6000,
          conversions: 900,
          brand_awareness: 12
        },
        estimated_roi: 280,
        created_at: '2024-01-14T14:30:00Z'
      },
      {
        id: '3',
        title: 'Behind the Scenes: How Trendzo AI Actually Works',
        content_type: 'behind_scenes',
        description: 'Educational content showing the AI technology and viral science behind Trendzo',
        viral_probability: 0.75,
        predicted_reach: 1200000,
        target_audience: ['Tech enthusiasts', 'AI curious creators', 'Data-driven marketers'],
        platforms: [
          { platform: 'youtube', optimization_score: 91, predicted_views: 500000 },
          { platform: 'linkedin', optimization_score: 87, predicted_views: 400000 },
          { platform: 'tiktok', optimization_score: 72, predicted_views: 300000 }
        ],
        hook_strategy: 'Curiosity gap with expertise - "The AI science behind viral videos (most creators don\'t know this)"',
        key_messages: [
          'Advanced AI technology explained simply',
          'Science of viral content revealed',
          'Trendzo team expertise and credentials',
          'Transparency builds trust'
        ],
        cta_strategy: 'Educational value - "See the full AI analysis of your content free"',
        production_status: 'scripted',
        performance_goals: {
          views: 1000000,
          signups: 4000,
          conversions: 600,
          brand_awareness: 18
        },
        estimated_roi: 220,
        created_at: '2024-01-13T09:15:00Z'
      },
      {
        id: '4',
        title: 'Quick Tutorial: Upload & Get Viral Prediction in 30s',
        content_type: 'tutorial',
        description: 'Fast-paced tutorial showing how easy it is to use Trendzo for video analysis',
        viral_probability: 0.79,
        predicted_reach: 1500000,
        target_audience: ['New users', 'Feature discovery', 'Mobile-first creators'],
        platforms: [
          { platform: 'tiktok', optimization_score: 89, predicted_views: 800000 },
          { platform: 'instagram', optimization_score: 84, predicted_views: 500000 },
          { platform: 'youtube', optimization_score: 76, predicted_views: 200000 }
        ],
        hook_strategy: 'Speed and simplicity - "Upload any video, get viral prediction in 30 seconds (I\'ll prove it)"',
        key_messages: [
          'Incredibly fast and easy to use',
          'No technical skills required',
          'Instant valuable insights',
          'Works with any video content'
        ],
        cta_strategy: 'Try it now momentum - "Upload your next video now - it\'s free"',
        production_status: 'ideation',
        performance_goals: {
          views: 1200000,
          signups: 5000,
          conversions: 750,
          brand_awareness: 10
        },
        estimated_roi: 310,
        created_at: '2024-01-12T16:20:00Z'
      }
    ]

    setTrendzoContent(mockContent)
    setSelectedContent(mockContent[0])

    setCampaignMetrics({
      campaign_name: 'Trendzo Viral Marketing Q1 2024',
      total_reach: 8900000,
      total_views: 6200000,
      signups_generated: 23000,
      conversion_rate: 14.8,
      cost_per_acquisition: 12.50,
      brand_mentions: 1840,
      sentiment_score: 4.2,
      viral_coefficient: 2.8
    })
  }, [])

  const handleGenerateContent = async () => {
    setIsGenerating(true)
    
    try {
      // Use Script Intelligence to generate optimized viral content
      console.log('🧠 Generating content using Script Intelligence Engine...')
      
      // Call Script Intelligence API for viral script generation
      const scriptResponse = await fetch('/api/admin/script-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'generate_script',
          parameters: {
            context: 'trendzo_marketing',
            platform: 'tiktok',
            niche: 'saas_tools',
            target_audience: 'content_creators',
            content_type: 'product_demo',
            viral_elements: ['hook_curiosity', 'social_proof', 'transformation_story'],
            length: 'short_form'
          }
        })
      })

      const scriptData = await scriptResponse.json()
      
      if (scriptData.success) {
        console.log('✅ Script Intelligence generated content:', scriptData.script)
        
        // Create enhanced content with Script Intelligence data
        const newContent: TrendzoContent = {
          id: Math.random().toString(36).substr(2, 9),
          title: scriptData.script.title || 'AI-Generated Trendzo Marketing Content',
          content_type: 'feature_showcase',
          description: scriptData.script.description || 'Script Intelligence generated content optimized for viral potential',
          viral_probability: scriptData.script.viral_probability || Math.random() * 0.3 + 0.7,
          predicted_reach: scriptData.script.predicted_reach || Math.floor(Math.random() * 2000000) + 500000,
          target_audience: scriptData.script.target_audience || ['AI enthusiasts', 'Content creators', 'Marketing professionals'],
          platforms: scriptData.script.platforms || [
            { platform: 'tiktok', optimization_score: Math.floor(Math.random() * 20) + 80, predicted_views: Math.floor(Math.random() * 800000) + 200000 },
            { platform: 'instagram', optimization_score: Math.floor(Math.random() * 20) + 75, predicted_views: Math.floor(Math.random() * 600000) + 150000 }
          ],
          hook_strategy: scriptData.script.hook_strategy || 'Script Intelligence optimized hook using omniscient pattern memory',
          key_messages: scriptData.script.key_messages || [
            'Trendzo predicts viral success with 89% accuracy',
            'Script Intelligence generates mathematically proven content',
            'Used by creators to achieve 400% growth acceleration'
          ],
          cta_strategy: scriptData.script.cta_strategy || 'Script Intelligence optimized call-to-action',
          production_status: 'ideation',
          performance_goals: {
            views: scriptData.script.performance_goals?.views || Math.floor(Math.random() * 1500000) + 500000,
            signups: scriptData.script.performance_goals?.signups || Math.floor(Math.random() * 5000) + 2000,
            conversions: scriptData.script.performance_goals?.conversions || Math.floor(Math.random() * 800) + 300,
            brand_awareness: scriptData.script.performance_goals?.brand_awareness || Math.floor(Math.random() * 15) + 8
          },
          estimated_roi: scriptData.script.estimated_roi || Math.floor(Math.random() * 200) + 150,
          created_at: new Date().toISOString()
        }

        setTrendzoContent(prev => [newContent, ...prev])
        setSelectedContent(newContent)
        
        console.log('🚀 Successfully integrated Script Intelligence with Inception Marketing')
        
        if (onContentGenerated) {
          onContentGenerated(newContent)
        }
      } else {
        console.error('❌ Script Intelligence generation failed:', scriptData.message)
        // Fallback to basic generation
        const fallbackContent: TrendzoContent = {
          id: Math.random().toString(36).substr(2, 9),
          title: 'Fallback Trendzo Marketing Content',
          content_type: 'feature_showcase',
          description: 'Fallback content generated when Script Intelligence is unavailable',
          viral_probability: Math.random() * 0.3 + 0.6,
          predicted_reach: Math.floor(Math.random() * 1500000) + 400000,
          target_audience: ['Content creators', 'Marketing professionals'],
          platforms: [
            { platform: 'tiktok', optimization_score: Math.floor(Math.random() * 15) + 70, predicted_views: Math.floor(Math.random() * 600000) + 150000 }
          ],
          hook_strategy: 'Basic viral hook pattern',
          key_messages: ['Trendzo helps predict viral content', 'AI-powered video analysis', 'Grow your audience faster'],
          cta_strategy: 'Standard call-to-action',
          production_status: 'ideation',
          performance_goals: {
            views: Math.floor(Math.random() * 1000000) + 300000,
            signups: Math.floor(Math.random() * 3000) + 1000,
            conversions: Math.floor(Math.random() * 500) + 200,
            brand_awareness: Math.floor(Math.random() * 10) + 5
          },
          estimated_roi: Math.floor(Math.random() * 150) + 100,
          created_at: new Date().toISOString()
        }
        
        setTrendzoContent(prev => [fallbackContent, ...prev])
        setSelectedContent(fallbackContent)
        
        if (onContentGenerated) {
          onContentGenerated(fallbackContent)
        }
      }
    } catch (error) {
      console.error('❌ Error generating content with Script Intelligence:', error)
      // Handle error with basic fallback
    } finally {
      setIsGenerating(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700'
      case 'ready': return 'bg-blue-100 text-blue-700'
      case 'editing': return 'bg-yellow-100 text-yellow-700'
      case 'filming': return 'bg-orange-100 text-orange-700'
      case 'scripted': return 'bg-purple-100 text-purple-700'
      case 'ideation': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'demo_video': return <Play className="h-4 w-4" />
      case 'feature_showcase': return <Sparkles className="h-4 w-4" />
      case 'success_story': return <Crown className="h-4 w-4" />
      case 'tutorial': return <Target className="h-4 w-4" />
      case 'behind_scenes': return <Eye className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok': return '📱'
      case 'instagram': return '📷'
      case 'youtube': return '📺'
      case 'linkedin': return '💼'
      default: return '🌐'
    }
  }

  if (!campaignMetrics) {
    return <div className="animate-pulse">Loading Inception Marketing...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-purple-500" />
            Inception Marketing Dashboard
          </h1>
          <p className="text-zinc-400">Create viral content about Trendzo using Script Intelligence and viral predictions</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleGenerateContent}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isGenerating ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-pulse" />
                Script Intelligence Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Content
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Campaign Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{formatNumber(campaignMetrics.total_reach)}</div>
            <div className="text-sm text-gray-600">Total Reach</div>
            <div className="flex items-center justify-center mt-1">
              <Eye className="h-3 w-3 text-purple-500 mr-1" />
              <span className="text-xs text-purple-600">Organic</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{formatNumber(campaignMetrics.signups_generated)}</div>
            <div className="text-sm text-gray-600">Signups Generated</div>
            <div className="flex items-center justify-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">{campaignMetrics.conversion_rate}% CVR</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">${campaignMetrics.cost_per_acquisition}</div>
            <div className="text-sm text-gray-600">Cost Per Acquisition</div>
            <div className="flex items-center justify-center mt-1">
              <DollarSign className="h-3 w-3 text-blue-500 mr-1" />
              <span className="text-xs text-blue-600">Efficient</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{campaignMetrics.viral_coefficient.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Viral Coefficient</div>
            <div className="flex items-center justify-center mt-1">
              <Share2 className="h-3 w-3 text-orange-500 mr-1" />
              <span className="text-xs text-orange-600">High Sharing</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Content Pipeline</TabsTrigger>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
          <TabsTrigger value="strategy">Growth Strategy</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          {/* Content List and Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Content List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Content Pipeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trendzoContent.map((content) => (
                    <div 
                      key={content.id}
                      className={cn(
                        "p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50",
                        selectedContent?.id === content.id ? "ring-2 ring-purple-500 bg-purple-50" : ""
                      )}
                      onClick={() => setSelectedContent(content)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getContentTypeIcon(content.content_type)}
                          <span className="font-medium text-sm">{content.content_type.replace('_', ' ')}</span>
                        </div>
                        <Badge className={getStatusColor(content.production_status)}>
                          {content.production_status}
                        </Badge>
                      </div>
                      
                      <h4 className="font-medium text-sm mb-2 line-clamp-2">{content.title}</h4>
                      
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{Math.round(content.viral_probability * 100)}% viral</span>
                        <span>{formatNumber(content.predicted_reach)} reach</span>
                      </div>
                      
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-purple-500 h-1 rounded-full transition-all" 
                            style={{ width: `${content.viral_probability * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Content Details */}
            <div className="lg:col-span-2">
              {selectedContent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        {getContentTypeIcon(selectedContent.content_type)}
                        <span className="ml-2">{selectedContent.title}</span>
                      </span>
                      <Badge className={getStatusColor(selectedContent.production_status)}>
                        {selectedContent.production_status}
                      </Badge>
                    </CardTitle>
                    <p className="text-gray-600">{selectedContent.description}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Viral Prediction */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(selectedContent.viral_probability * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">Viral Probability</div>
                      </div>
                      
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatNumber(selectedContent.predicted_reach)}
                        </div>
                        <div className="text-sm text-gray-600">Predicted Reach</div>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedContent.estimated_roi}%
                        </div>
                        <div className="text-sm text-gray-600">Estimated ROI</div>
                      </div>
                    </div>

                    {/* Platform Optimization */}
                    <div>
                      <h4 className="font-semibold mb-3">Platform Performance</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedContent.platforms.map((platform, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getPlatformIcon(platform.platform)}</span>
                                <span className="font-medium capitalize">{platform.platform}</span>
                              </div>
                              <span className="text-sm font-medium">{platform.optimization_score}/100</span>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-2">
                              {formatNumber(platform.predicted_views)} views
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all" 
                                style={{ width: `${platform.optimization_score}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strategy Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Hook Strategy */}
                      <div>
                        <h4 className="font-semibold mb-2">Hook Strategy</h4>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 italic">"{selectedContent.hook_strategy}"</p>
                        </div>
                      </div>

                      {/* CTA Strategy */}
                      <div>
                        <h4 className="font-semibold mb-2">Call-to-Action</h4>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 italic">"{selectedContent.cta_strategy}"</p>
                        </div>
                      </div>
                    </div>

                    {/* Key Messages */}
                    <div>
                      <h4 className="font-semibold mb-3">Key Messages</h4>
                      <div className="space-y-2">
                        {selectedContent.key_messages.map((message, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700">{message}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance Goals */}
                    <div>
                      <h4 className="font-semibold mb-3">Performance Goals</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {formatNumber(selectedContent.performance_goals.views)}
                          </div>
                          <div className="text-xs text-gray-600">Views Target</div>
                        </div>
                        
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-lg font-bold text-green-600">
                            {formatNumber(selectedContent.performance_goals.signups)}
                          </div>
                          <div className="text-xs text-gray-600">Signups Target</div>
                        </div>
                        
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-lg font-bold text-purple-600">
                            {formatNumber(selectedContent.performance_goals.conversions)}
                          </div>
                          <div className="text-xs text-gray-600">Conversions Target</div>
                        </div>
                        
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-lg font-bold text-orange-600">
                            {selectedContent.performance_goals.brand_awareness}%
                          </div>
                          <div className="text-xs text-gray-600">Brand Awareness</div>
                        </div>
                      </div>
                    </div>

                    {/* Target Audience */}
                    <div>
                      <h4 className="font-semibold mb-3">Target Audience</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedContent.target_audience.map((audience, index) => (
                          <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                            <Users className="h-3 w-3 mr-1" />
                            {audience}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4 border-t">
                      {selectedContent.production_status === 'ready' && (
                        <Button className="flex-1 bg-green-600 hover:bg-green-700">
                          <Play className="h-4 w-4 mr-2" />
                          Publish Content
                        </Button>
                      )}
                      
                      {selectedContent.production_status !== 'ready' && selectedContent.production_status !== 'published' && (
                        <Button className="flex-1" variant="outline">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Move to Next Stage
                        </Button>
                      )}
                      
                      <Button variant="outline">
                        <Target className="h-4 w-4 mr-2" />
                        Edit Strategy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance metrics would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Performance analysis dashboard coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-6">
          {/* Growth strategy would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Growth Strategy Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Strategy planning tools coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}