'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/ui-compatibility';
import { useSubscription, SubscriptionTier } from '@/lib/contexts/SubscriptionContext';

/**
 * Pricing Page
 * Displays the available subscription plans and allows users to upgrade
 */
export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const { tier, upgradeSubscription, isUpgrading } = useSubscription();
  
  const handleUpgrade = async (newTier: SubscriptionTier) => {
    const success = await upgradeSubscription(newTier);
    if (success) {
      // Redirect to dashboard
      window.location.href = '/dashboard-view';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Unlock advanced features and boost your social media performance with our premium plans.
          </p>
          
          <div className="mt-6 inline-flex items-center p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`px-4 py-2 rounded-md ${
                selectedPlan === 'monthly' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`px-4 py-2 rounded-md flex items-center ${
                selectedPlan === 'yearly' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-500'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className={`border rounded-xl overflow-hidden ${tier === 'free' ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'border-gray-200'}`}>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Free</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Basic features for individuals getting started with social media templates.
              </p>
              
              {tier === 'free' ? (
                <Button disabled className="w-full bg-gray-100 text-gray-700 cursor-not-allowed">
                  Current Plan
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleUpgrade('free')}
                  disabled={isUpgrading || tier === 'free'}
                >
                  Downgrade
                </Button>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-4">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Basic template browsing</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Limited template collection</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Basic analytics dashboard</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Community support</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Premium Plan */}
          <div className={`border rounded-xl overflow-hidden ${tier === 'premium' ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'border-gray-200'} relative`}>
            {selectedPlan === 'yearly' && (
              <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-bl-lg">
                Save 20%
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center mb-2">
                <h3 className="text-lg font-semibold">Premium</h3>
                <Sparkles className="h-4 w-4 text-yellow-500 ml-2" />
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">
                  ${selectedPlan === 'monthly' ? '29' : '23'}
                </span>
                <span className="text-gray-500">/month</span>
                {selectedPlan === 'yearly' && (
                  <span className="text-sm text-gray-500 ml-1">billed annually</span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Advanced features for content creators and marketing professionals.
              </p>
              
              {tier === 'premium' ? (
                <Button disabled className="w-full bg-gray-100 text-gray-700 cursor-not-allowed">
                  Current Plan
                </Button>
              ) : (
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                  onClick={() => handleUpgrade('premium')}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? 'Processing...' : `Upgrade to Premium`}
                </Button>
              )}
            </div>
            <div className="bg-blue-50 px-6 py-4">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Everything in Free</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm"><strong>Video analysis</strong> and template extraction</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm"><strong>Trend discovery</strong> and predictions</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited template remixes</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Advanced analytics dashboard</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Priority email support</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Business Plan */}
          <div className={`border rounded-xl overflow-hidden ${tier === 'business' ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'border-gray-200'} relative`}>
            {selectedPlan === 'yearly' && (
              <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-bl-lg">
                Save 20%
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center mb-2">
                <h3 className="text-lg font-semibold">Business</h3>
                <Shield className="h-4 w-4 text-purple-500 ml-2" />
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">
                  ${selectedPlan === 'monthly' ? '79' : '63'}
                </span>
                <span className="text-gray-500">/month</span>
                {selectedPlan === 'yearly' && (
                  <span className="text-sm text-gray-500 ml-1">billed annually</span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Enterprise-grade features for businesses and agencies managing multiple accounts.
              </p>
              
              {tier === 'business' ? (
                <Button disabled className="w-full bg-gray-100 text-gray-700 cursor-not-allowed">
                  Current Plan
                </Button>
              ) : (
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                  onClick={() => handleUpgrade('business')}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? 'Processing...' : `Upgrade to Business`}
                </Button>
              )}
            </div>
            <div className="bg-purple-50 px-6 py-4">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Everything in Premium</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm"><strong>Team collaboration</strong> features</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm"><strong>AI content generation</strong> tools</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Custom white-label reports</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">API access</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Dedicated account manager</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold mb-4">Need a custom solution?</h3>
          <p className="text-gray-600 max-w-xl mx-auto mb-6">
            Contact our sales team for custom enterprise plans with additional features, dedicated support, and volume discounts.
          </p>
          <Button variant="outline" className="inline-flex items-center">
            Contact Sales <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <div className="mt-16 bg-gray-50 p-8 rounded-xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Secure Payments</h3>
              <p className="text-gray-600 text-sm">
                All payments are processed securely through Stripe with 256-bit encryption.
              </p>
            </div>
            
            <div>
              <div className="bg-green-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Instant Access</h3>
              <p className="text-gray-600 text-sm">
                Get immediate access to all features after upgrading your subscription.
              </p>
            </div>
            
            <div>
              <div className="bg-yellow-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <ArrowRight className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Cancel Anytime</h3>
              <p className="text-gray-600 text-sm">
                No long-term contracts. Easily cancel or change your plan at any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 