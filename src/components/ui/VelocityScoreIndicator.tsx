import React from 'react';
import { TrendingUp, HelpCircle } from 'lucide-react';
import { 
  Badge,
  TooltipProvider, 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger
} from '@/components/ui/ui-compatibility';

interface VelocityScoreIndicatorProps {
  velocityScore?: number;
  showIcon?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean; // New prop to optionally disable tooltip
}

/**
 * Displays a velocity score with appropriate styling and information
 * Velocity scores typically range from 0-10
 */
export default function VelocityScoreIndicator({ 
  velocityScore = 0, 
  showIcon = true,
  showLabel = true,
  size = 'md',
  className = '',
  showTooltip = true
}: VelocityScoreIndicatorProps) {
  // Format velocity score to 1 decimal place
  const formattedScore = velocityScore.toFixed(1);
  
  // Determine color based on velocity score
  const getVelocityColor = () => {
    if (velocityScore >= 7) return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
    if (velocityScore >= 5) return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200';
    if (velocityScore >= 3) return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
    return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
  };
  
  // Determine text size based on the size prop
  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-base font-semibold';
      default: return 'text-sm font-medium';
    }
  };
  
  // Get icon size based on the size prop
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-3 w-3';
      case 'lg': return 'h-5 w-5';
      default: return 'h-4 w-4';
    }
  };
  
  // Determine padding based on size
  const getPadding = () => {
    switch (size) {
      case 'sm': return 'px-1.5 py-0.5';
      case 'lg': return 'px-3 py-1.5';
      default: return 'px-2 py-1';
    }
  };
  
  // Determine velocity description
  const getVelocityDescription = () => {
    if (velocityScore >= 7) return 'Very high velocity - trending rapidly with significant viral potential';
    if (velocityScore >= 5) return 'High velocity - trending quickly and gaining strong momentum';
    if (velocityScore >= 3) return 'Moderate velocity - steady growth with consistent audience engagement';
    return 'Low velocity - slow growth with limited trending potential';
  };
  
  // Get more detailed information for the tooltip
  const getDetailedInformation = () => {
    if (velocityScore >= 7) {
      return (
        <div className="space-y-2">
          <div className="bg-red-50 p-2 rounded-md">
            <p className="text-sm text-red-800 font-medium">Going Viral!</p>
            <p className="text-xs text-red-700">This template is experiencing rapid growth and may become a major trend.</p>
          </div>
          <p className="text-xs">Templates with this score typically see 5-10x higher adoption rates.</p>
        </div>
      );
    }
    if (velocityScore >= 5) {
      return (
        <div className="space-y-2">
          <div className="bg-amber-50 p-2 rounded-md">
            <p className="text-sm text-amber-800 font-medium">Strong Performer</p>
            <p className="text-xs text-amber-700">This template is outpacing most others in its category.</p>
          </div>
          <p className="text-xs">Templates with this score typically see 3-5x higher adoption rates.</p>
        </div>
      );
    }
    if (velocityScore >= 3) {
      return (
        <div className="space-y-2">
          <div className="bg-green-50 p-2 rounded-md">
            <p className="text-sm text-green-800 font-medium">Steady Growth</p>
            <p className="text-xs text-green-700">This template is growing at a healthy, sustainable rate.</p>
          </div>
          <p className="text-xs">Templates with this score typically see 1.5-3x higher adoption rates.</p>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <div className="bg-blue-50 p-2 rounded-md">
          <p className="text-sm text-blue-800 font-medium">Early Stage</p>
          <p className="text-xs text-blue-700">This template is in its early growth phase with potential for more.</p>
        </div>
        <p className="text-xs">Templates with this score may be niche or newly emerging trends.</p>
      </div>
    );
  };

  // Simple badge without tooltip
  if (!showTooltip) {
    return (
      <Badge 
        variant="outline" 
        className={`${getVelocityColor()} ${getTextSize()} ${getPadding()} ${className} flex items-center gap-1 transition-colors`}
      >
        {showIcon && <TrendingUp className={getIconSize()} />}
        {showLabel && <span>Velocity:</span>}
        <span className="font-medium">{formattedScore}</span>
      </Badge>
    );
  }

  // With tooltip - using simpler approach avoiding asChild
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge 
            variant="outline" 
            className={`${getVelocityColor()} ${getTextSize()} ${getPadding()} ${className} flex items-center gap-1 transition-colors`}
          >
            {showIcon && <TrendingUp className={getIconSize()} />}
            {showLabel && <span>Velocity:</span>}
            <span className="font-medium">{formattedScore}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="w-64">
          <div className="space-y-2 max-w-xs">
            <p className="font-medium">Velocity Score: {formattedScore}</p>
            <p className="text-sm">{getVelocityDescription()}</p>
            {getDetailedInformation()}
            <div className="pt-2 border-t border-gray-200 mt-2">
              <p className="text-xs text-muted-foreground">
                Measures how rapidly this template is growing relative to others. Higher scores indicate faster trending potential.
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 