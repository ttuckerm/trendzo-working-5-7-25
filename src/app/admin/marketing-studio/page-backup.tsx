'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Target, TrendingUp, Copy, Wand2, BarChart3, Rocket, Brain, Eye, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { EnhancedMagicButtonPanel } from '@/components/admin/marketing-studio/EnhancedMagicButtonPanel';
import { cn } from '@/lib/utils';

interface ViralTemplate {
  id: string;
  name: string;
  platform: string;
  performance: {
    views: number;
    conversions: number;
    viralScore: number;
  };
  thumbnail: string;
}

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'completed';
  roi: number;
  conversions: number;
}

export default function MarketingStudioPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [viralTemplates, setViralTemplates] = useState<ViralTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Mock data - replace with actual API calls
    setViralTemplates([
      {
        id: '1',
        name: 'Tech Product Launch',
        platform: 'TikTok',
        performance: {
          views: 2500000,
          conversions: 12500,
          viralScore: 98
        },
        thumbnail: '/thumbnails/template1.jpg'
      },
      {
        id: '2',
        name: 'SaaS Feature Demo',
        platform: 'LinkedIn',
        performance: {
          views: 850000,
          conversions: 8500,
          viralScore: 92
        },
        thumbnail: '/thumbnails/template2.jpg'
      }
    ]);

    setCampaigns([
      {
        id: '1',
        name: 'Q4 Product Launch',
        status: 'active',
        roi: 385,
        conversions: 2450
      },
      {
        id: '2',
        name: 'Black Friday Campaign',
        status: 'draft',
        roi: 0,
        conversions: 0
      }
    ]);
  }, []);

  const handleCopyViralWinner = async (templateId: string) => {
    setIsGenerating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    router.push(`/admin/marketing-studio/editor?template=${templateId}&mode=viral-copy`);
  };

  const handleOptimizeForViral = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsGenerating(false);
    // Show optimization suggestions
  };

  const handleGenerateContent = async (type: string) => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    router.push(`/admin/marketing-studio/generator?type=${type}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Marketing Studio
                </h1>
                <p className="text-sm text-muted-foreground">Create viral content that converts</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              Super Admin Access
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="templates">Viral Templates</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Magic Buttons Panel */}
            <EnhancedMagicButtonPanel 
              onTemplateCreated={(templateData) => {
                console.log('Template created:', templateData);
                // Handle template creation logic here
              }}
            />

            {/* Content Generation Tools */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                AI Content Generation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleGenerateContent('competitor-analysis')}
                >
                  <Eye className="h-8 w-8 text-purple-500 mb-2" />
                  <h3 className="font-semibold mb-1">Competitor Analysis</h3>
                  <p className="text-sm text-muted-foreground">Analyze and outperform competitors</p>
                </Card>

                <Card 
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleGenerateContent('success-story')}
                >
                  <Rocket className="h-8 w-8 text-green-500 mb-2" />
                  <h3 className="font-semibold mb-1">Success Stories</h3>
                  <p className="text-sm text-muted-foreground">Generate compelling case studies</p>
                </Card>

                <Card 
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleGenerateContent('feature-showcase')}
                >
                  <Sparkles className="h-8 w-8 text-blue-500 mb-2" />
                  <h3 className="font-semibold mb-1">Feature Showcase</h3>
                  <p className="text-sm text-muted-foreground">Highlight product features</p>
                </Card>
              </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                    <p className="text-2xl font-bold">12.5M</p>
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      +23% this week
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversions</p>
                    <p className="text-2xl font-bold">45.2K</p>
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      +18% this week
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg ROI</p>
                    <p className="text-2xl font-bold">385%</p>
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      +42% this month
                    </p>
                  </div>
                  <Rocket className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Viral Score</p>
                    <p className="text-2xl font-bold">94/100</p>
                    <p className="text-xs text-purple-500 flex items-center gap-1 mt-1">
                      <Sparkles className="h-3 w-3" />
                      Top 1% content
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-500 opacity-50" />
                </div>
              </Card>
            </div>

            {/* Recent Viral Winners */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Recent Viral Winners
                </h2>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('templates')}>
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viralTemplates.map((template) => (
                  <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{template.platform}</p>
                        <div className="flex gap-4 text-sm">
                          <span className="text-green-500">{(template.performance.views / 1000000).toFixed(1)}M views</span>
                          <span className="text-blue-500">{(template.performance.conversions / 1000).toFixed(1)}K conversions</span>
                          <Badge variant="outline" className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                            Score: {template.performance.viralScore}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Viral Template Library</h2>
              <p className="text-muted-foreground">Coming soon...</p>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Marketing Campaigns</h2>
              <p className="text-muted-foreground">Coming soon...</p>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Performance Analytics</h2>
              <p className="text-muted-foreground">Coming soon...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Loading Overlay */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <Card className="p-8 max-w-sm mx-auto text-center">
            <div className="mb-4">
              <Sparkles className="h-12 w-12 mx-auto text-purple-500 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Magic in Progress</h3>
            <p className="text-sm text-muted-foreground">Creating something amazing for you...</p>
          </Card>
        </motion.div>
      )}
    </div>
  );
}