'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/unified-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/ui-tabs';
import { PremiumFeatureBadge } from './PremiumFeatureBadge';
import { PremiumUpgradePrompt } from './PremiumUpgradePrompt';
import { PremiumFeaturePreview } from './PremiumFeaturePreview';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { SubscriptionTier, useSubscription } from '@/lib/contexts/SubscriptionContext';
import { ChevronRight, Crown, Star, BarChart2, Zap, Sparkles, Users } from 'lucide-react';

/**
 * PremiumFeatureShowcase - A component to showcase all premium-related components
 */
export function PremiumFeatureShowcase() {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('badges');
  const { tier, setMockSubscriptionStatus } = useSubscription();
  
  // Content for the preview component
  const premiumContent = (
    <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-6 rounded-lg">
      <h3 className="text-lg font-medium mb-2 flex items-center">
        <Star className="h-5 w-5 text-amber-500 mr-2" />
        Advanced Analytics Dashboard
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Gain deeper insights into your content performance with our advanced analytics tools.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm">
          <BarChart2 className="h-5 w-5 text-amber-600 mb-2" />
          <div className="text-sm font-medium">Engagement Rate</div>
          <div className="text-2xl font-bold text-amber-600">24.8%</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm">
          <Zap className="h-5 w-5 text-amber-600 mb-2" />
          <div className="text-sm font-medium">Growth Rate</div>
          <div className="text-2xl font-bold text-amber-600">+12.4%</div>
        </div>
      </div>
    </div>
  );
  
  const businessContent = (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg">
      <h3 className="text-lg font-medium mb-2 flex items-center">
        <Users className="h-5 w-5 text-purple-500 mr-2" />
        Team Collaboration Tools
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Work together with your team on content creation and management.
      </p>
      <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm mb-3">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium">Campaign: Summer Launch</div>
          <div className="text-xs text-purple-600 font-medium">3 members</div>
        </div>
        <div className="flex -space-x-2 mt-2">
          <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-xs font-medium">JD</div>
          <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-xs font-medium">KL</div>
          <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-xs font-medium">MR</div>
        </div>
      </div>
      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
        Create New Project
      </Button>
    </div>
  );
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Premium Feature Components</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Current tier:</span>
            <select 
              value={tier}
              onChange={(e) => setMockSubscriptionStatus(e.target.value as SubscriptionTier)}
              className="text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              <option value="business">Business</option>
            </select>
          </div>
          <ThemeToggle variant="dropdown" />
        </div>
      </div>
      
      <Tabs defaultValue="badges" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="prompts">Upgrade Prompts</TabsTrigger>
          <TabsTrigger value="previews">Feature Previews</TabsTrigger>
          <TabsTrigger value="components">Demo UI</TabsTrigger>
        </TabsList>
        
        <TabsContent value="badges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Premium Feature Badges</CardTitle>
              <CardDescription>
                Visual indicators for premium features in your UI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg relative">
                  <PremiumFeatureBadge requiredTier="premium" variant="badge" />
                  <h3 className="text-sm font-medium mt-4">Badge Variant</h3>
                </div>
                <div className="p-4 border rounded-lg relative">
                  <PremiumFeatureBadge requiredTier="premium" variant="tag" />
                  <h3 className="text-sm font-medium mt-4">Tag Variant</h3>
                </div>
                <div className="p-4 border rounded-lg relative">
                  <h3 className="text-sm font-medium flex items-center">
                    Inline Variant <PremiumFeatureBadge requiredTier="premium" variant="inline" className="ml-2" />
                  </h3>
                </div>
                <div className="p-4 border rounded-lg relative">
                  <PremiumFeatureBadge requiredTier="business" variant="badge" />
                  <h3 className="text-sm font-medium mt-4">Business Badge</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Block Badges</CardTitle>
              <CardDescription>
                Full-sized badges that can replace content blocks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PremiumFeatureBadge requiredTier="premium" variant="block" />
                <PremiumFeatureBadge requiredTier="business" variant="block" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upgrade Prompts</CardTitle>
              <CardDescription>
                Different styles of prompts to encourage users to upgrade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-b pb-6">
                <h3 className="text-sm font-medium mb-3">Banner Variant</h3>
                <PremiumUpgradePrompt variant="banner" />
              </div>
              
              <div className="border-b pb-6">
                <h3 className="text-sm font-medium mb-3">Card Variant</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PremiumUpgradePrompt variant="card" />
                  <PremiumUpgradePrompt 
                    variant="card" 
                    requiredTier="business"
                    features={['Team collaboration', 'API access', 'White-label reports']} 
                  />
                </div>
              </div>
              
              <div className="border-b pb-6">
                <h3 className="text-sm font-medium mb-3">Inline Variant</h3>
                <PremiumUpgradePrompt variant="inline" />
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-3">Modal Variant (simulated)</h3>
                <div className="max-w-md mx-auto border rounded-xl shadow-lg overflow-hidden">
                  <PremiumUpgradePrompt variant="modal" onDismiss={() => {}} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="previews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Previews</CardTitle>
              <CardDescription>
                Blurred content with preview options for premium features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Premium Feature Preview</h3>
                  <PremiumFeaturePreview
                    previewDuration={10}
                    title="Premium Analytics"
                    description="Get detailed insights with our premium analytics dashboard."
                  >
                    {premiumContent}
                  </PremiumFeaturePreview>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Business Feature Preview</h3>
                  <PremiumFeaturePreview
                    requiredTier="business"
                    previewDuration={10}
                    blurIntensity="heavy"
                  >
                    {businessContent}
                  </PremiumFeaturePreview>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Toggles</CardTitle>
              <CardDescription>
                Different styles of theme toggle components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="p-4 border rounded-lg flex flex-col items-center">
                  <ThemeToggle variant="icon" />
                  <h3 className="text-sm font-medium mt-2">Icon Variant</h3>
                </div>
                <div className="p-4 border rounded-lg flex flex-col items-center">
                  <ThemeToggle variant="button" />
                  <h3 className="text-sm font-medium mt-2">Button Variant</h3>
                </div>
                <div className="p-4 border rounded-lg flex flex-col items-center">
                  <ThemeToggle variant="dropdown" />
                  <h3 className="text-sm font-medium mt-2">Dropdown Variant</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 text-amber-500 mr-2" />
                Premium Features Example
                <PremiumFeatureBadge requiredTier="premium" variant="inline" className="ml-2" />
              </CardTitle>
              <CardDescription>
                Example of how premium features can be presented in your UI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <h3 className="font-medium flex items-center">
                    <Crown className="h-4 w-4 text-amber-600 mr-2" />
                    Premium Analytics
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Get detailed insights into your content performance.
                  </p>
                </div>
                
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center">
                    <Sparkles className="h-4 w-4 text-amber-600 mr-2" />
                    View Trend Predictions
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <div className="p-4 border border-dashed rounded-lg flex flex-col items-center justify-center">
                  <Star className="h-10 w-10 text-amber-400 mb-2" />
                  <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                    This section shows how premium features can be highlighted throughout your UI.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 dark:bg-gray-800/50">
              <div className="w-full flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Premium features</span>
                <Button variant="outline" size="sm">Learn more</Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 