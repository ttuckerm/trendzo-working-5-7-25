'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Shield, Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription, SubscriptionTier } from '@/lib/contexts/SubscriptionContext';

interface PremiumFeaturePreviewProps {
  requiredTier?: SubscriptionTier;
  title?: string;
  description?: string;
  previewDuration?: number; // Duration in seconds for preview mode
  children: React.ReactNode;
  blurIntensity?: 'light' | 'medium' | 'heavy';
  previewImage?: string;
  className?: string;
  showUpgradeLink?: boolean;
}

/**
 * PremiumFeaturePreview - A component to show a preview of premium features
 * Shows blurred content with an option to preview for a limited time
 */
export function PremiumFeaturePreview({
  requiredTier = 'premium',
  title,
  description,
  previewDuration = 30,
  children,
  blurIntensity = 'medium',
  previewImage,
  className,
  showUpgradeLink = true
}: PremiumFeaturePreviewProps) {
  const { tier, canAccess } = useSubscription();
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [previewTimeLeft, setPreviewTimeLeft] = useState(previewDuration);
  
  // If user already has access, show the actual content
  if (canAccess(requiredTier)) {
    return <>{children}</>;
  }
  
  // Determine tier-specific details
  const Icon = requiredTier === 'business' ? Shield : Sparkles;
  const tierLabel = requiredTier === 'business' ? 'Business' : 'Premium';
  
  // Default content based on tier
  const defaultTitle = `${tierLabel} Feature`;
  const defaultDescription = requiredTier === 'business' 
    ? 'This feature is only available to Business tier subscribers.'
    : 'This feature is only available to Premium tier subscribers.';
  
  // Use provided content or defaults
  const contentTitle = title || defaultTitle;
  const contentDescription = description || defaultDescription;
  
  // Get the blur amount based on intensity
  const getBlurAmount = () => {
    switch (blurIntensity) {
      case 'light': return 'blur-sm';
      case 'medium': return 'blur-md';
      case 'heavy': return 'blur-lg';
      default: return 'blur-md';
    }
  };
  
  // Start preview mode
  const startPreview = () => {
    setIsPreviewActive(true);
    setPreviewTimeLeft(previewDuration);
    
    // Create countdown timer
    const timer = setInterval(() => {
      setPreviewTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsPreviewActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Cleanup on unmount
    return () => clearInterval(timer);
  };

  // Determine tier-specific colors
  const iconBgClass = requiredTier === 'business' ? 'bg-purple-100' : 'bg-amber-100';
  const iconTextClass = requiredTier === 'business' ? 'text-purple-600' : 'text-amber-600';
  const buttonBgClass = requiredTier === 'business' ? 'bg-purple-100 hover:bg-purple-200 text-purple-800' : 'bg-amber-100 hover:bg-amber-200 text-amber-800';
  const upgradeBgClass = requiredTier === 'business' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-amber-600 hover:bg-amber-700';
  
  // Render the preview or blurred content
  return (
    <div className={cn("relative", className)}>
      {/* The actual content with blur when not in preview mode */}
      <div className={cn(
        "transition-all duration-500",
        !isPreviewActive && getBlurAmount()
      )}>
        {children}
      </div>
      
      {/* Overlay when not in preview mode */}
      {!isPreviewActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className={cn("p-2 rounded-full mb-3", iconBgClass)}>
            <Icon className={cn("h-5 w-5", iconTextClass)} />
          </div>
          
          <h3 className="text-lg font-medium mb-2">{contentTitle}</h3>
          <p className="text-sm text-gray-600 mb-4 max-w-md">{contentDescription}</p>
          
          {previewImage && (
            <div className="relative w-full max-w-md h-48 mb-4 rounded-lg overflow-hidden">
              <Image 
                src={previewImage}
                alt={contentTitle}
                fill
                className="rounded-lg object-cover"
              />
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={startPreview}
              className={cn(
                "inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
                buttonBgClass
              )}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview for {previewDuration} seconds
            </button>
            
            {showUpgradeLink && (
              <Link
                href="/pricing"
                className={cn(
                  "inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white transition-colors",
                  upgradeBgClass
                )}
              >
                <Lock className="h-4 w-4 mr-2" />
                Upgrade to {tierLabel}
              </Link>
            )}
          </div>
        </div>
      )}
      
      {/* Preview mode timer indicator */}
      {isPreviewActive && (
        <div className="absolute top-4 right-4 bg-white/90 rounded-full px-3 py-1 text-xs font-medium shadow-md flex items-center">
          <EyeOff className="h-3 w-3 mr-1.5 text-gray-600" />
          Preview ends in {previewTimeLeft}s
        </div>
      )}
    </div>
  );
} 