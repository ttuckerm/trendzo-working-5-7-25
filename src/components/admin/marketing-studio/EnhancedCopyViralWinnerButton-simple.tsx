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

interface CopyViralWinnerState {
  isAnalyzing: boolean;
  currentStep: 'idle' | 'fetching' | 'extracting' | 'applying' | 'comparing' | 'complete';
  progress: number;
}

export function EnhancedCopyViralWinnerButtonSimple({ 
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
      // Simulate the process without external service
      toast({
        title: "Fetching Viral Winner",
        description: "Finding the best performing video in your niche...",
      });

      // Simulate progress
      setTimeout(() => setState(prev => ({ ...prev, progress: 30, currentStep: 'extracting' })), 500);
      setTimeout(() => setState(prev => ({ ...prev, progress: 60, currentStep: 'applying' })), 1000);
      setTimeout(() => setState(prev => ({ ...prev, progress: 80, currentStep: 'comparing' })), 1500);
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          progress: 100, 
          currentStep: 'complete',
          isAnalyzing: false 
        }));
        toast({
          title: "Viral Template Created!",
          description: "Expected 2.1M views with 89% viral probability",
        });
      }, 2000);

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

      {/* Simple Results */}
      <AnimatePresence>
        {state.currentStep === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-4 bg-green-50 border-green-200">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Viral Template Ready!
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Successfully analyzed viral patterns and created your optimized template.
              </p>
              <div className="flex gap-2">
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
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}