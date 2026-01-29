'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card-component';
import { Crown, ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';

interface UpgradePlanAlertProps {
  title: string;
  description: string;
  currentTier: string;
  requiredTier: string;
  ctaText?: string;
  ctaLink?: string;
}

/**
 * Component displayed when a user tries to access a feature that requires a higher tier subscription
 */
export function UpgradePlanAlert({
  title,
  description,
  currentTier,
  requiredTier,
  ctaText = 'Upgrade Now',
  ctaLink = '/pricing'
}: UpgradePlanAlertProps) {
  // Determine tier colors
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'premium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'business':
      case 'platinum':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Get button color based on required tier
  const getButtonColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'premium':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'business':
      case 'platinum':
        return 'bg-purple-600 hover:bg-purple-700 text-white';
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  const buttonClasses = getButtonColor(requiredTier);
  const currentTierClasses = getTierColor(currentTier);
  const requiredTierClasses = getTierColor(requiredTier);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-5 w-5 text-gray-400" />
          <span className={`text-xs font-medium px-2 py-1 rounded ${currentTierClasses}`}>
            {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan
          </span>
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between p-6 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${currentTierClasses}`}>
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Current Plan</p>
              <p className="font-bold">{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</p>
            </div>
          </div>
          
          <div className="flex-1 flex justify-center">
            <ArrowRight className="h-6 w-6 text-gray-400" />
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${requiredTierClasses}`}>
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Required Plan</p>
              <p className="font-bold">{requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center md:justify-end">
        <Link href={ctaLink}>
          <Button className={buttonClasses}>{ctaText}</Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 