'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, BarChart2, TrendingUp, ExternalLink, Info, ArrowDown, ArrowUp, Users, Clock, MousePointerClick, BarChart, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card-component';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SoundPerformanceData } from '@/lib/types/newsletter';

interface SoundPerformanceTrackerProps {
  soundId: string;
  linkId?: string;
  newsletterId?: string;
  hideData?: boolean; // Hide performance data and only show link
  showViewAllLink?: boolean;
  className?: string;
}

export function SoundPerformanceTracker({
  soundId,
  linkId,
  newsletterId,
  hideData = false,
  showViewAllLink = true,
  className = ''
}: SoundPerformanceTrackerProps) {
  const [performanceData, setPerformanceData] = useState<SoundPerformanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Fetch sound performance data
  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!soundId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const url = `/api/sounds/performance-tracking?soundId=${soundId}${linkId ? `&linkId=${linkId}` : ''}${newsletterId ? `&newsletterId=${newsletterId}` : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch sound performance data');
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setPerformanceData(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch performance data');
        }
      } catch (error) {
        console.error('Error fetching sound performance data:', error);
        setError('Could not load performance data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPerformanceData();
  }, [soundId, linkId, newsletterId]);
  
  // Simplified view that only shows the tracking link
  if (hideData) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={`${className}`}
        asChild
      >
        <Link 
          href={`/sounds/${soundId}?${linkId ? `linkId=${linkId}` : ''}${newsletterId ? `&newsletterId=${newsletterId}` : ''}`}
          target="_blank" 
          rel="noopener noreferrer"
        >
          <LineChart className="h-4 w-4 mr-2" />
          View Performance
        </Link>
      </Button>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error || !performanceData) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle>Sound Performance</CardTitle>
          <CardDescription>Unable to load performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-sm">{error || 'Performance data not available'}</p>
          {showViewAllLink && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              asChild
            >
              <Link 
                href={`/sounds/${soundId}`}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Dashboard
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Calculate trend direction color and icon
  const getTrendDisplay = () => {
    switch (performanceData.trendDirection) {
      case 'up':
        return {
          color: 'text-green-500',
          icon: <TrendingUp className="h-4 w-4 mr-1" />,
          label: 'Rising'
        };
      case 'down':
        return {
          color: 'text-red-500',
          icon: <ArrowDown className="h-4 w-4 mr-1" />,
          label: 'Falling'
        };
      default:
        return {
          color: 'text-gray-500',
          icon: <Info className="h-4 w-4 mr-1" />,
          label: 'Stable'
        };
    }
  };
  
  const trend = getTrendDisplay();
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Format time duration in seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Get primary demographic data (top entry)
  const getPrimaryDemographic = (data: Record<string, number> | undefined) => {
    if (!data) return { key: 'N/A', value: 0 };
    
    const entries = Object.entries(data);
    if (entries.length === 0) return { key: 'N/A', value: 0 };
    
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return { key: sorted[0][0], value: sorted[0][1] };
  };
  
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{performanceData.title}</CardTitle>
          <Badge variant="outline" className={`${trend.color} border-current flex items-center`}>
            {trend.icon} {trend.label}
          </Badge>
        </div>
        <CardDescription>{performanceData.authorName}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="engagement" className="flex-1">Engagement</TabsTrigger>
            {performanceData.demographics && <TabsTrigger value="demographics" className="flex-1">Demographics</TabsTrigger>}
            {performanceData.trends && <TabsTrigger value="trends" className="flex-1">Trends</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Total Usage</div>
                <div className="text-xl font-semibold">
                  {new Intl.NumberFormat().format(performanceData.usageCount)}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Weekly Change</div>
                <div className={`text-xl font-semibold ${performanceData.weeklyChange > 0 ? 'text-green-600' : performanceData.weeklyChange < 0 ? 'text-red-600' : ''}`}>
                  {performanceData.weeklyChange > 0 ? '+' : ''}
                  {new Intl.NumberFormat().format(performanceData.weeklyChange)}
                </div>
              </div>
            </div>
            
            {performanceData.topTemplates && performanceData.topTemplates.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Top Templates Using This Sound</h4>
                {performanceData.topTemplates.slice(0, 2).map((template, index) => (
                  <div key={index} className="mb-2">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span>{template.templateTitle}</span>
                      <span>{new Intl.NumberFormat().format(template.usageCount)} uses</span>
                    </div>
                    <Progress 
                      value={(template.usageCount / performanceData.usageCount) * 100} 
                      className="h-1" 
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="engagement">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg flex items-center">
                <MousePointerClick className="h-4 w-4 mr-2 text-blue-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Clicks</div>
                  <div className="font-medium">{new Intl.NumberFormat().format(performanceData.engagement.clicks)}</div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex items-center">
                <Clock className="h-4 w-4 mr-2 text-amber-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Avg. Duration</div>
                  <div className="font-medium">{formatDuration(performanceData.engagement.averageDuration)}</div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex items-center">
                <BarChart className="h-4 w-4 mr-2 text-green-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Completion Rate</div>
                  <div className="font-medium">{formatPercentage(performanceData.engagement.completionRate)}</div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex items-center">
                <RefreshCw className="h-4 w-4 mr-2 text-purple-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Conversion Rate</div>
                  <div className="font-medium">{formatPercentage(performanceData.engagement.conversionRate)}</div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex items-center col-span-2">
                <Users className="h-4 w-4 mr-2 text-indigo-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Returning Users</div>
                  <div className="font-medium">{new Intl.NumberFormat().format(performanceData.engagement.returningUsers)}</div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {performanceData.demographics && (
            <TabsContent value="demographics">
              <div className="space-y-4">
                {performanceData.demographics.age && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Primary Age Group</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-sm">{getPrimaryDemographic(performanceData.demographics.age).key}</span>
                        <span className="text-sm font-medium">{formatPercentage(getPrimaryDemographic(performanceData.demographics.age).value)}</span>
                      </div>
                      <Progress 
                        value={getPrimaryDemographic(performanceData.demographics.age).value * 100} 
                        className="h-1 mt-2" 
                      />
                    </div>
                  </div>
                )}
                
                {performanceData.demographics.location && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Top Location</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-sm">{getPrimaryDemographic(performanceData.demographics.location).key}</span>
                        <span className="text-sm font-medium">{formatPercentage(getPrimaryDemographic(performanceData.demographics.location).value)}</span>
                      </div>
                      <Progress 
                        value={getPrimaryDemographic(performanceData.demographics.location).value * 100} 
                        className="h-1 mt-2" 
                      />
                    </div>
                  </div>
                )}
                
                {performanceData.demographics.device && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Device Usage</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-sm">{getPrimaryDemographic(performanceData.demographics.device).key}</span>
                        <span className="text-sm font-medium">{formatPercentage(getPrimaryDemographic(performanceData.demographics.device).value)}</span>
                      </div>
                      <Progress 
                        value={getPrimaryDemographic(performanceData.demographics.device).value * 100} 
                        className="h-1 mt-2" 
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
          
          {performanceData.trends && (
            <TabsContent value="trends">
              <div className="space-y-4">
                {!performanceData.trends ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No trend data available
                  </div>
                ) : (
                  <>
                    {performanceData.trends.daily && performanceData.trends.daily.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Daily Trend</h4>
                        <div className="bg-gray-50 p-3 rounded-lg h-20 flex items-end">
                          {performanceData.trends.daily.slice(-7).map((item, index) => {
                            const dailyData = performanceData.trends!.daily!;
                            const maxCount = Math.max(...dailyData.map(i => i.count));
                            const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                            return (
                              <div key={index} className="flex flex-col items-center flex-1">
                                <div 
                                  className="w-full max-w-[12px] bg-blue-500 rounded-t mx-auto"
                                  style={{ height: `${Math.max(height, 5)}%` }}
                                />
                                <div className="text-[10px] mt-1 text-muted-foreground">
                                  {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {performanceData.trends.hourly && performanceData.trends.hourly.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Peak Usage Time</h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          {(() => {
                            const hourlyData = performanceData.trends!.hourly!;
                            const peakHour = [...hourlyData].sort((a, b) => b.count - a.count)[0];
                            const hour = peakHour.hour;
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour % 12 || 12;
                            return (
                              <div className="text-center">
                                <span className="text-lg font-medium">{displayHour}:00 {ampm}</span>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {new Intl.NumberFormat().format(peakHour.count)} plays
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
          
        {showViewAllLink && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            asChild
          >
            <Link 
              href={`/sounds/${soundId}?${linkId ? `linkId=${linkId}` : ''}${newsletterId ? `&newsletterId=${newsletterId}` : ''}`}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <LineChart className="h-4 w-4 mr-2" />
              View Full Analytics
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 