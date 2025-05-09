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
  Lock
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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

  return (
    <Card 
      className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${className}`}
      onClick={onClick}
    >
      <CardHeader className="p-0 relative">
        <div className="relative h-48 w-full bg-slate-100">
          {template.coverImage ? (
            <Image
              src={template.coverImage}
              alt={template.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-200">
              <span className="text-slate-400">No image</span>
            </div>
          )}
          
          {/* Growth badge */}
          {hasHighGrowth && (
            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500">
              <TrendingUp size={14} className="mr-1" /> Trending
            </Badge>
          )}
          
          {hasMediumGrowth && (
            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-500">
              <TrendingUp size={14} className="mr-1" /> Rising
            </Badge>
          )}
          
          {/* Expert input badge */}
          {showExpertBadge && (
            <Badge className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-amber-500">
              <Star size={14} className="mr-1" /> Expert
            </Badge>
          )}
          
          {/* Sound indicator - only shown if sound analysis is enabled */}
          {sound && isSoundAnalysisEnabled && (
            <div 
              className="absolute bottom-2 left-2 flex items-center bg-black/70 text-white text-xs px-2 py-1 rounded-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onPlaySound?.();
              }}
            >
              <Music size={14} className="mr-1" />
              <span className="truncate max-w-[140px]">{sound.title}</span>
            </div>
          )}
          
          {/* Duration indicator */}
          <div className="absolute bottom-2 right-2 flex items-center bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            <Clock size={14} className="mr-1" />
            <span>{template.duration ? `${template.duration}s` : 'N/A'}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-base line-clamp-1">{template.title}</h3>
        
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <Eye size={14} className="mr-1" />
          <span className="mr-3">{formatNumber(template.stats?.viewCount || 0)} views</span>
          
          <BookOpen size={14} className="mr-1" />
          <span>{template.category || 'Unknown'}</span>
        </div>
        
        {/* Premium analytics preview - shown if enabled or with lock icon */}
        <div className="mt-3 text-xs">
          {isPremiumAnalyticsEnabled ? (
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="flex items-center">
                <TrendingUp size={12} className="mr-1" /> 
                {template.growthRate}% Growth
              </Badge>
              
              <Badge variant="outline" className="flex items-center">
                <Award size={12} className="mr-1" /> 
                {template.engagementRate}% Engagement
              </Badge>
            </div>
          ) : (
            <div className="flex items-center text-gray-400">
              <Lock size={14} className="mr-1" />
              <span>Premium analytics available</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between gap-2">
        <Button 
          variant="outline" 
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onUseTemplate?.();
          }}
        >
          Use Template
        </Button>
        
        {/* Show these buttons only if the features are enabled */}
        {isPremiumAnalyticsEnabled && (
          <Button
            variant="ghost"
            size="icon"
            className="flex-none"
            title="View Analytics"
            asChild
          >
            <Link href={`/analytics?templateId=${template.id}`}>
              <BarChart size={18} />
            </Link>
          </Button>
        )}
        
        {isTrendPredictionEnabled && (
          <Button
            variant="ghost"
            size="icon"
            className="flex-none"
            title="View Predictions"
            asChild
          >
            <Link href={`/trend-predictions?templateId=${template.id}`}>
              <TrendingUp size={18} />
            </Link>
          </Button>
        )}
        
        {isContentCalendarEnabled && (
          <Button
            variant="ghost"
            size="icon"
            className="flex-none"
            title="Add to Calendar"
            asChild
          >
            <Link href={`/content-calendar?add=${template.id}`}>
              <Calendar size={18} />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EnhancedTemplateCard; 