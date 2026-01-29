'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Loader2, Users, TrendingUp, Play, Download, Copy, Settings, ChevronDown, Star, Calendar, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { successStoryService, type UserSuccessData, type GeneratedStoryContent } from '@/lib/services/successStoryService';

interface SuccessStoryState {
  isGenerating: boolean;
  currentStep: 'idle' | 'fetching' | 'generating' | 'creating' | 'complete';
  progress: number;
  successData?: UserSuccessData[];
  generatedContent?: GeneratedStoryContent;
  videoTemplate?: any;
  customizations: {
    metric: string;
    timeframe: string;
    industry: string;
    template: string;
    tone: 'professional' | 'casual' | 'inspirational' | 'urgent';
    length: 'short' | 'medium' | 'long';
    platform: 'tiktok' | 'linkedin' | 'instagram' | 'youtube';
  };
}

export function EnhancedSuccessStoryGenerator({ 
  onStoryGenerated,
  className 
}: {
  onStoryGenerated?: (storyData: any) => void;
  className?: string;
}) {
  const [state, setState] = useState<SuccessStoryState>({
    isGenerating: false,
    currentStep: 'idle',
    progress: 0,
    customizations: {
      metric: 'content engagement',
      timeframe: 'last_30_days',
      industry: '',
      template: 'testimonial_montage',
      tone: 'inspirational',
      length: 'medium',
      platform: 'tiktok',
    },
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  const handleGenerateStory = async () => {
    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      currentStep: 'fetching', 
      progress: 10 
    }));

    try {
      // Step 1: Fetch user success data
      toast({
        title: "Fetching Success Stories",
        description: "Finding your best user transformations...",
      });

      const successData = await successStoryService.fetchTopUserSuccesses({
        metric: state.customizations.metric,
        timeframe: state.customizations.timeframe,
        limit: 3,
        industry: state.customizations.industry || undefined,
      });

      setState(prev => ({ 
        ...prev, 
        successData, 
        progress: 40, 
        currentStep: 'generating' 
      }));

      // Step 2: Generate story content
      toast({
        title: "Generating Story",
        description: "Creating compelling narrative from user data...",
      });

      const generatedContent = await successStoryService.generateSuccessStoryScript(
        successData,
        state.customizations.template,
        {
          tone: state.customizations.tone,
          length: state.customizations.length,
          platform: state.customizations.platform,
        }
      );

      setState(prev => ({ 
        ...prev, 
        generatedContent, 
        progress: 70, 
        currentStep: 'creating' 
      }));

      // Step 3: Create video template
      toast({
        title: "Creating Video Template",
        description: "Building your viral-ready template...",
      });

      const videoTemplate = await successStoryService.createVideoTemplate(generatedContent);

      setState(prev => ({ 
        ...prev, 
        videoTemplate, 
        progress: 100, 
        currentStep: 'complete',
        isGenerating: false 
      }));

      toast({
        title: "Success Story Created!",
        description: `Generated story with ${generatedContent.performance.viralProbability}% viral probability`,
      });

      if (onStoryGenerated) {
        onStoryGenerated({
          successData,
          generatedContent,
          videoTemplate,
        });
      }

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        currentStep: 'idle', 
        progress: 0 
      }));
      toast({
        title: "Generation Failed",
        description: "Could not generate success story. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateCustomization = <K extends keyof typeof state.customizations>(
    key: K, 
    value: typeof state.customizations[K]
  ) => {
    setState(prev => ({
      ...prev,
      customizations: { ...prev.customizations, [key]: value }
    }));
  };

  const resetGenerator = () => {
    setState(prev => ({
      ...prev,
      currentStep: 'idle',
      progress: 0,
      successData: undefined,
      generatedContent: undefined,
      videoTemplate: undefined,
    }));
  };

  const getStepMessage = (step: string) => {
    switch (step) {
      case 'fetching': return 'Finding your best success stories...';
      case 'generating': return 'Creating compelling narrative...';
      case 'creating': return 'Building video template...';
      default: return 'Ready to generate success story';
    }
  };

  const formatMetric = (value: number, metric: string) => {
    if (metric.includes('rate') || metric.includes('percentage')) {
      return `${value}%`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Generate Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={handleGenerateStory}
          disabled={state.isGenerating}
          className={cn(
            "relative overflow-hidden h-20 px-6 w-full",
            "bg-gradient-to-r from-green-600 to-emerald-600",
            "hover:from-green-700 hover:to-emerald-700 text-white",
            "shadow-lg hover:shadow-xl transition-all duration-300"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                {state.isGenerating ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Rocket className="h-6 w-6" />
                )}
                <span className="font-bold text-lg">Generate Success Story</span>
              </div>
              <span className="text-xs opacity-90">
                {getStepMessage(state.currentStep)}
              </span>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-bold">Real User Data</div>
              <div className="text-xs opacity-80">Testimonials & Metrics</div>
            </div>
          </div>

          {/* Progress overlay */}
          {state.isGenerating && (
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ width: '0%' }}
              animate={{ width: `${state.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          )}
        </Button>
      </motion.div>

      {/* Customization Panel */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Story Configuration
          </h3>
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                Advanced Options
                <ChevronDown className={cn(
                  "h-4 w-4 ml-1 transition-transform",
                  showAdvanced && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-xs font-medium mb-1 block">Success Metric</label>
            <Select 
              value={state.customizations.metric} 
              onValueChange={(value) => updateCustomization('metric', value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="content engagement">Content Engagement</SelectItem>
                <SelectItem value="conversion rate">Conversion Rate</SelectItem>
                <SelectItem value="video views">Video Views</SelectItem>
                <SelectItem value="lead generation">Lead Generation</SelectItem>
                <SelectItem value="follower growth">Follower Growth</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Timeframe</label>
            <Select 
              value={state.customizations.timeframe} 
              onValueChange={(value) => updateCustomization('timeframe', value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem value="all_time">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Template Style</label>
            <Select 
              value={state.customizations.template} 
              onValueChange={(value) => updateCustomization('template', value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="testimonial_montage">Testimonial Montage</SelectItem>
                <SelectItem value="before_after">Before & After</SelectItem>
                <SelectItem value="stat_showcase">Statistics Showcase</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Platform</label>
            <Select 
              value={state.customizations.platform} 
              onValueChange={(value) => updateCustomization('platform', value as any)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Tone</label>
                <Select 
                  value={state.customizations.tone} 
                  onValueChange={(value) => updateCustomization('tone', value as any)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="inspirational">Inspirational</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Length</label>
                <Select 
                  value={state.customizations.length} 
                  onValueChange={(value) => updateCustomization('length', value as any)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (15s)</SelectItem>
                    <SelectItem value="medium">Medium (30s)</SelectItem>
                    <SelectItem value="long">Long (60s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Industry Filter</label>
                <Select 
                  value={state.customizations.industry} 
                  onValueChange={(value) => updateCustomization('industry', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Industries</SelectItem>
                    <SelectItem value="tech">Tech Startup</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="agency">Marketing Agency</SelectItem>
                    <SelectItem value="personal">Personal Brand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Generation Progress */}
      <AnimatePresence>
        {state.isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-4 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Generating success story...</span>
                  <span className="text-sm text-muted-foreground">{state.progress}%</span>
                </div>
                <Progress value={state.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>User Data</span>
                  <span>Script Generation</span>
                  <span>Video Template</span>
                  <span>Optimization</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Content Results */}
      <AnimatePresence>
        {state.currentStep === 'complete' && state.successData && state.generatedContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="script">Script</TabsTrigger>
                <TabsTrigger value="data">User Data</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                <Card className="p-6 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">Success Story Preview</h4>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Play className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>

                    {/* Video Preview Mockup */}
                    <div className="aspect-[9/16] max-w-[300px] mx-auto bg-gradient-to-br from-gray-900 to-gray-700 rounded-lg relative overflow-hidden">
                      <div className="absolute inset-0 flex flex-col justify-between p-4 text-white">
                        <div className="text-center">
                          <div className="text-2xl font-bold mb-1">
                            {state.successData[0].improvement}%
                          </div>
                          <div className="text-sm opacity-80">INCREASE</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-semibold mb-2">
                            {state.successData[0].userName}
                          </div>
                          <div className="text-sm opacity-90">
                            {formatMetric(state.successData[0].beforeValue, state.successData[0].metric)} → {formatMetric(state.successData[0].afterValue, state.successData[0].metric)}
                          </div>
                          <div className="text-xs opacity-70 mt-1">
                            in {state.successData[0].timeframe}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm font-medium bg-white/20 rounded px-3 py-1">
                            Try Trendzo Free
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {state.generatedContent.template.duration}s
                        </div>
                        <div className="text-xs text-muted-foreground">Duration</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {state.generatedContent.performance.viralProbability}%
                        </div>
                        <div className="text-xs text-muted-foreground">Viral Probability</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {(state.generatedContent.performance.expectedViews / 1000).toFixed(0)}K
                        </div>
                        <div className="text-xs text-muted-foreground">Expected Views</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="script" className="mt-4">
                <Card className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Generated Script</h4>
                      <Button size="sm" variant="outline">
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Script
                      </Button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {state.generatedContent.content.script}
                      </pre>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Visual Cues</h5>
                      <div className="space-y-1">
                        {state.generatedContent.content.visualCues.map((cue, index) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            • {cue}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Text Overlays</h5>
                      <div className="flex flex-wrap gap-2">
                        {state.generatedContent.content.textOverlays.map((overlay, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {overlay}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="data" className="mt-4">
                <div className="space-y-3">
                  {state.successData.map((data, index) => (
                    <Card key={data.userId} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold">{data.userName}</span>
                            <Badge variant="outline" className="text-xs">
                              {data.industry}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1 mb-1">
                              <TrendingUp className="h-3 w-3" />
                              {data.metric}: {formatMetric(data.beforeValue, data.metric)} → {formatMetric(data.afterValue, data.metric)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {data.timeframe} • {data.improvement}% improvement
                            </div>
                          </div>

                          {data.testimonial && (
                            <div className="text-sm italic border-l-2 border-green-500 pl-3 mt-2">
                              "{data.testimonial}"
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {data.improvement}%
                          </div>
                          <div className="text-xs text-muted-foreground">Growth</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="performance" className="mt-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-4">Expected Performance</h4>
                  
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {(state.generatedContent.performance.expectedViews / 1000).toFixed(0)}K
                      </div>
                      <div className="text-sm text-muted-foreground">Expected Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {(state.generatedContent.performance.expectedEngagement / 1000).toFixed(1)}K
                      </div>
                      <div className="text-sm text-muted-foreground">Expected Engagement</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {state.generatedContent.performance.viralProbability}%
                      </div>
                      <div className="text-sm text-muted-foreground">Viral Probability</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">
                        Based on {state.successData.length} high-performing user success stories
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">
                        Average improvement: {Math.round(state.successData.reduce((sum, data) => sum + data.improvement, 0) / state.successData.length)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        Template optimized for {state.customizations.platform} algorithm
                      </span>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={() => toast({ title: "Template Applied", description: "Success story template created successfully" })}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Create Video Template
              </Button>
              <Button variant="outline" onClick={resetGenerator}>
                Generate New Story
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}