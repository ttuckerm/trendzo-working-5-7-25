'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/ui-compatibility';
import Link from 'next/link';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';

interface UpgradePlanButtonProps {
  className?: string;
  variant?: 'default' | 'prominent' | 'subtle';
  showPlanStatus?: boolean;
}

/**
 * Upgrade Plan Button Component
 * 
 * Displays the current subscription plan and an upgrade button
 * Can be used in the sidebar or other areas of the application
 */
export default function UpgradePlanButton({ 
  className = '', 
  variant = 'default',
  showPlanStatus = true 
}: UpgradePlanButtonProps) {
  const { tier, hasPremium } = useSubscription();
  
  // Skip rendering for business tier users
  if (tier === 'business') {
    return showPlanStatus ? (
      <div className="flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-md">
        <Sparkles className="w-3 h-3 mr-1" />
        Business Plan
      </div>
    ) : null;
  }
  
  // For premium users, show the status but no button
  if (tier === 'premium') {
    return showPlanStatus ? (
      <div className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-md">
        <Sparkles className="w-3 h-3 mr-1" />
        Premium Plan
      </div>
    ) : null;
  }
  
  // Styles based on variant
  const getButtonStyles = () => {
    switch (variant) {
      case 'prominent':
        return "w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white";
      case 'subtle':
        return "text-blue-600 hover:text-blue-800";
      default:
        return "bg-blue-50 text-blue-700 hover:bg-blue-100";
    }
  };
  
  // For free tier users, show the upgrade button
  return (
    <div className={`${className}`}>
      {showPlanStatus && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Current Plan:</span>
          <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
            Free
          </span>
        </div>
      )}
      
      <Link href="/pricing" className="w-full block">
        <Button
          className={`text-sm flex items-center justify-center ${getButtonStyles()}`}
          size="sm"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Upgrade to Premium
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
} 