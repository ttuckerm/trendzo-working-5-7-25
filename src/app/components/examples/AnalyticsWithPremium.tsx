'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/unified-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/ui-tabs';
import { Button } from '@/components/ui/button';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PremiumFeatureBadge } from '@/app/components/common/PremiumFeatureBadge';
import { PremiumUpgradePrompt } from '@/app/components/common/PremiumUpgradePrompt';
import { PremiumFeaturePreview } from '@/app/components/common/PremiumFeaturePreview';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';
import { ThemeToggle } from '@/app/components/common/ThemeToggle';
import { BarChart2, LineChart as LineChartIcon, TrendingUp, Calendar, Download, Share2, Filter } from 'lucide-react';
import { useDataFetch } from '@/lib/hooks/useDataFetching';

// Sample data for demo purposes
const engagementData = [
  { date: 'Jan', views: 1000, engagement: 400, premium: 870, predicted: false },
  { date: 'Feb', views: 1200, engagement: 480, premium: 1290, predicted: false },
  { date: 'Mar', views: 1800, engagement: 620, premium: 1570, predicted: false },
  { date: 'Apr', views: 2400, engagement: 780, premium: 1840, predicted: false },
  { date: 'May', views: 2800, engagement: 850, premium: 2260, predicted: false },
  { date: 'Jun', views: 3200, engagement: 940, premium: 2510, predicted: false },
];

const predictionData = [
  { date: 'Jul', views: 3600, engagement: 1020, premium: 2790, predicted: true },
  { date: 'Aug', views: 4100, engagement: 1180, premium: 3100, predicted: true },
  { date: 'Sep', views: 4800, engagement: 1340, premium: 3560, predicted: true },
];

// Type for data points
interface DataPoint {
  date: string;
  views: number;
  engagement: number;
  premium: number;
  predicted: boolean;
}

// Prepare actual and predicted data separately
const actualData = engagementData;
const predictedData = predictionData;

/**
 * Analytics Dashboard with Premium Features
 * 
 * This component demonstrates how to implement premium features in a real application.
 * It includes:
 * - Basic analytics for free users
 * - Premium analytics with advanced insights
 * - Business-tier predictive analytics
 */
export function AnalyticsWithPremium() {
  const { tier, canAccess } = useSubscription();
  const [activeTab, setActiveTab] = useState('overview');
  const hasPremium = canAccess('premium');
  const hasBusiness = canAccess('business');
  
  // Simulated API data fetch with caching
  const { data: analyticsData, isLoading } = useDataFetch<typeof engagementData>(
    '/api/analytics/overview',
    {
      // This is a mock implementation - in a real app, this would be a real API endpoint
      // Since we're not making real requests, we'll use the sample data
      cacheKey: 'analytics-overview',
      cacheTtl: 5 * 60 * 1000, // 5 minutes
      fetchOnMount: false // Disable actual fetching since this is a demo
    }
  );
  
  // Use our sample data since this is a demo
  const data = [...engagementData, ...(hasBusiness ? predictionData : [])];
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your content performance and audience engagement
          </p>
        </div>
        <ThemeToggle variant="dropdown" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Basic metrics - available to all */}
        <MetricCard 
          title="Views"
          value={data.reduce((sum, item) => sum + item.views, 0).toLocaleString()}
          change="+12.5%"
          positive
          icon={<BarChart2 className="h-5 w-5" />}
        />
        
        {/* Engagement - free preview for basic users */}
        <PremiumFeaturePreview
          requiredTier="premium"
          title="Engagement Analytics"
          description="Track how users interact with your content."
          previewDuration={15}
        >
          <MetricCard 
            title="Engagement Rate"
            value={`${((data.reduce((sum, item) => sum + item.engagement, 0) / 
                        data.reduce((sum, item) => sum + item.views, 0)) * 100).toFixed(1)}%`}
            change="+5.2%"
            positive
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </PremiumFeaturePreview>
        
        {/* Premium conversion - business only */}
        {hasBusiness ? (
          <MetricCard 
            title="Premium Conversion"
            value={`${((data.reduce((sum, item) => sum + item.premium, 0) / 
                      data.reduce((sum, item) => sum + item.views, 0)) * 100).toFixed(1)}%`}
            change="+8.7%"
            positive
            icon={<TrendingUp className="h-5 w-5" />}
            variant="business"
          />
        ) : (
          <div className="h-full">
            <PremiumFeatureBadge 
              requiredTier="business" 
              variant="block"
            />
          </div>
        )}
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement" disabled={!hasPremium}>
              Engagement 
              <PremiumFeatureBadge requiredTier="premium" variant="inline" className="ml-2" />
            </TabsTrigger>
            <TabsTrigger value="predictions" disabled={!hasBusiness}>
              Predictions
              <PremiumFeatureBadge requiredTier="business" variant="inline" className="ml-2" />
            </TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="h-8">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Last 30 Days
            </Button>
            {hasPremium && (
              <>
                <Button variant="outline" size="sm" className="h-8">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export
                </Button>
                {hasBusiness && (
                  <Button variant="outline" size="sm" className="h-8">
                    <Share2 className="h-3.5 w-3.5 mr-1.5" />
                    Share
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Overview Tab - Available to all users */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Views Overview</CardTitle>
              <CardDescription>
                Total views across all content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagementData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        borderColor: 'var(--border)' 
                      }} 
                    />
                    <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter Data
              </Button>
              
              {!hasPremium && (
                <Button variant="outline" className="text-amber-600">
                  <PremiumFeatureBadge requiredTier="premium" variant="inline" showLabel={false} className="mr-2" />
                  Unlock Advanced Analytics
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Engagement Tab - Premium feature */}
        <TabsContent value="engagement" className="space-y-4">
          {!hasPremium ? (
            <PremiumUpgradePrompt 
              variant="card"
              title="Unlock Engagement Analytics"
              description="Get detailed insights into how users engage with your content."
              features={[
                'Engagement rate tracking',
                'Audience demographics',
                'Session duration metrics',
                'Conversion funnels'
              ]}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Engagement Analytics
                  <PremiumFeatureBadge requiredTier="premium" variant="inline" className="ml-2" />
                </CardTitle>
                <CardDescription>
                  Track how users interact with your content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--background)', 
                          borderColor: 'var(--border)' 
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="views" 
                        stroke="#3b82f6" 
                        strokeWidth={2} 
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="engagement" 
                        stroke="#f59e0b" 
                        strokeWidth={2} 
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Views</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Engagement</span>
                  </div>
                </div>
                
                {!hasBusiness && (
                  <Button variant="outline" className="text-purple-600">
                    <PremiumFeatureBadge requiredTier="business" variant="inline" showLabel={false} className="mr-2" />
                    Unlock Predictions
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        {/* Predictions Tab - Business feature */}
        <TabsContent value="predictions" className="space-y-4">
          {!hasBusiness ? (
            <PremiumUpgradePrompt 
              variant="card"
              requiredTier="business"
              title="Unlock Predictive Analytics"
              description="See into the future with AI-powered predictions."
              features={[
                'Growth trend predictions',
                'Content performance forecasting',
                'Audience growth modeling',
                'Conversion predictions'
              ]}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Growth Predictions
                  <PremiumFeatureBadge requiredTier="business" variant="inline" className="ml-2" />
                </CardTitle>
                <CardDescription>
                  AI-powered predictions for the next 3 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart>
                      <XAxis dataKey="date" allowDuplicatedCategory={false} />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--background)', 
                          borderColor: 'var(--border)' 
                        }} 
                      />
                      {/* Actual data */}
                      <Line 
                        data={actualData}
                        type="monotone" 
                        name="Views (Actual)"
                        dataKey="views" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      
                      {/* Predicted data */}
                      <Line 
                        data={predictedData}
                        type="monotone" 
                        name="Views (Predicted)"
                        dataKey="views" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        strokeDasharray="5 5"
                      />
                      
                      {/* Engagement data */}
                      <Line 
                        data={actualData}
                        type="monotone"
                        name="Engagement (Actual)"
                        dataKey="engagement" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      
                      <Line 
                        data={predictedData}
                        type="monotone"
                        name="Engagement (Predicted)"
                        dataKey="engagement" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        strokeDasharray="5 5"
                      />
                      
                      {/* Premium conversion data */}
                      <Line 
                        data={actualData}
                        type="monotone"
                        name="Premium Conversion (Actual)"
                        dataKey="premium" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      
                      <Line 
                        data={predictedData}
                        type="monotone"
                        name="Premium Conversion (Predicted)"
                        dataKey="premium" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Views</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Engagement</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Premium</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-6 h-0.5 bg-gray-400 dark:bg-gray-600 dash-line mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Predicted Data</span>
                </div>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Metric Card component for displaying key metrics
 */
function MetricCard({ 
  title, 
  value, 
  change, 
  positive = true,
  icon,
  variant = 'default'
}: { 
  title: string;
  value: string;
  change: string;
  positive?: boolean;
  icon: React.ReactNode;
  variant?: 'default' | 'premium' | 'business';
}) {
  const bgColor = variant === 'business' 
    ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30' 
    : variant === 'premium'
      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  
  const iconColor = variant === 'business' 
    ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' 
    : variant === 'premium'
      ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/30'
      : 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    
  return (
    <div className={`p-6 rounded-lg border ${bgColor}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-full ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <span className={`text-sm font-medium ${positive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
          {change}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">from last month</span>
      </div>
    </div>
  );
} 