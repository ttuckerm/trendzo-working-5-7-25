'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Play, Download, Copy, Settings, ChevronRight, Star, Clock, Users, Zap, TrendingUp, Award, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { featureShowcaseService, type TrendzoFeature, type GeneratedShowcaseContent } from '@/lib/services/featureShowcaseService';

interface FeatureShowcaseState {
  isGenerating: boolean;
  currentStep: 'idle' | 'generating' | 'creating' | 'complete';
  progress: number;
  selectedFeature?: TrendzoFeature;
  showcaseContent?: GeneratedShowcaseContent;
  videoTemplate?: any;
  customizations: {
    platform: 'tiktok' | 'linkedin' | 'instagram' | 'youtube';
    style: 'demo' | 'testimonial' | 'comparison' | 'tutorial';
    duration: number;
    tone: 'professional' | 'casual' | 'urgent' | 'educational';
  };
}

export function EnhancedFeatureShowcaseGenerator({ 
  onShowcaseGenerated,
  className 
}: {
  onShowcaseGenerated?: (showcaseData: any) => void;
  className?: string;
}) {
  const [state, setState] = useState<FeatureShowcaseState>({
    isGenerating: false,
    currentStep: 'idle',
    progress: 0,
    customizations: {
      platform: 'tiktok',
      style: 'demo',
      duration: 30,
      tone: 'professional',
    },
  });
  
  const { toast } = useToast();
  const allFeatures = featureShowcaseService.getAllFeatures();

  const handleGenerateShowcase = async (featureId: string) => {
    const feature = featureShowcaseService.getFeature(featureId);
    if (!feature) return;

    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      currentStep: 'generating', 
      progress: 10,
      selectedFeature: feature
    }));

    try {
      toast({
        title: "Generating Feature Showcase",
        description: `Creating viral demo for ${feature.name}...`,
      });

      // Step 1: Generate showcase content
      const showcaseContent = await featureShowcaseService.generateFeatureShowcase(
        featureId,
        state.customizations
      );

      setState(prev => ({ 
        ...prev, 
        showcaseContent, 
        progress: 70, 
        currentStep: 'creating' 
      }));

      // Step 2: Create video template
      toast({
        title: "Creating Video Template",
        description: "Building your viral-ready showcase...",
      });

      const videoTemplate = await featureShowcaseService.createFeatureVideo(showcaseContent);

      setState(prev => ({ 
        ...prev, 
        videoTemplate, 
        progress: 100, 
        currentStep: 'complete',
        isGenerating: false 
      }));

      toast({
        title: "Feature Showcase Created!",
        description: `${showcaseContent.performance.viralProbability}% viral probability showcase ready`,
      });

      if (onShowcaseGenerated) {
        onShowcaseGenerated({
          feature,
          showcaseContent,
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
        description: "Could not generate feature showcase. Please try again.",
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
      selectedFeature: undefined,
      showcaseContent: undefined,
      videoTemplate: undefined,
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai_tools': return <Sparkles className="h-4 w-4" />;
      case 'analytics': return <TrendingUp className="h-4 w-4" />;
      case 'templates': return <Copy className="h-4 w-4" />;
      case 'optimization': return <Zap className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ai_tools': return 'from-purple-500 to-pink-500';
      case 'analytics': return 'from-blue-500 to-cyan-500';
      case 'templates': return 'from-green-500 to-emerald-500';
      case 'optimization': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Feature Showcase Generator
            </h2>
            <p className="text-sm text-muted-foreground">Create viral videos showcasing Trendzo features</p>
          </div>
        </div>

        {/* Customization Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

          <div>
            <label className="text-xs font-medium mb-1 block">Style</label>
            <Select 
              value={state.customizations.style} 
              onValueChange={(value) => updateCustomization('style', value as any)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demo">Live Demo</SelectItem>
                <SelectItem value="testimonial">Testimonial</SelectItem>
                <SelectItem value="comparison">Comparison</SelectItem>
                <SelectItem value="tutorial">Tutorial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Duration</label>
            <Select 
              value={state.customizations.duration.toString()} 
              onValueChange={(value) => updateCustomization('duration', parseInt(value))}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 seconds</SelectItem>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">60 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Feature Selection */}
      {state.currentStep === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold">Choose a Trendzo Feature to Showcase</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allFeatures.map((feature) => (
              <motion.div
                key={feature.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-blue-500/30"
                  onClick={() => handleGenerateShowcase(feature.id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
                          getCategoryColor(feature.category)
                        )}>
                          {getCategoryIcon(feature.category)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{feature.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {feature.category.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>

                    {/* Feature Stats */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {feature.performanceData.userAdoption}%
                        </div>
                        <div className="text-xs text-muted-foreground">Adoption</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {feature.performanceData.averageImprovement}%
                        </div>
                        <div className="text-xs text-muted-foreground">Improvement</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {feature.performanceData.customerSatisfaction}
                        </div>
                        <div className="text-xs text-muted-foreground">Rating</div>
                      </div>
                    </div>

                    {/* Key Benefits Preview */}
                    <div className="space-y-1">
                      {feature.keyBenefits.slice(0, 2).map((benefit, index) => (
                        <div key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {benefit}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">
                        Time to value: {feature.performanceData.timeToValue}
                      </span>
                      <ChevronRight className="h-4 w-4 text-blue-500" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Generation Progress */}
      <AnimatePresence>
        {state.isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="font-medium">
                      Generating {state.selectedFeature?.name} Showcase
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">{state.progress}%</span>
                </div>
                <Progress value={state.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Content Generation</span>
                  <span>Video Creation</span>
                  <span>Optimization</span>
                  <span>Finalization</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Showcase Results */}
      <AnimatePresence>
        {state.currentStep === 'complete' && state.showcaseContent && state.selectedFeature && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="script">Script</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="assets">Assets</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold flex items-center gap-2">
                          {getCategoryIcon(state.selectedFeature.category)}
                          {state.selectedFeature.name} Showcase
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {state.customizations.style} • {state.customizations.duration}s • {state.customizations.platform}
                        </p>
                      </div>
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
                        {/* Hook */}
                        <div className="text-center">
                          <div className="text-lg font-bold mb-2">
                            {state.showcaseContent.showcase.hook}
                          </div>
                        </div>
                        
                        {/* Feature Demo */}
                        <div className="text-center space-y-2">
                          <div className={cn(
                            "w-16 h-16 mx-auto rounded-lg bg-gradient-to-br flex items-center justify-center",
                            getCategoryColor(state.selectedFeature.category)
                          )}>
                            {getCategoryIcon(state.selectedFeature.category)}
                          </div>
                          <div className="text-sm font-semibold">
                            {state.selectedFeature.name}
                          </div>
                          <div className="text-xs opacity-90">
                            {state.showcaseContent.showcase.result.improvement}
                          </div>
                        </div>
                        
                        {/* CTA */}
                        <div className="text-center">
                          <div className="text-sm font-medium bg-white/20 rounded px-3 py-1">
                            {state.showcaseContent.showcase.cta}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Prediction */}
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {(state.showcaseContent.performance.expectedViews / 1000).toFixed(0)}K
                        </div>
                        <div className="text-xs text-muted-foreground">Expected Views</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {(state.showcaseContent.performance.expectedEngagement / 1000).toFixed(1)}K
                        </div>
                        <div className="text-xs text-muted-foreground">Engagement</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {state.showcaseContent.performance.viralProbability}%
                        </div>
                        <div className="text-xs text-muted-foreground">Viral Probability</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {state.showcaseContent.performance.conversionPotential.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Conversion Score</div>
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
                        {state.showcaseContent.content.script}
                      </pre>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium mb-2">Text Overlays</h5>
                        <div className="flex flex-wrap gap-2">
                          {state.showcaseContent.content.textOverlays.map((overlay, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {overlay}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium mb-2">Visual Elements</h5>
                        <div className="space-y-1">
                          {state.showcaseContent.content.visualElements.slice(0, 4).map((element, index) => (
                            <div key={index} className="text-sm text-muted-foreground">
                              • {element.replace(/_/g, ' ')}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="mt-4">
                <div className="space-y-4">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-4">Expected Performance</h4>
                    
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">Views</span>
                            <span className="text-sm font-medium">
                              {(state.showcaseContent.performance.expectedViews / 1000).toFixed(0)}K
                            </span>
                          </div>
                          <Progress value={75} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">Engagement</span>
                            <span className="text-sm font-medium">
                              {(state.showcaseContent.performance.expectedEngagement / 1000).toFixed(1)}K
                            </span>
                          </div>
                          <Progress value={65} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">Viral Probability</span>
                            <span className="text-sm font-medium">
                              {state.showcaseContent.performance.viralProbability}%
                            </span>
                          </div>
                          <Progress value={state.showcaseContent.performance.viralProbability} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">Conversion Potential</span>
                            <span className="text-sm font-medium">
                              {state.showcaseContent.performance.conversionPotential.toFixed(1)}/10
                            </span>
                          </div>
                          <Progress value={state.showcaseContent.performance.conversionPotential * 10} className="h-2" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">
                          Based on {state.selectedFeature.performanceData.userAdoption}% user adoption rate
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">
                          {state.selectedFeature.performanceData.customerSatisfaction}/10 customer satisfaction
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">
                          {state.selectedFeature.performanceData.timeToValue} time to value
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">Feature Highlights</h4>
                    <div className="space-y-2">
                      {state.selectedFeature.keyBenefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="assets" className="mt-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-4">Required Assets</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-2">Screenshots</h5>
                      <div className="grid grid-cols-3 gap-2">
                        {state.selectedFeature.demoAssets.screenshots.map((screenshot, index) => (
                          <div key={index} className="aspect-video bg-gray-100 rounded border flex items-center justify-center">
                            <span className="text-xs text-gray-500">{screenshot}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {state.selectedFeature.demoAssets.demoVideo && (
                      <div>
                        <h5 className="font-medium mb-2">Demo Video</h5>
                        <div className="aspect-video bg-gray-100 rounded border flex items-center justify-center">
                          <span className="text-sm text-gray-500">{state.selectedFeature.demoAssets.demoVideo}</span>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h5 className="font-medium mb-2">Music & Effects</h5>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Music:</span>
                          <Badge variant="outline">{state.showcaseContent.content.musicSuggestion}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Transitions:</span>
                          <div className="flex gap-1">
                            {state.showcaseContent.content.transitionEffects.slice(0, 3).map((effect, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {effect.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={() => toast({ title: "Template Created", description: "Feature showcase template created successfully" })}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Create Video Template
              </Button>
              <Button variant="outline" onClick={resetGenerator}>
                Generate Another
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}