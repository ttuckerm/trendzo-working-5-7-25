'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Shield, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription, SubscriptionTier } from '@/lib/contexts/SubscriptionContext';

interface PremiumUpgradePromptProps {
  requiredTier?: SubscriptionTier;
  title?: string;
  description?: string;
  features?: string[];
  className?: string;
  variant?: 'banner' | 'card' | 'inline' | 'modal';
  onDismiss?: () => void;
}

/**
 * PremiumUpgradePrompt - A component to prompt users to upgrade to premium
 * Can be displayed in various formats: banner, card, inline, or modal
 */
export function PremiumUpgradePrompt({
  requiredTier = 'premium',
  title,
  description,
  features = [],
  className,
  variant = 'banner',
  onDismiss
}: PremiumUpgradePromptProps) {
  const { tier, canAccess } = useSubscription();
  
  // If user already has access to the required tier, don't show the prompt
  if (canAccess(requiredTier)) {
    return null;
  }
  
  // Determine tier-specific details
  const Icon = requiredTier === 'business' ? Shield : Sparkles;
  const tierLabel = requiredTier === 'business' ? 'Business' : 'Premium';
  
  // Determine tier-specific colors
  const tierColorClasses = {
    banner: {
      bg: requiredTier === 'business' 
        ? 'bg-gradient-to-r from-purple-100 to-purple-50 border-purple-200' 
        : 'bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200',
      iconBg: requiredTier === 'business'
        ? 'bg-purple-100' 
        : 'bg-amber-100',
      icon: requiredTier === 'business'
        ? 'text-purple-600' 
        : 'text-amber-600',
      button: requiredTier === 'business'
        ? 'bg-purple-600 hover:bg-purple-700' 
        : 'bg-amber-600 hover:bg-amber-700'
    },
    card: {
      header: requiredTier === 'business'
        ? 'bg-purple-600' 
        : 'bg-amber-600',
      iconBg: requiredTier === 'business'
        ? 'bg-purple-100 text-purple-600' 
        : 'bg-amber-100 text-amber-600',
      button: requiredTier === 'business'
        ? 'bg-purple-600 hover:bg-purple-700' 
        : 'bg-amber-600 hover:bg-amber-700'
    },
    inline: {
      icon: requiredTier === 'business'
        ? 'text-purple-500' 
        : 'text-amber-500',
      link: requiredTier === 'business'
        ? 'text-purple-600 hover:text-purple-700' 
        : 'text-amber-600 hover:text-amber-700'
    },
    modal: {
      iconBg: requiredTier === 'business'
        ? 'bg-purple-100' 
        : 'bg-amber-100',
      icon: requiredTier === 'business'
        ? 'text-purple-600' 
        : 'text-amber-600',
      featureIconBg: requiredTier === 'business'
        ? 'bg-purple-100 text-purple-600' 
        : 'bg-amber-100 text-amber-600',
      button: requiredTier === 'business'
        ? 'bg-purple-600 hover:bg-purple-700' 
        : 'bg-amber-600 hover:bg-amber-700'
    }
  };
  
  // Default content based on tier
  const defaultTitle = `Upgrade to ${tierLabel}`;
  const defaultDescription = requiredTier === 'business' 
    ? 'Get access to advanced business features and team collaboration tools.'
    : 'Unlock premium features and take your content to the next level.';
  
  // Default features list based on tier
  const defaultFeatures = requiredTier === 'business' 
    ? ['Team collaboration', 'Advanced analytics', 'API access', 'Dedicated support'] 
    : ['Access all templates', 'Advanced analytics', 'Trend predictions', 'Priority support'];
  
  // Use provided content or defaults
  const promptTitle = title || defaultTitle;
  const promptDescription = description || defaultDescription;
  const promptFeatures = features.length > 0 ? features : defaultFeatures;
  
  // Render different variants
  switch (variant) {
    case 'banner':
      return (
        <div className={cn(
          "border rounded-lg p-4 my-4 relative",
          tierColorClasses.banner.bg,
          className
        )}>
          {onDismiss && (
            <button 
              onClick={onDismiss}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          <div className="flex items-start">
            <div className={cn("p-2 rounded-full mr-4 flex-shrink-0", tierColorClasses.banner.iconBg)}>
              <Icon className={cn("h-5 w-5", tierColorClasses.banner.icon)} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{promptTitle}</h3>
              <p className="text-sm text-gray-600 mt-1 mb-3">{promptDescription}</p>
              <Link 
                href="/pricing" 
                className={cn(
                  "inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors",
                  tierColorClasses.banner.button
                )}
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        </div>
      );
      
    case 'card':
      return (
        <div className={cn(
          "border border-gray-200 rounded-xl overflow-hidden shadow-sm",
          className
        )}>
          <div className={cn("p-4 text-white", tierColorClasses.card.header)}>
            <div className="flex items-center">
              <Icon className="h-5 w-5 mr-2" />
              <h3 className="font-medium">{promptTitle}</h3>
            </div>
          </div>
          
          <div className="p-4">
            <p className="text-gray-600 mb-4">{promptDescription}</p>
            
            <ul className="space-y-2 mb-4">
              {promptFeatures.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className={cn(
                    "inline-flex items-center justify-center h-5 w-5 rounded-full mr-2 flex-shrink-0",
                    tierColorClasses.card.iconBg
                  )}>
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            <Link 
              href="/pricing" 
              className={cn(
                "w-full inline-flex justify-center items-center rounded-md px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors",
                tierColorClasses.card.button
              )}
            >
              Upgrade to {tierLabel}
            </Link>
          </div>
        </div>
      );
      
    case 'inline':
      return (
        <div className={cn(
          "flex items-center space-x-3 text-sm",
          className
        )}>
          <Icon className={cn("h-4 w-4", tierColorClasses.inline.icon)} />
          <span>{promptDescription}</span>
          <Link 
            href="/pricing" 
            className={cn(
              "font-medium hover:underline transition-colors",
              tierColorClasses.inline.link
            )}
          >
            Upgrade
          </Link>
        </div>
      );
      
    case 'modal':
      return (
        <div className={cn(
          "bg-white rounded-xl shadow-xl p-6 max-w-md mx-auto",
          className
        )}>
          {onDismiss && (
            <button 
              onClick={onDismiss}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          <div className="text-center mb-6">
            <div className={cn(
              "inline-flex items-center justify-center h-12 w-12 rounded-full mx-auto mb-4",
              tierColorClasses.modal.iconBg
            )}>
              <Icon className={cn("h-6 w-6", tierColorClasses.modal.icon)} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">{promptTitle}</h3>
            <p className="text-gray-600 mt-2">{promptDescription}</p>
          </div>
          
          <ul className="space-y-3 mb-6">
            {promptFeatures.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className={cn(
                  "inline-flex items-center justify-center h-5 w-5 rounded-full mr-2 flex-shrink-0",
                  tierColorClasses.modal.featureIconBg
                )}>
                  <Icon className="h-3 w-3" />
                </span>
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          
          <div className="flex flex-col space-y-2">
            <Link 
              href="/pricing" 
              className={cn(
                "inline-flex justify-center items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors",
                tierColorClasses.modal.button
              )}
            >
              See Pricing Plans
            </Link>
            {onDismiss && (
              <button 
                onClick={onDismiss}
                className="text-gray-600 text-sm hover:text-gray-800"
              >
                Maybe later
              </button>
            )}
          </div>
        </div>
      );
      
    default:
      return null;
  }
} 