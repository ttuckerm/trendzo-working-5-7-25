'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Zap, Target, Sparkles, TrendingUp, Globe, Wand2, Check, Loader2, ArrowRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface MagicButtonProps {
  variant?: 'default' | 'viral' | 'optimize' | 'platform';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => Promise<void>;
  disabled?: boolean;
}

export function CopyViralWinnerButton({ onClick, disabled, className }: MagicButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (onClick) await onClick();
      setIsSuccess(true);
      toast({
        title: "Viral Template Copied!",
        description: "Your new template is ready for customization",
      });
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn(
          "relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600",
          "hover:from-purple-700 hover:to-pink-700 text-white",
          "shadow-lg hover:shadow-xl transition-all duration-300",
          "h-20 px-6 flex flex-col items-center justify-center gap-2"
        )}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Loader2 className="h-6 w-6 animate-spin" />
            </motion.div>
          ) : isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Check className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Copy className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="font-semibold">Copy Viral Winner</span>
        <span className="text-xs opacity-80">Clone & customize instantly</span>
        
        {/* Animated background effect */}
        <motion.div
          className="absolute inset-0 bg-white/20"
          initial={{ x: '-100%' }}
          animate={isLoading ? { x: '100%' } : { x: '-100%' }}
          transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
        />
      </Button>
    </motion.div>
  );
}

export function OptimizeForViralButton({ onClick, disabled, className }: MagicButtonProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleClick = async () => {
    setIsOptimizing(true);
    setProgress(0);
    
    // Simulate optimization progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    try {
      if (onClick) await onClick();
      setTimeout(() => {
        setIsOptimizing(false);
        setProgress(0);
        toast({
          title: "Optimization Complete!",
          description: "Your content has been optimized for maximum virality",
        });
      }, 2000);
    } catch (error) {
      clearInterval(interval);
      setIsOptimizing(false);
      setProgress(0);
      toast({
        title: "Optimization Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Button
        onClick={handleClick}
        disabled={disabled || isOptimizing}
        className={cn(
          "relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600",
          "hover:from-blue-700 hover:to-cyan-700 text-white",
          "shadow-lg hover:shadow-xl transition-all duration-300",
          "h-20 px-6 flex flex-col items-center justify-center gap-2"
        )}
      >
        <Zap className="h-6 w-6" />
        <span className="font-semibold">Optimize for Viral</span>
        <span className="text-xs opacity-80">AI-powered enhancement</span>
        
        {/* Progress overlay */}
        <AnimatePresence>
          {isOptimizing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 flex items-center justify-center"
            >
              <div className="w-32">
                <Progress value={progress} className="h-2" />
                <p className="text-xs mt-1 text-center">{progress}%</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}

export function PlatformOptimizeButton({ onClick, disabled, className }: MagicButtonProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const platforms = [
    { id: 'tiktok', icon: '📱', name: 'TikTok' },
    { id: 'instagram', icon: '📷', name: 'Instagram' },
    { id: 'youtube', icon: '📺', name: 'YouTube' },
    { id: 'linkedin', icon: '💼', name: 'LinkedIn' },
  ];

  const handleClick = async () => {
    setIsOptimizing(true);
    try {
      if (onClick) await onClick();
      toast({
        title: "Platform Optimization Started",
        description: `Optimizing for ${selectedPlatforms.length || 'all'} platforms`,
      });
      setTimeout(() => setIsOptimizing(false), 2000);
    } catch (error) {
      setIsOptimizing(false);
      toast({
        title: "Optimization Failed",
        description: "Could not optimize for platforms",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Button
        onClick={handleClick}
        disabled={disabled || isOptimizing}
        className={cn(
          "relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600",
          "hover:from-green-700 hover:to-emerald-700 text-white",
          "shadow-lg hover:shadow-xl transition-all duration-300",
          "h-20 px-6 flex flex-col items-center justify-center gap-2"
        )}
      >
        <Target className="h-6 w-6" />
        <span className="font-semibold">Platform Optimize</span>
        <span className="text-xs opacity-80">Multi-platform magic</span>
        
        {/* Platform indicators */}
        <div className="absolute top-2 right-2 flex gap-1">
          {platforms.map(platform => (
            <span key={platform.id} className="text-xs">
              {platform.icon}
            </span>
          ))}
        </div>
      </Button>
    </motion.div>
  );
}

export function TrendzoMarketingButton({ onClick, disabled, className }: MagicButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setIsGenerating(true);
    try {
      if (onClick) await onClick();
      toast({
        title: "Trendzo Marketing Campaign Created",
        description: "Your personalized campaign is ready",
      });
    } catch (error) {
      toast({
        title: "Campaign Creation Failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Button
        onClick={handleClick}
        disabled={disabled || isGenerating}
        className={cn(
          "relative overflow-hidden bg-gradient-to-r from-orange-600 to-red-600",
          "hover:from-orange-700 hover:to-red-700 text-white",
          "shadow-lg hover:shadow-xl transition-all duration-300",
          "h-20 px-6 flex flex-col items-center justify-center gap-2"
        )}
      >
        <Sparkles className="h-6 w-6" />
        <span className="font-semibold">Trendzo Campaign</span>
        <span className="text-xs opacity-80">Auto-generate marketing</span>
        
        {/* Animated sparkles */}
        <AnimatePresence>
          {isGenerating && (
            <>
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: Math.random() * 100 - 50,
                    y: Math.random() * 100 - 50
                  }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1, 0],
                    y: [0, -50]
                  }}
                  transition={{ 
                    duration: 1, 
                    delay: i * 0.2,
                    repeat: Infinity
                  }}
                >
                  <Sparkles className="h-4 w-4 text-white" />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}

// Magic Button Group Component
export function MagicButtonGroup({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      <CopyViralWinnerButton />
      <OptimizeForViralButton />
      <PlatformOptimizeButton />
      <TrendzoMarketingButton />
    </div>
  );
}

// Quick Action Card
export function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  onClick,
  gradient = "from-purple-500 to-pink-500"
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick?: () => void;
  gradient?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
    >
      <Card 
        className={cn(
          "p-6 cursor-pointer overflow-hidden relative group",
          "border-2 border-transparent hover:border-purple-500/50",
          "transition-all duration-300"
        )}
        onClick={onClick}
      >
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10",
          "transition-opacity duration-300",
          gradient
        )} />
        
        <div className="relative z-10">
          <div className={cn(
            "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center mb-4",
            gradient
          )}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          
          <div className="flex items-center text-sm font-medium text-purple-600">
            Get Started
            <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}