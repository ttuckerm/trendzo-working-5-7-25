'use client';

import { useState } from 'react';
import { Sparkles, Zap, Target, TrendingUp, Wand2, Rocket, Brain, Eye, Play, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function MarketingStudioWorkingPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleMagicAction = async (action: string) => {
    setIsGenerating(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsGenerating(false);
      alert(`${action} completed successfully!`);
    }, 2000);
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
                  <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
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

            {/* Magic Actions */}
            <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-500" />
                Magic Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => handleMagicAction('Copy Viral Winner')}
                  disabled={isGenerating}
                  className="h-24 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex flex-col items-center justify-center gap-2"
                >
                  <Sparkles className="h-6 w-6" />
                  <span className="font-semibold">Copy Viral Winner</span>
                  <span className="text-xs opacity-80">Auto-fill from 1M+ view video</span>
                </Button>

                <Button 
                  onClick={() => handleMagicAction('Optimize for Viral')}
                  disabled={isGenerating}
                  className="h-24 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white flex flex-col items-center justify-center gap-2"
                >
                  <Zap className="h-6 w-6" />
                  <span className="font-semibold">Optimize for Viral</span>
                  <span className="text-xs opacity-80">AI-powered improvements</span>
                </Button>

                <Button 
                  onClick={() => handleMagicAction('Platform Optimize')}
                  disabled={isGenerating}
                  className="h-24 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white flex flex-col items-center justify-center gap-2"
                >
                  <Target className="h-6 w-6" />
                  <span className="font-semibold">Platform Optimize</span>
                  <span className="text-xs opacity-80">Multi-platform magic</span>
                </Button>
              </div>
            </Card>

            {/* Content Generation Tools */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                AI Content Generation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleMagicAction('Competitor Analysis')}
                >
                  <Eye className="h-8 w-8 text-purple-500 mb-2" />
                  <h3 className="font-semibold mb-1">Competitor Analysis</h3>
                  <p className="text-sm text-muted-foreground">Analyze and outperform competitors</p>
                </Card>

                <Card 
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleMagicAction('Success Story Generation')}
                >
                  <Rocket className="h-8 w-8 text-green-500 mb-2" />
                  <h3 className="font-semibold mb-1">Success Stories</h3>
                  <p className="text-sm text-muted-foreground">Generate compelling case studies</p>
                </Card>

                <Card 
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleMagicAction('Feature Showcase')}
                >
                  <Sparkles className="h-8 w-8 text-blue-500 mb-2" />
                  <h3 className="font-semibold mb-1">Feature Showcase</h3>
                  <p className="text-sm text-muted-foreground">Highlight product features</p>
                </Card>
              </div>
            </Card>

            {/* Live Analytics */}
            <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-blue-100 text-blue-700">
                  Live Analytics
                </Badge>
                <span className="text-sm font-medium">
                  Real-time marketing performance
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-blue-600">23</p>
                  <p className="text-xs text-muted-foreground">Viral Templates Created</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-purple-600">89%</p>
                  <p className="text-xs text-muted-foreground">Avg Viral Probability</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">4.2M</p>
                  <p className="text-xs text-muted-foreground">Total Generated Views</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-orange-600">127</p>
                  <p className="text-xs text-muted-foreground">AI Optimizations Applied</p>
                </div>
              </div>
            </Card>

            {/* Processing Indicator */}
            {isGenerating && (
              <Card className="p-4 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border-yellow-500/20">
                <div className="flex items-center gap-3">
                  <div className="animate-spin">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                  </div>
                  <span className="text-sm font-medium">
                    AI Magic in progress... Creating amazing content for you!
                  </span>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Viral Template Library</h2>
              <p className="text-muted-foreground">Advanced template management coming soon...</p>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Marketing Campaigns</h2>
              <p className="text-muted-foreground">Campaign builder coming soon...</p>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Performance Analytics</h2>
              <p className="text-muted-foreground">Advanced analytics dashboard coming soon...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}