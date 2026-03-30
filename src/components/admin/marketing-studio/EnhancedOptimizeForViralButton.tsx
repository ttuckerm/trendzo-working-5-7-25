'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Loader2, TrendingUp, Target, CheckCircle, XCircle, ArrowRight, Lightbulb, Clock, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { viralOptimizationService, type ContentAnalysis, type OptimizationSuggestion } from '@/lib/services/viralOptimizationService';

interface OptimizeForViralState {
  isAnalyzing: boolean;
  isApplying: boolean;
  currentStep: 'idle' | 'analyzing' | 'suggestions' | 'applying' | 'complete';
  progress: number;
  analysis?: ContentAnalysis;
  suggestions?: OptimizationSuggestion[];
  appliedSuggestions: string[];
  viralScore: number;
}

export function EnhancedOptimizeForViralButton({ 
  content = {
    script: "Hey everyone, check out this productivity app that changed my workflow. It has AI features and helps with task management. Follow for more tips!",
    duration: 30,
    platform: "tiktok"
  },
  onOptimizationComplete,
  className 
}: {
  content?: {
    script: string;
    duration: number;
    platform: string;
  };
  onOptimizationComplete?: (results: any) => void;
  className?: string;
}) {
  const [state, setState] = useState<OptimizeForViralState>({
    isAnalyzing: false,
    isApplying: false,
    currentStep: 'idle',
    progress: 0,
    appliedSuggestions: [],
    viralScore: 65, // Starting baseline score
  });
  
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setState(prev => ({ 
      ...prev, 
      isAnalyzing: true, 
      currentStep: 'analyzing', 
      progress: 10,
      appliedSuggestions: []
    }));

    try {
      toast({
        title: "Analyzing Content",
        description: "Running AI analysis against viral patterns...",
      });

      // Simulate analysis progress
      const progressInterval = setInterval(() => {
        setState(prev => {
          if (prev.progress >= 80) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, progress: prev.progress + 10 };
        });
      }, 300);

      const analysis = await viralOptimizationService.analyzeContent(content);
      const suggestions = await viralOptimizationService.generateOptimizationSuggestions(analysis);

      clearInterval(progressInterval);
      setState(prev => ({ 
        ...prev, 
        analysis, 
        suggestions, 
        progress: 100, 
        currentStep: 'suggestions',
        isAnalyzing: false 
      }));

      toast({
        title: "Analysis Complete",
        description: `Found ${suggestions.length} optimization opportunities`,
      });

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        currentStep: 'idle', 
        progress: 0 
      }));
      toast({
        title: "Analysis Failed",
        description: "Could not analyze content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApplySuggestion = async (suggestion: OptimizationSuggestion) => {
    setState(prev => ({ ...prev, isApplying: true }));

    try {
      const result = await viralOptimizationService.applyOptimization(suggestion, 'current_template');
      
      setState(prev => ({ 
        ...prev, 
        appliedSuggestions: [...prev.appliedSuggestions, suggestion.id],
        viralScore: result.newViralScore,
        isApplying: false
      }));

      toast({
        title: "Optimization Applied",
        description: `${suggestion.title} - ${result.estimatedImprovement}`,
      });

    } catch (error) {
      setState(prev => ({ ...prev, isApplying: false }));
      toast({
        title: "Application Failed",
        description: "Could not apply optimization.",
        variant: "destructive",
      });
    }
  };

  const handleApplyAll = async () => {
    if (!state.suggestions) return;

    setState(prev => ({ ...prev, isApplying: true, currentStep: 'applying' }));

    try {
      for (const suggestion of state.suggestions) {
        if (!state.appliedSuggestions.includes(suggestion.id)) {
          await viralOptimizationService.applyOptimization(suggestion, 'current_template');
          setState(prev => ({ 
            ...prev, 
            appliedSuggestions: [...prev.appliedSuggestions, suggestion.id]
          }));
          await new Promise(resolve => setTimeout(resolve, 500)); // Stagger applications
        }
      }

      setState(prev => ({ 
        ...prev, 
        viralScore: Math.min(100, prev.viralScore + 25),
        currentStep: 'complete',
        isApplying: false
      }));

      toast({
        title: "All Optimizations Applied",
        description: "Your content is now optimized for viral success!",
      });

      if (onOptimizationComplete) {
        onOptimizationComplete({
          analysis: state.analysis,
          suggestions: state.suggestions,
          finalScore: state.viralScore + 25
        });
      }

    } catch (error) {
      setState(prev => ({ ...prev, isApplying: false, currentStep: 'suggestions' }));
      toast({
        title: "Optimization Failed",
        description: "Could not apply all optimizations.",
        variant: "destructive",
      });
    }
  };

  const resetOptimization = () => {
    setState({
      isAnalyzing: false,
      isApplying: false,
      currentStep: 'idle',
      progress: 0,
      appliedSuggestions: [],
      viralScore: 65,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Optimize Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={handleAnalyze}
          disabled={state.isAnalyzing || state.isApplying}
          className={cn(
            "relative overflow-hidden h-20 px-6 w-full",
            "bg-gradient-to-r from-blue-600 to-cyan-600",
            "hover:from-blue-700 hover:to-cyan-700 text-white",
            "shadow-lg hover:shadow-xl transition-all duration-300"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                {state.isAnalyzing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Zap className="h-6 w-6" />
                )}
                <span className="font-bold text-lg">Optimize for Viral</span>
              </div>
              <span className="text-xs opacity-90">
                {state.isAnalyzing ? "Analyzing viral patterns..." : "AI-powered improvements"}
              </span>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold">{state.viralScore}%</div>
              <div className="text-xs opacity-80">Viral Score</div>
            </div>
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
            <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Analyzing against viral patterns...</span>
                  <span className="text-sm text-muted-foreground">{state.progress}%</span>
                </div>
                <Progress value={state.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Hook Analysis</span>
                  <span>Pacing Review</span>
                  <span>CTA Optimization</span>
                  <span>Pattern Matching</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Results */}
      <AnimatePresence>
        {state.currentStep === 'suggestions' && state.analysis && state.suggestions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Tabs defaultValue="suggestions" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="patterns">Patterns</TabsTrigger>
              </TabsList>

              <TabsContent value="suggestions" className="mt-4 space-y-4">
                {/* Overall Score & Apply All */}
                <Card className="p-4 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">Optimization Suggestions</h4>
                      <p className="text-sm text-muted-foreground">
                        {state.suggestions.length} improvements found
                      </p>
                    </div>
                    <Button 
                      onClick={handleApplyAll}
                      disabled={state.isApplying || state.appliedSuggestions.length === state.suggestions.length}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {state.isApplying ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      Apply All
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div>
                      <span className={cn("text-3xl font-bold", getScoreColor(state.viralScore))}>
                        {state.viralScore}%
                      </span>
                      <p className="text-xs text-muted-foreground">Current Score</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <span className="text-3xl font-bold text-green-600">
                        {Math.min(100, state.viralScore + 25)}%
                      </span>
                      <p className="text-xs text-muted-foreground">Potential Score</p>
                    </div>
                  </div>
                </Card>

                {/* Individual Suggestions */}
                <div className="space-y-3">
                  {state.suggestions.map((suggestion) => {
                    const isApplied = state.appliedSuggestions.includes(suggestion.id);
                    
                    return (
                      <Card key={suggestion.id} className={cn(
                        "p-4 transition-all duration-200",
                        isApplied ? "bg-green-50 border-green-200" : "hover:shadow-md"
                      )}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-3 h-3 rounded-full",
                                getPriorityColor(suggestion.priority)
                              )} />
                              <h5 className="font-semibold">{suggestion.title}</h5>
                              <Badge variant="outline" className="text-xs">
                                {suggestion.type}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {suggestion.timeToImplement}
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              {suggestion.description}
                            </p>
                            
                            <div className="space-y-2">
                              <div className="bg-red-50 p-2 rounded text-sm">
                                <span className="font-medium text-red-700">Before: </span>
                                <span className="text-red-600">{suggestion.original}</span>
                              </div>
                              <div className="bg-green-50 p-2 rounded text-sm">
                                <span className="font-medium text-green-700">After: </span>
                                <span className="text-green-600">{suggestion.optimized}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                <span className="font-medium">{suggestion.expectedImpact}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Percent className="h-3 w-3 text-blue-500" />
                                <span>{suggestion.confidence}% confidence</span>
                              </div>
                            </div>
                            
                            <p className="text-xs text-muted-foreground italic">
                              💡 {suggestion.reasoning}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-center gap-2">
                            {isApplied ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                <span className="text-xs font-medium">Applied</span>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleApplySuggestion(suggestion)}
                                disabled={state.isApplying}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {state.isApplying ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Apply'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="mt-4">
                {state.analysis && (
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h4 className="font-semibold mb-3">Content Analysis</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-sm mb-2">Hook Strength</h5>
                          <div className="flex items-center gap-2">
                            <Progress value={state.analysis.hook.strength * 10} className="h-2 flex-1" />
                            <span className="text-sm">{state.analysis.hook.strength}/10</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            "{state.analysis.hook.current}"
                          </p>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-sm mb-2">CTA Strength</h5>
                          <div className="flex items-center gap-2">
                            <Progress value={state.analysis.cta.strength * 10} className="h-2 flex-1" />
                            <span className="text-sm">{state.analysis.cta.strength}/10</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            "{state.analysis.cta.current}"
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-semibold mb-3">Overall Assessment</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Viral Score:</span>
                          <span className={cn("font-medium", getScoreColor(state.analysis.overall.viralScore))}>
                            {state.analysis.overall.viralScore}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Improvement Potential:</span>
                          <span className="font-medium text-green-600">
                            +{state.analysis.overall.improvementPotential}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h5 className="font-medium text-sm mb-2">Priority Areas</h5>
                        <div className="flex flex-wrap gap-2">
                          {state.analysis.overall.priorityAreas.map((area, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="patterns" className="mt-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Viral Patterns Library
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Proven patterns that increase viral potential
                  </p>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <h5 className="font-medium text-sm">Pattern Interrupt Hook</h5>
                      <p className="text-xs text-muted-foreground mt-1">
                        87% success rate • Start with unexpected statement
                      </p>
                      <p className="text-xs mt-2 italic">
                        "Stop everything you're doing..." or "This is not what you think..."
                      </p>
                    </div>
                    
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                      <h5 className="font-medium text-sm">Problem-Agitation-Solution</h5>
                      <p className="text-xs text-muted-foreground mt-1">
                        82% success rate • Identify pain, agitate, solve
                      </p>
                      <p className="text-xs mt-2 italic">
                        "Tired of low engagement? Here's why..."
                      </p>
                    </div>
                    
                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <h5 className="font-medium text-sm">Social Proof Stack</h5>
                      <p className="text-xs text-muted-foreground mt-1">
                        79% success rate • Layer multiple credibility signals
                      </p>
                      <p className="text-xs mt-2 italic">
                        "10,000+ creators use this..."
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Reset Button */}
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={resetOptimization}>
                Analyze New Content
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion State */}
      <AnimatePresence>
        {state.currentStep === 'complete' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className="p-6 text-center bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-200">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-700 mb-2">Optimization Complete!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your content is now optimized for viral success
              </p>
              
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{state.viralScore}%</div>
                  <div className="text-xs text-muted-foreground">Final Viral Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{state.appliedSuggestions.length}</div>
                  <div className="text-xs text-muted-foreground">Optimizations Applied</div>
                </div>
              </div>
              
              <Button onClick={resetOptimization} className="bg-green-600 hover:bg-green-700">
                Optimize Another
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}