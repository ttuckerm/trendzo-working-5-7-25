'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Copy, 
  Zap, 
  Target, 
  TrendingUp, 
  Video, 
  Users, 
  DollarSign,
  Brain,
  Wand2,
  Rocket,
  Star
} from 'lucide-react';

interface MagicButton {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  viralProbability: number;
  color: string;
}

interface GeneratedContent {
  id: string;
  title: string;
  script: string;
  viralProbability: number;
  hooks: string[];
  platform: string;
  niche: string;
  timestamp: string;
}

interface CampaignMetrics {
  id: string;
  campaign_name: string;
  viral_prediction: number;
  actual_views: number;
  conversions: number;
  conversion_rate: number;
  roi_estimate: number;
  status: string;
}

export default function InceptionStudioPage() {
  const [selectedNiche, setSelectedNiche] = useState('business');
  const [selectedPlatform, setSelectedPlatform] = useState('tiktok');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignMetrics[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);

  const magicButtons: MagicButton[] = [
    {
      id: 'copy-viral-winner',
      name: '🔥 Copy Viral Winner',
      description: 'Replicate top viral patterns with 95%+ probability',
      icon: <Copy className="h-5 w-5" />,
      action: 'copy_viral',
      viralProbability: 0.95,
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      id: 'optimize-for-viral',
      name: '⚡ Optimize for Viral',
      description: 'AI-enhance existing content for maximum virality',
      icon: <Zap className="h-5 w-5" />,
      action: 'optimize_viral',
      viralProbability: 0.89,
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      id: 'perfect-for-platform',
      name: '🎯 Perfect for Platform',
      description: 'Platform-specific optimization using latest trends',
      icon: <Target className="h-5 w-5" />,
      action: 'perfect_platform',
      viralProbability: 0.87,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'viral-inception',
      name: '🚀 Viral Inception',
      description: 'Generate self-promoting viral content about the platform',
      icon: <Rocket className="h-5 w-5" />,
      action: 'viral_inception',
      viralProbability: 0.92,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'trend-hijacker',
      name: '📈 Trend Hijacker',
      description: 'Ride current viral trends with unique angle',
      icon: <TrendingUp className="h-5 w-5" />,
      action: 'trend_hijack',
      viralProbability: 0.84,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'engagement-magnet',
      name: '🧲 Engagement Magnet',
      description: 'Maximize comments, shares, and saves',
      icon: <Star className="h-5 w-5" />,
      action: 'engagement_magnet',
      viralProbability: 0.81,
      color: 'bg-pink-500 hover:bg-pink-600'
    }
  ];

  const niches = [
    'business', 'fitness', 'food', 'beauty', 'entertainment', 
    'education', 'lifestyle', 'technology', 'travel', 'general'
  ];

  const platforms = ['tiktok', 'instagram', 'youtube', 'twitter'];

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/inception-studio/campaigns');
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  const handleMagicButton = async (button: MagicButton) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/admin/inception-studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: button.action,
          niche: selectedNiche,
          platform: selectedPlatform,
          customPrompt: customPrompt || undefined
        })
      });

      const data = await response.json();
      if (data.success && data.content) {
        setGeneratedContent(prev => [data.content, ...prev]);
        setSelectedContent(data.content);
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const createCampaign = async (content: GeneratedContent) => {
    try {
      const response = await fetch('/api/admin/inception-studio/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_name: content.title,
          video_title: content.title,
          video_description: content.script,
          platform: content.platform,
          viral_prediction: content.viralProbability
        })
      });

      if (response.ok) {
        fetchCampaigns(); // Refresh campaigns
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">✨ Inception Marketing Studio</h1>
          <p className="text-muted-foreground">
            Generate viral content with 90%+ prediction accuracy using AI magic buttons
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <Brain className="h-4 w-4 mr-1" />
            AI-Powered
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Zap className="h-4 w-4 mr-1" />
            High Performance
          </Badge>
        </div>
      </div>

      {/* Campaign Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {campaigns.length} total campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.actual_views, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.conversions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              New signups generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg ROI</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.length > 0 
                ? (campaigns.reduce((sum, c) => sum + (c.roi_estimate || 0), 0) / campaigns.length).toFixed(1)
                : '0'
              }x
            </div>
            <p className="text-xs text-muted-foreground">
              Return on investment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Studio Tabs */}
      <Tabs defaultValue="generator" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generator">Magic Generator</TabsTrigger>
          <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        {/* Magic Generator Tab */}
        <TabsContent value="generator" className="space-y-6">
          {/* Configuration Section */}
          <Card>
            <CardHeader>
              <CardTitle>Content Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium">Niche</label>
                  <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {niches.map(niche => (
                        <SelectItem key={niche} value={niche}>
                          {niche.charAt(0).toUpperCase() + niche.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Platform</label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map(platform => (
                        <SelectItem key={platform} value={platform}>
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-1">
                  <label className="text-sm font-medium">Custom Context (Optional)</label>
                  <Input 
                    placeholder="e.g., about productivity tools"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Magic Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wand2 className="h-5 w-5 mr-2" />
                AI Magic Buttons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {magicButtons.map((button) => (
                  <Card key={button.id} className="relative overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {button.icon}
                          <span className="font-medium text-sm">{button.name}</span>
                        </div>
                        <Badge variant="secondary">
                          {(button.viralProbability * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-3">
                        {button.description}
                      </p>
                      
                      <Progress value={button.viralProbability * 100} className="mb-3" />
                      
                      <Button 
                        className={`w-full ${button.color} text-white`}
                        onClick={() => handleMagicButton(button)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Generate
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generated Content */}
          {selectedContent && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Content</CardTitle>
                  <div className="flex space-x-2">
                    <Badge className="bg-green-100 text-green-800">
                      {(selectedContent.viralProbability * 100).toFixed(0)}% Viral Probability
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => createCampaign(selectedContent)}
                      variant="outline"
                    >
                      <Rocket className="h-4 w-4 mr-2" />
                      Launch Campaign
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Title</h3>
                  <div className="flex items-center space-x-2">
                    <Input value={selectedContent.title} readOnly />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(selectedContent.title)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Script</h3>
                  <div className="space-y-2">
                    <Textarea 
                      value={selectedContent.script} 
                      readOnly 
                      rows={8}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(selectedContent.script)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Script
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Viral Hooks</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.hooks.map((hook, index) => (
                      <Badge key={index} variant="outline">
                        {hook}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Generations */}
          {generatedContent.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Generations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedContent.slice(1, 6).map((content) => (
                    <div 
                      key={content.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedContent(content)}
                    >
                      <div>
                        <div className="font-medium">{content.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {content.platform} • {content.niche} • {(content.viralProbability * 100).toFixed(0)}% viral
                        </div>
                      </div>
                      <Badge variant="outline">
                        {new Date(content.timestamp).toLocaleTimeString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Active Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{campaign.campaign_name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Predicted: {(campaign.viral_prediction * 100).toFixed(0)}%</span>
                        <span>Views: {campaign.actual_views.toLocaleString()}</span>
                        <span>Conversions: {campaign.conversions}</span>
                        <span>ROI: {campaign.roi_estimate?.toFixed(1)}x</span>
                      </div>
                    </div>
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Prediction Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.slice(0, 5).map((campaign) => {
                    const actualViralScore = campaign.actual_views > 100000 ? 0.8 : 
                                           campaign.actual_views > 50000 ? 0.6 : 0.3;
                    const accuracy = 1 - Math.abs(campaign.viral_prediction - actualViralScore);
                    
                    return (
                      <div key={campaign.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{campaign.campaign_name.slice(0, 30)}...</span>
                          <span className="font-medium">{(accuracy * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={accuracy * 100} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Video Views</span>
                    <span className="font-bold">
                      {campaigns.reduce((sum, c) => sum + c.actual_views, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Comments/Engagement</span>
                    <span className="font-bold">
                      {Math.floor(campaigns.reduce((sum, c) => sum + c.actual_views, 0) * 0.05).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Platform Signups</span>
                    <span className="font-bold text-green-600">
                      {campaigns.reduce((sum, c) => sum + c.conversions, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Conversion Rate</span>
                    <span className="font-bold">
                      {campaigns.length > 0 
                        ? (campaigns.reduce((sum, c) => sum + (c.conversion_rate || 0), 0) / campaigns.length * 100).toFixed(2)
                        : '0'
                      }%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}