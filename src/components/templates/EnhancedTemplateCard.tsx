'use client';

import React from 'react';
import { useFeatureEnabled } from '@/lib/contexts/FeatureContext';
import { motion } from 'framer-motion';
import { TrendingTemplate } from '@/lib/types/trendingTemplate';
import { TikTokSound } from '@/lib/types/tiktok';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  TrendingUp, 
  Play, 
  Music, 
  Star, 
  BookOpen, 
  Award, 
  Eye,
  Calendar,
  BarChart,
  Lock,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { CardHoverReveal, CardHoverRevealMain, CardHoverRevealContent } from '@/components/ui/reveal-on-hover';
import { cn, formatNumber } from '@/lib/utils';

interface EnhancedTemplateCardProps {
  template: TrendingTemplate;
  sound?: TikTokSound | null;
  expertInput?: boolean;
  onClick?: () => void;
  onPlaySound?: () => void;
  onUseTemplate?: () => void;
  className?: string;
}

export const EnhancedTemplateCard: React.FC<EnhancedTemplateCardProps> = ({
  template,
  sound,
  expertInput = false,
  onClick,
  onPlaySound,
  onUseTemplate,
  className = '',
}) => {
  // Feature flags for tier-based features
  const isPremiumAnalyticsEnabled = useFeatureEnabled('PREMIUM_ANALYTICS');
  const isTemplateRemixEnabled = useFeatureEnabled('TEMPLATE_REMIX');
  const isTrendPredictionEnabled = useFeatureEnabled('TREND_PREDICTION');
  const isContentCalendarEnabled = useFeatureEnabled('CONTENT_CALENDAR');
  const isSoundAnalysisEnabled = useFeatureEnabled('SOUND_ANALYSIS');
  const isExpertInputsEnabled = useFeatureEnabled('EXPERT_INPUTS');

  // Calculate growth indicators
  const hasHighGrowth = template.growthRate > 80;
  const hasMediumGrowth = template.growthRate > 50 && template.growthRate <= 80;
  
  // Format engagement numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Show expert badge when expertInput is true and the feature is enabled
  const showExpertBadge = expertInput && isExpertInputsEnabled;

  const handleClick = () => {
    if (onClick) onClick();
    // Default action if no onClick provided
  };

  // Format popularity to appropriate class name
  const getPopularityClass = (pop: string) => {
    switch (pop.toLowerCase()) {
      case 'high': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-indigo-100 text-indigo-800';
      case 'low': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get category style based on name
  const getCategoryStyle = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'e-commerce': return 'bg-zinc-800';
      case 'education': return 'bg-zinc-800';
      case 'entertainment': return 'bg-zinc-800';
      case 'branding': return 'bg-zinc-800';
      case 'marketing': return 'bg-zinc-800';
      case 'social proof': return 'bg-zinc-800';
      default: return 'bg-zinc-800';
    }
  };

  return (
    <CardHoverReveal 
      className={`h-[350px] w-full rounded-xl border overflow-hidden shadow-sm transition-shadow hover:shadow-md ${className}`}
      onClick={handleClick}
    >
      <CardHoverRevealMain>
        <div className="relative w-full h-full">
          <Image
            src={template.coverImage || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=2532&auto=format&fit=crop'}
            alt={template.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        </div>
      </CardHoverRevealMain>

      {/* Category badge */}
      <div className="absolute top-4 right-4 px-2 py-1 rounded-md bg-zinc-800 bg-opacity-75 text-white text-xs font-medium">
        {template.category || 'Unknown'}
      </div>

      {/* Default content - always visible */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
        <h3 className="text-lg font-medium line-clamp-1">{template.title}</h3>
        <p className="text-white/80 text-sm line-clamp-1">{template.description}</p>
      </div>

      <CardHoverRevealContent className="space-y-4 rounded-2xl bg-zinc-900/75 text-zinc-50">
        <div className="space-y-2">
          <h3 className="text-sm text-opacity-60">Category</h3>
          <div className="flex flex-wrap gap-2">
            <div className={cn("rounded-full px-2 py-1", getCategoryStyle(template.category || 'Unknown'))}>
              <p className="text-xs leading-normal">{template.category || 'Unknown'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm text-opacity-60">AI Suggestions</h3>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full bg-[hsl(18,56%,32%)] px-2 py-1">
              <p className="text-xs leading-normal">{template.aiSuggestionCount} available</p>
            </div>
            <div className="rounded-full bg-[hsl(18,56%,32%)] px-2 py-1">
              <p className="text-xs leading-normal">{template.duration ? `${template.duration}s` : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm text-opacity-60">Details</h3>
          <div className="flex flex-wrap gap-2">
            <p className="text-sm text-card">
              {template.description}
            </p>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs">{formatNumber(template.stats?.viewCount || 0)} views</span>
            <Button size="sm" variant="secondary" className="h-8 px-2 py-1">
              Remix <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardHoverRevealContent>
    </CardHoverReveal>
  );
};

export default EnhancedTemplateCard; 