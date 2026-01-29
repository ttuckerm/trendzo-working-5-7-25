'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Target, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedCopyViralWinnerButtonSimple } from './EnhancedCopyViralWinnerButton-simple';
import { EnhancedOptimizeForViralButton } from './EnhancedOptimizeForViralButton';
import { PlatformOptimizeButton, TrendzoMarketingButton } from './MagicButtons';
import { cn } from '@/lib/utils';

interface EnhancedMagicButtonPanelProps {
  className?: string;
  onTemplateCreated?: (templateData: any) => void;
}

export function EnhancedMagicButtonPanel({ 
  className, 
  onTemplateCreated 
}: EnhancedMagicButtonPanelProps) {
  const [activeTab, setActiveTab] = useState('viral');

  return (
    <Card className={cn("p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20", className)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Wand2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Magic Actions Studio
          </h2>
          <p className="text-sm text-muted-foreground">AI-powered viral content creation</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full mb-6">
          <TabsTrigger value="viral" className="text-xs">
            <Sparkles className="h-4 w-4 mr-1" />
            Viral
          </TabsTrigger>
          <TabsTrigger value="optimize" className="text-xs">
            <TrendingUp className="h-4 w-4 mr-1" />
            Optimize
          </TabsTrigger>
          <TabsTrigger value="platform" className="text-xs">
            <Target className="h-4 w-4 mr-1" />
            Platform
          </TabsTrigger>
          <TabsTrigger value="campaign" className="text-xs">
            <Wand2 className="h-4 w-4 mr-1" />
            Campaign
          </TabsTrigger>
        </TabsList>

        <TabsContent value="viral" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EnhancedCopyViralWinnerButtonSimple 
              onTemplateCreated={onTemplateCreated}
            />
          </motion.div>
        </TabsContent>

        <TabsContent value="optimize" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <EnhancedOptimizeForViralButton />
            
            <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
              <h3 className="font-semibold mb-2">AI Optimization Tools</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Analyze your content against viral patterns and get specific improvement suggestions.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Hook optimization with A/B testing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                  <span>Pacing analysis and timing improvements</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>CTA optimization for maximum conversion</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="platform" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 gap-4"
          >
            <PlatformOptimizeButton />
            
            <Card className="p-4 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
              <h3 className="font-semibold mb-2">Platform Specifications</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <h4 className="font-medium mb-1">TikTok</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• 9:16 vertical format</li>
                    <li>• 15-60 second optimal</li>
                    <li>• High-energy hooks</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">LinkedIn</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• 1:1 or 16:9 format</li>
                    <li>• 30-90 second optimal</li>
                    <li>• Professional tone</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Instagram</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• 9:16 for Reels</li>
                    <li>• 15-30 second optimal</li>
                    <li>• Visual storytelling</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">YouTube</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• 16:9 landscape</li>
                    <li>• 60+ seconds</li>
                    <li>• Detailed explanations</li>
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="campaign" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 gap-4"
          >
            <TrendzoMarketingButton />
            
            <Card className="p-4 bg-gradient-to-br from-orange-500/5 to-red-500/5">
              <h3 className="font-semibold mb-2">Campaign Types</h3>
              <div className="space-y-3">
                <div className="p-3 bg-white/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Product Launch</h4>
                  <p className="text-xs text-muted-foreground">
                    3-video sequence: Teaser → Features → Testimonials
                  </p>
                </div>
                <div className="p-3 bg-white/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Feature Spotlight</h4>
                  <p className="text-xs text-muted-foreground">
                    Problem → Solution Demo → Results showcase
                  </p>
                </div>
                <div className="p-3 bg-white/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">User Success</h4>
                  <p className="text-xs text-muted-foreground">
                    Before/After → Testimonial → How-to guide
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}