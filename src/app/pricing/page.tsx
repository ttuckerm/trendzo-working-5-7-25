'use client';

import { PricingContainer } from '@/components/ui/PricingContainer';
import { PricingPlan } from '@/lib/types/pricingTypes';

/**
 * Pricing Page
 * Displays the available subscription plans and allows users to upgrade
 */
export default function PricingPage() {
  // Define pricing plans based on the existing content
  const pricingPlans: PricingPlan[] = [
    {
      name: 'Basic',
      monthlyPrice: 0,
      yearlyPrice: 0,
      accent: 'bg-gradient-to-r from-gray-600 to-gray-800',
      features: [
        '10 template analyses per month',
        'Basic analytics dashboard',
        'Template library access'
      ],
      buttonText: 'Get Started'
    },
    {
      name: 'Premium',
      monthlyPrice: 29,
      yearlyPrice: 23,
      accent: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      features: [
        'Unlimited template analyses',
        'Advanced analytics and insights',
        'Template remix engine',
        'AI content suggestions',
        'Priority support'
      ],
      isPopular: true,
      buttonText: 'Get Premium'
    },
    {
      name: 'Business',
      monthlyPrice: 79,
      yearlyPrice: 63,
      accent: 'bg-gradient-to-r from-purple-600 to-indigo-600',
      features: [
        'Everything in Premium',
        'Team collaboration',
        'API access',
        'Custom templates',
        'Dedicated account manager'
      ],
      buttonText: 'Contact Sales'
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12 px-4">
        <PricingContainer 
          title="Simple, Transparent Pricing" 
          plans={pricingPlans} 
        />
        
        <div className="mt-12 text-center">
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the plan that's right for you and start creating viral TikTok content today.
            All plans include access to our core template library and basic analytics.
          </p>
        </div>
      </div>
    </main>
  );
} 