'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription, SubscriptionTier } from '@/lib/contexts/SubscriptionContext';

interface PremiumFeatureBadgeProps {
  requiredTier: SubscriptionTier;
  className?: string;
  showIcon?: boolean;
  showLabel?: boolean;
  variant?: 'badge' | 'tag' | 'inline' | 'block';
}

/**
 * PremiumFeatureBadge - A component to indicate premium features
 * Can be used as a badge, tag, or inline indicator
 */
export function PremiumFeatureBadge({
  requiredTier = 'premium',
  className,
  showIcon = true,
  showLabel = true,
  variant = 'badge',
}: PremiumFeatureBadgeProps) {
  const { tier, canAccess } = useSubscription();
  const hasAccess = canAccess(requiredTier);
  
  // Determine the icon based on the required tier
  const Icon = requiredTier === 'business' ? Shield : Sparkles;
  const tierLabel = requiredTier === 'business' ? 'Business' : 'Premium';
  
  // Determine tier-specific colors
  const tierColorClasses = {
    badge: requiredTier === 'business' 
      ? 'bg-purple-50 text-purple-700 border-purple-200' 
      : 'bg-amber-50 text-amber-700 border-amber-200',
    tag: requiredTier === 'business'
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-amber-100 text-amber-800',
    inline: requiredTier === 'business'
      ? 'text-purple-600' 
      : 'text-amber-600',
    iconColor: requiredTier === 'business'
      ? 'text-purple-500' 
      : 'text-amber-500',
    block: {
      bg: requiredTier === 'business'
        ? 'bg-purple-50 border-purple-200' 
        : 'bg-amber-50 border-amber-200',
      icon: requiredTier === 'business'
        ? 'text-purple-500' 
        : 'text-amber-500',
      title: requiredTier === 'business'
        ? 'text-purple-700' 
        : 'text-amber-700',
      button: requiredTier === 'business'
        ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' 
        : 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    }
  };
  
  // If user already has access, return null or minimal indicator
  if (hasAccess && variant !== 'block') {
    if (variant === 'inline') {
      return (
        <span className={cn("inline-flex items-center text-xs", className)}>
          {showIcon && <Icon className={cn("h-3 w-3 mr-1", tierColorClasses.iconColor)} />}
        </span>
      );
    }
    return null;
  }
  
  // Render different variants
  switch (variant) {
    case 'badge':
      return (
        <div className={cn(
          "rounded-md px-2 py-1 text-xs font-medium inline-flex items-center border",
          tierColorClasses.badge,
          className
        )}>
          {showIcon && <Icon className={cn("h-3 w-3 mr-1", tierColorClasses.iconColor)} />}
          {showLabel && tierLabel}
        </div>
      );
      
    case 'tag':
      return (
        <div className={cn(
          "absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium inline-flex items-center",
          tierColorClasses.tag,
          className
        )}>
          {showIcon && <Icon className={cn("h-3 w-3 mr-1", tierColorClasses.iconColor)} />}
          {showLabel && tierLabel}
        </div>
      );
      
    case 'inline':
      return (
        <span className={cn(
          "inline-flex items-center text-xs font-medium",
          tierColorClasses.inline,
          className
        )}>
          {showIcon && <Icon className={cn("h-3 w-3 mr-1", tierColorClasses.iconColor)} />}
          {showLabel && tierLabel}
        </span>
      );
      
    case 'block':
      return (
        <div className={cn(
          "border rounded-lg p-4 text-center",
          tierColorClasses.block.bg,
          className
        )}>
          <div className="flex flex-col items-center justify-center space-y-2">
            {showIcon && <Icon className={cn("h-6 w-6", tierColorClasses.block.icon)} />}
            <h4 className={cn("font-medium", tierColorClasses.block.title)}>
              {hasAccess ? `${tierLabel} Feature` : `${tierLabel} Only`}
            </h4>
            {!hasAccess && (
              <p className="text-sm text-gray-600 mb-3">
                Upgrade your plan to access this feature
              </p>
            )}
            {!hasAccess && (
              <Link href="/pricing" className={cn(
                "inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tierColorClasses.block.button
              )}>
                Upgrade Now
                <span className="ml-1.5">→</span>
              </Link>
            )}
          </div>
        </div>
      );
      
    default:
      return null;
  }
} 