'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Eye, Rocket, Sparkles, Loader2, Check, Copy, Download, Share2, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { EnhancedFeatureShowcaseGenerator } from './EnhancedFeatureShowcaseGenerator';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface CompetitorAnalysisProps {
  onAnalysisComplete?: (analysis: any) => void;
}

export function CompetitorAnalysis({ onAnalysisComplete }: CompetitorAnalysisProps) {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a competitor URL to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockAnalysis = {
        url,
        platform: 'TikTok',
        engagement: {
          likes: 245000,
          shares: 12500,
          comments: 8900,
          views: 2500000,
        },
        content: {
          hooks: ['Did you know...', 'Stop scrolling!', 'This changed my life'],
          keywords: ['productivity', 'life hack', 'morning routine'],
          emotionalTriggers: ['curiosity', 'fear of missing out', 'aspiration'],
          callToActions: ['Follow for more', 'Save this!', 'Try it yourself'],
        },
        success_factors: [
          'Strong hook in first 3 seconds',
          'Relatable problem statement',
          'Quick value delivery',
          'Clear call to action',
        ],
        recommendations: [
          { type: 'hook', suggestion: 'Use pattern interrupt in first 2 seconds' },
          { type: 'visual', suggestion: 'Add text overlays for key points' },
          { type: 'timing', suggestion: 'Keep under 30 seconds for max engagement' },
        ],
      };

      setProgress(100);
      setAnalysis(mockAnalysis);
      if (onAnalysisComplete) onAnalysisComplete(mockAnalysis);
      
      toast({
        title: "Analysis Complete",
        description: "Competitor content analyzed successfully",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the competitor content",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Eye className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Competitor Analysis</h3>
          <p className="text-sm text-muted-foreground">Analyze and outperform competitor content</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter competitor content URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Analyze'
            )}
          </Button>
        </div>

        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Analyzing content...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Engagement Metrics */}
              <Card className="p-4 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Engagement Metrics
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{(analysis.engagement.views / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{(analysis.engagement.likes / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{(analysis.engagement.shares / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-muted-foreground">Shares</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{(analysis.engagement.comments / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                </div>
              </Card>

              {/* Success Factors */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Success Factors
                </h4>
                <ul className="space-y-2">
                  {analysis.success_factors.map((factor: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">{factor}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Recommendations */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Recommendations
                </h4>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec: any, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">
                        {rec.type}
                      </Badge>
                      <span className="text-sm flex-1">{rec.suggestion}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Insights
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export Report
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

interface SuccessStoryGeneratorProps {
  onStoryGenerated?: (story: any) => void;
}

export function SuccessStoryGenerator({ onStoryGenerated }: SuccessStoryGeneratorProps) {
  const [formData, setFormData] = useState({
    metric: '',
    improvement: '',
    timeframe: '',
    context: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!formData.metric || !formData.improvement) {
      toast({
        title: "Missing Information",
        description: "Please fill in the required fields",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const story = {
        headline: `${formData.improvement}% Increase in ${formData.metric} in Just ${formData.timeframe || '30 Days'}`,
        story: `When we first started using Trendzo, our ${formData.metric} was struggling. But after implementing the AI-powered viral strategies, we saw an incredible ${formData.improvement}% improvement in just ${formData.timeframe || '30 days'}. ${formData.context || 'The results exceeded all our expectations.'}`,
        metrics: [
          `${formData.improvement}% growth in ${formData.metric}`,
          'ROI increased by 3.5x',
          'Engagement rate up 250%',
        ],
        visualElements: ['before-after-chart', 'growth-timeline', 'testimonial-card'],
      };

      setGeneratedStory(story);
      if (onStoryGenerated) onStoryGenerated(story);
      
      toast({
        title: "Success Story Generated",
        description: "Your compelling story is ready",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Could not generate success story",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
          <Rocket className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Success Story Generator</h3>
          <p className="text-sm text-muted-foreground">Create compelling case studies</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Metric*</label>
            <Input
              placeholder="e.g., conversion rate, sales"
              value={formData.metric}
              onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Improvement %*</label>
            <Input
              placeholder="e.g., 250"
              type="number"
              value={formData.improvement}
              onChange={(e) => setFormData({ ...formData, improvement: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Timeframe</label>
          <Input
            placeholder="e.g., 30 days, 3 months"
            value={formData.timeframe}
            onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Additional Context</label>
          <Textarea
            placeholder="Add any specific details about the success..."
            value={formData.context}
            onChange={(e) => setFormData({ ...formData, context: e.target.value })}
            rows={3}
          />
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Story...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Success Story
            </>
          )}
        </Button>

        <AnimatePresence>
          {generatedStory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <Card className="p-4 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
                <h4 className="text-lg font-bold mb-2">{generatedStory.headline}</h4>
                <p className="text-sm text-muted-foreground mb-4">{generatedStory.story}</p>
                
                <div className="flex flex-wrap gap-2">
                  {generatedStory.metrics.map((metric: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {metric}
                    </Badge>
                  ))}
                </div>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Story
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

interface FeatureShowcaseGeneratorProps {
  onFeatureGenerated?: (feature: any) => void;
}

export function FeatureShowcaseGenerator({ onFeatureGenerated }: FeatureShowcaseGeneratorProps) {
  const [feature, setFeature] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showcase, setShowcase] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!feature) {
      toast({
        title: "Feature Required",
        description: "Please enter a feature to showcase",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const generatedShowcase = {
        feature,
        headline: `Introducing ${feature}: Your Secret Weapon for Viral Success`,
        description: `${feature} is the game-changing feature that transforms ordinary content into viral sensations. With advanced AI technology and proven strategies, it's never been easier to create content that captures attention and drives results.`,
        benefits: [
          '10x faster content creation',
          'Guaranteed viral potential',
          'Data-driven optimization',
          'Platform-specific tuning',
        ],
        useCases: [
          'Product launches',
          'Brand awareness campaigns',
          'Social media growth',
          'Lead generation',
        ],
        visuals: {
          icon: 'sparkles',
          screenshot: '/screenshots/feature-demo.png',
          animation: 'feature-showcase.mp4',
        },
      };

      setShowcase(generatedShowcase);
      if (onFeatureGenerated) onFeatureGenerated(generatedShowcase);
      
      toast({
        title: "Feature Showcase Created",
        description: "Your feature highlight is ready",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Could not generate feature showcase",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Feature Showcase</h3>
          <p className="text-sm text-muted-foreground">Highlight product features effectively</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter feature name..."
            value={feature}
            onChange={(e) => setFeature(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Generate'
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showcase && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
                <h4 className="text-lg font-bold mb-2">{showcase.headline}</h4>
                <p className="text-sm text-muted-foreground mb-4">{showcase.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-semibold text-sm mb-2">Benefits</h5>
                    <ul className="space-y-1">
                      {showcase.benefits.map((benefit: string, index: number) => (
                        <li key={index} className="text-sm flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-500" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-semibold text-sm mb-2">Use Cases</h5>
                    <ul className="space-y-1">
                      {showcase.useCases.map((useCase: string, index: number) => (
                        <li key={index} className="text-sm flex items-center gap-1">
                          <Target className="h-3 w-3 text-blue-500" />
                          {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-1" />
                  Copy Content
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export Assets
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

// Main AI Content Generation Panel
export function AIContentGenerationPanel() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="competitor" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="competitor">Competitor Analysis</TabsTrigger>
          <TabsTrigger value="success">Success Stories</TabsTrigger>
          <TabsTrigger value="features">Feature Showcase</TabsTrigger>
        </TabsList>
        
        <TabsContent value="competitor" className="mt-6">
          <CompetitorAnalysis />
        </TabsContent>
        
        <TabsContent value="success" className="mt-6">
          <SuccessStoryGenerator />
        </TabsContent>
        
        <TabsContent value="features" className="mt-6">
          <EnhancedFeatureShowcaseGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}