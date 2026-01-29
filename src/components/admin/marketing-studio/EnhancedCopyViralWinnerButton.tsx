'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Loader2, Eye, ArrowRight, Check, Copy, Zap, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { viralVideoAnalysisService, type ViralVideo, type ExtractedElements, type SwapPoint } from '@/lib/services/viralVideoAnalysisService';

interface CopyViralWinnerState {
  isAnalyzing: boolean;
  currentStep: 'idle' | 'fetching' | 'extracting' | 'applying' | 'comparing' | 'complete';
  progress: number;
  viralVideo?: ViralVideo;
  extractedElements?: ExtractedElements;
  swapPoints?: SwapPoint[];
  prediction?: any;
}

export function EnhancedCopyViralWinnerButton({ 
  onTemplateCreated,
  className 
}: {
  onTemplateCreated?: (templateData: any) => void;
  className?: string;
}) {
  const [state, setState] = useState<CopyViralWinnerState>({
    isAnalyzing: false,
    currentStep: 'idle',
    progress: 0,
  });
  
  const { toast } = useToast();

  const handleCopyViral = async () => {
    setState(prev => ({ ...prev, isAnalyzing: true, currentStep: 'fetching', progress: 10 }));

    try {
      // Step 1: Fetch top-performing video
      toast({
        title: "Fetching Viral Winner",
        description: "Finding the best performing video in your niche...",
      });

      const topVideo = await viralVideoAnalysisService.fetchTopPerformingVideo({
        niche: 'productivity_tools',
        timeframe: 'last_7_days',
        minViews: 1000000,
      });

      setState(prev => ({ ...prev, viralVideo: topVideo, progress: 30, currentStep: 'extracting' }));

      // Step 2: Extract all viral elements
      toast({
        title: "Analyzing Viral Elements",
        description: "Extracting hooks, structure, music, and transitions...",
      });

      const elements = await viralVideoAnalysisService.extractVideoElements(topVideo);
      setState(prev => ({ ...prev, extractedElements: elements, progress: 60, currentStep: 'applying' }));

      // Step 3: Generate swap points for Trendzo branding
      const swapPoints = await viralVideoAnalysisService.generateSwapPoints(elements, 'Trendzo');
      setState(prev => ({ ...prev, swapPoints, progress: 80, currentStep: 'comparing' }));

      // Step 4: Auto-fill template and generate predictions
      toast({
        title: "Creating Your Template",
        description: "Applying viral elements and generating predictions...",
      });

      const templateResult = await viralVideoAnalysisService.autoFillTemplate('new_template', elements, swapPoints);
      const prediction = await viralVideoAnalysisService.generatePerformancePrediction(topVideo, templateResult);

      setState(prev => ({ 
        ...prev, 
        prediction, 
        progress: 100, 
        currentStep: 'complete',
        isAnalyzing: false 
      }));

      toast({
        title: "Viral Template Created!",
        description: `Expected ${(prediction.expectedViews / 1000000).toFixed(1)}M views with ${prediction.viralProbability}% viral probability`,
      });

      if (onTemplateCreated) {
        onTemplateCreated({
          originalVideo: topVideo,
          elements,
          swapPoints,
          prediction,
        });
      }

    } catch (error) {
      setState(prev => ({ ...prev, isAnalyzing: false, currentStep: 'idle', progress: 0 }));
      toast({
        title: "Analysis Failed",
        description: "Could not analyze viral video. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetAnalysis = () => {
    setState({
      isAnalyzing: false,
      currentStep: 'idle',
      progress: 0,
    });
  };

  const stepMessages = {
    fetching: "Finding viral winner...",
    extracting: "Analyzing viral DNA...",
    applying: "Adapting for Trendzo...",
    comparing: "Generating predictions...",
    complete: "Ready to create!"
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Copy Viral Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={handleCopyViral}
          disabled={state.isAnalyzing}
          className={cn(
            "relative overflow-hidden h-20 px-6 w-full",
            "bg-gradient-to-r from-yellow-500 to-orange-500",
            "hover:from-yellow-600 hover:to-orange-600 text-white",
            "shadow-lg hover:shadow-xl transition-all duration-300"
          )}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2">
              {state.isAnalyzing ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Trophy className="h-6 w-6" />
              )}
              <span className="font-bold text-lg">Copy Viral Winner</span>
            </div>
            <span className="text-xs opacity-90">
              {state.isAnalyzing ? stepMessages[state.currentStep] : "Auto-fill from 1M+ view video"}
            </span>
          </div>

          {/* Progress overlay */}
          {state.isAnalyzing && (
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ width: '0%' }}
              animate={{ width: `${state.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          )}
        </Button>
      </motion.div>

      {/* Analysis Progress */}
      <AnimatePresence>
        {state.isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-4 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Analyzing viral content...</span>
                  <span className="text-sm text-muted-foreground">{state.progress}%</span>
                </div>
                <Progress value={state.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {stepMessages[state.currentStep]}
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Results */}
      <AnimatePresence>
        {state.currentStep === 'complete' && state.viralVideo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Tabs defaultValue="comparison" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="elements">Elements</TabsTrigger>
                <TabsTrigger value="swaps">Swap Points</TabsTrigger>
              </TabsList>

              <TabsContent value="comparison" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Original Video */}
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Original Viral Video
                    </h3>
                    <div className="space-y-2">
                      <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">Video Preview</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{(state.viralVideo.views / 1000000).toFixed(1)}M views</span>
                        <Badge variant="outline">Score: {state.viralVideo.metrics.viralScore}</Badge>
                      </div>
                    </div>
                  </Card>

                  {/* Your Template */}
                  <Card className="p-4 border-green-200 bg-green-50">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-600" />
                      Your Trendzo Template
                    </h3>
                    <div className="space-y-2">
                      <div className="bg-green-100 rounded-lg h-32 flex items-center justify-center">
                        <span className="text-sm text-green-700">Template Ready</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">
                          {state.prediction ? (state.prediction.expectedViews / 1000000).toFixed(1) : '0'}M predicted views
                        </span>
                        <Badge className="bg-green-100 text-green-700">
                          {state.prediction?.viralProbability || 0}% viral probability
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Performance Prediction */}
                {state.prediction && (
                  <Card className="p-4 mt-4 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Performance Prediction
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {(state.prediction.expectedViews / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-xs text-muted-foreground">Expected Views</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">
                          {state.prediction.viralProbability}%
                        </p>
                        <p className="text-xs text-muted-foreground">Viral Probability</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {(state.prediction.expectedEngagement / 1000).toFixed(1)}K
                        </p>
                        <p className="text-xs text-muted-foreground">Expected Engagement</p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="elements" className="mt-4">
                {state.extractedElements && (
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h4 className="font-semibold mb-2">Viral Hook</h4>
                      <p className="text-sm italic">"{state.extractedElements.hook.text}"</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{state.extractedElements.hook.style}</Badge>
                        <Badge variant="outline">{state.extractedElements.hook.timing}s timing</Badge>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-semibold mb-2">Content Structure</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Intro:</span>
                          <span className="text-sm text-muted-foreground">
                            {state.extractedElements.structure.intro.duration}s
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Main:</span>
                          <span className="text-sm text-muted-foreground">
                            {state.extractedElements.structure.main.duration}s
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Conclusion:</span>
                          <span className="text-sm text-muted-foreground">
                            {state.extractedElements.structure.conclusion.duration}s
                          </span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-semibold mb-2">Music & Style</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Genre:</span>
                          <span className="text-sm text-muted-foreground">
                            {state.extractedElements.music.genre}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Energy:</span>
                          <Badge variant="outline" className="text-xs">
                            {state.extractedElements.music.energy}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Text Animation:</span>
                          <Badge variant="outline" className="text-xs">
                            {state.extractedElements.textStyle.animation}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="swaps" className="mt-4">
                {state.swapPoints && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Trendzo Brand Adaptations
                    </h4>
                    {state.swapPoints.map((swap) => (
                      <Card key={swap.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={swap.importance === 'critical' ? 'default' : 'outline'}
                                className="text-xs"
                              >
                                {swap.type.replace('_', ' ')}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                @ {swap.timing}s
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-1 text-sm">
                              <div>
                                <span className="text-muted-foreground">Original: </span>
                                <span className="line-through">{swap.original}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Trendzo: </span>
                                <span className="font-medium text-green-600">{swap.suggested}</span>
                              </div>
                            </div>
                          </div>
                          <Check className="h-4 w-4 text-green-500 mt-1" />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={() => toast({ title: "Template Applied", description: "Viral elements copied to your template" })}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                Apply to Template
              </Button>
              <Button variant="outline" onClick={resetAnalysis}>
                Analyze Another
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}