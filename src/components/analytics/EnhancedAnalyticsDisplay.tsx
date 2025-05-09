"use client";

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Download, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  ChevronUp, 
  PieChart, 
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Maximize,
  Minimize,
  Users,
  Eye,
  MousePointerClick
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// Analytics metric interface
export interface AnalyticsMetric {
  name: string;
  value: number;
  change: number; // percentage change
  trend: 'up' | 'down' | 'neutral';
  unit?: string;
  icon?: React.ReactNode;
}

// Time series data interface
export interface TimeSeriesData {
  date: string;
  value: number;
  benchmark?: number;
}

// Full analytics data interface
export interface AnalyticsData {
  period: string;
  metrics: {
    primary: AnalyticsMetric[];
    secondary: AnalyticsMetric[];
  };
  timeSeriesData: {
    views: TimeSeriesData[];
    engagement: TimeSeriesData[];
    conversion: TimeSeriesData[];
  };
  topPerformers: {
    id: string;
    name: string;
    category: string;
    value: number;
    change: number;
  }[];
}

// Component props interface
export interface EnhancedAnalyticsDisplayProps {
  title: string;
  subtitle?: string;
  data?: AnalyticsData;
  isLoading?: boolean;
  onDateRangeChange?: (range: string) => void;
  onExport?: () => void;
  className?: string;
}

export function EnhancedAnalyticsDisplay({
  title,
  subtitle,
  data,
  isLoading = false,
  onDateRangeChange,
  onExport,
  className
}: EnhancedAnalyticsDisplayProps) {
  // States for expanded sections
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [showAllPerformers, setShowAllPerformers] = useState(false);
  const [activeTimeRange, setActiveTimeRange] = useState('30d');
  
  // Handle time range changes
  useEffect(() => {
    if (onDateRangeChange && activeTimeRange) {
      onDateRangeChange(activeTimeRange);
    }
  }, [activeTimeRange, onDateRangeChange]);
  
  // Format value based on unit
  const formatValue = (value: number, unit?: string): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M${unit || ''}`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k${unit || ''}`;
    } else {
      return `${value.toFixed(unit === '%' ? 1 : 0)}${unit || ''}`;
    }
  };
  
  // Format percentage change
  const formatChange = (change: number): string => {
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change.toFixed(1)}%`;
  };
  
  // Get color class based on trend
  const getTrendColorClass = (trend: string): string => {
    if (trend === 'up') return 'text-green-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-neutral-500';
  };
  
  // Toggle expanded state of a chart
  const toggleChart = (chartId: string) => {
    setExpandedChart(expandedChart === chartId ? null : chartId);
  };
  
  // Toggle expanded state of a metric
  const toggleMetric = (metricName: string) => {
    setExpandedMetric(expandedMetric === metricName ? null : metricName);
  };
  
  // Skeleton loading for metrics
  const MetricSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-5 w-24 bg-neutral-200 rounded-md mb-2"></div>
      <div className="h-8 w-16 bg-neutral-200 rounded-md mb-1"></div>
      <div className="h-4 w-20 bg-neutral-200 rounded-md"></div>
    </div>
  );
  
  // Skeleton loading for charts
  const ChartSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-6 w-32 bg-neutral-200 rounded-md mb-4"></div>
      <div className="h-40 bg-neutral-200 rounded-md"></div>
    </div>
  );
  
  // Empty state
  if (!data && !isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="bg-neutral-100 inline-block p-4 rounded-full mb-4">
          <BarChart3 className="h-8 w-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-1">No analytics data available</h3>
        <p className="text-neutral-500 max-w-sm mx-auto">
          Try adjusting your filters or select a different time period to view analytics data.
        </p>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
          {subtitle && <p className="text-neutral-500 text-sm mt-1">{subtitle}</p>}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-md overflow-hidden border">
            {['7d', '30d', '90d', '12m'].map(range => (
              <button
                key={range}
                className={`px-3 py-1.5 text-sm ${activeTimeRange === range 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'}`}
                onClick={() => setActiveTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
          
          {onExport && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExport}
              className="flex items-center"
            >
              <Download size={16} className="mr-1" />
              Export
            </Button>
          )}
        </div>
      </div>
      
      {/* Primary metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <MetricSkeleton />
              </CardContent>
            </Card>
          ))
        ) : data?.metrics.primary.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card 
              className="h-full cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => toggleMetric(metric.name)}
            >
              <CardContent className="p-4">
                <p className="text-sm text-neutral-500 mb-1">{metric.name}</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-2xl font-bold">{formatValue(metric.value, metric.unit)}</h3>
                  <div className={`flex items-center ${getTrendColorClass(metric.trend)}`}>
                    {metric.trend === 'up' && <ArrowUpRight size={16} className="mr-1" />}
                    {metric.trend === 'down' && <ArrowDownRight size={16} className="mr-1" />}
                    {metric.trend === 'neutral' && <Minus size={16} className="mr-1" />}
                    <span className="text-sm font-medium">{formatChange(metric.change)}</span>
                  </div>
                </div>
                
                {/* Expanded details */}
                <AnimatePresence>
                  {expandedMetric === metric.name && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t"
                    >
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Daily Average</p>
                          <p className="text-sm font-medium">
                            {formatValue(metric.value / 30, metric.unit)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Weekly Trend</p>
                          <div className="h-2 bg-neutral-100 rounded-full w-full mt-1">
                            <div 
                              className={`h-full rounded-full ${
                                metric.trend === 'up' ? 'bg-green-500' : 
                                metric.trend === 'down' ? 'bg-red-500' : 
                                'bg-neutral-400'
                              }`}
                              style={{ width: `${Math.min(Math.abs(metric.change) * 2, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Charts section */}
      <div className="mt-8">
        <Tabs defaultValue="views">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="views">Views</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="conversion">Conversion</TabsTrigger>
            </TabsList>
            
            {expandedChart && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setExpandedChart(null)}
                className="flex items-center"
              >
                <Minimize size={16} className="mr-1" />
                Minimize
              </Button>
            )}
          </div>
          
          <TabsContent value="views">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Views Over Time</h3>
                    <p className="text-sm text-neutral-500">
                      Daily view count performance
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleChart('views')}
                    className="flex items-center"
                  >
                    {expandedChart === 'views' ? (
                      <Minimize size={16} className="mr-1" />
                    ) : (
                      <Maximize size={16} className="mr-1" />
                    )}
                    {expandedChart === 'views' ? 'Minimize' : 'Expand'}
                  </Button>
                </div>
                
                {isLoading ? (
                  <ChartSkeleton />
                ) : (
                  <div className={expandedChart === 'views' ? 'h-80' : 'h-48'}>
                    {/* Placeholder for actual chart - would use a library like recharts */}
                    <div className="bg-neutral-50 h-full w-full rounded-lg border flex items-center justify-center">
                      <div className="text-center">
                        <LineChart className="h-6 w-6 text-neutral-400 mx-auto mb-2" />
                        <p className="text-neutral-500 text-sm">
                          Chart visualization would be rendered here
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="engagement">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Engagement Rate</h3>
                    <p className="text-sm text-neutral-500">
                      Likes, comments and shares relative to views
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleChart('engagement')}
                    className="flex items-center"
                  >
                    {expandedChart === 'engagement' ? (
                      <Minimize size={16} className="mr-1" />
                    ) : (
                      <Maximize size={16} className="mr-1" />
                    )}
                    {expandedChart === 'engagement' ? 'Minimize' : 'Expand'}
                  </Button>
                </div>
                
                {isLoading ? (
                  <ChartSkeleton />
                ) : (
                  <div className={expandedChart === 'engagement' ? 'h-80' : 'h-48'}>
                    {/* Placeholder for actual chart */}
                    <div className="bg-neutral-50 h-full w-full rounded-lg border flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-6 w-6 text-neutral-400 mx-auto mb-2" />
                        <p className="text-neutral-500 text-sm">
                          Chart visualization would be rendered here
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="conversion">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Conversion Performance</h3>
                    <p className="text-sm text-neutral-500">
                      Click-through and action conversion rates
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleChart('conversion')}
                    className="flex items-center"
                  >
                    {expandedChart === 'conversion' ? (
                      <Minimize size={16} className="mr-1" />
                    ) : (
                      <Maximize size={16} className="mr-1" />
                    )}
                    {expandedChart === 'conversion' ? 'Minimize' : 'Expand'}
                  </Button>
                </div>
                
                {isLoading ? (
                  <ChartSkeleton />
                ) : (
                  <div className={expandedChart === 'conversion' ? 'h-80' : 'h-48'}>
                    {/* Placeholder for actual chart */}
                    <div className="bg-neutral-50 h-full w-full rounded-lg border flex items-center justify-center">
                      <div className="text-center">
                        <PieChart className="h-6 w-6 text-neutral-400 mx-auto mb-2" />
                        <p className="text-neutral-500 text-sm">
                          Chart visualization would be rendered here
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Top performers section */}
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Top Performers</h3>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAllPerformers(!showAllPerformers)}
                className="flex items-center"
              >
                {showAllPerformers ? (
                  <>
                    <ChevronUp size={16} className="mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} className="mr-1" />
                    Show All
                  </>
                )}
              </Button>
            </div>
            
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4">
                    <div className="h-10 w-10 bg-neutral-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-5 w-48 bg-neutral-200 rounded-md mb-2"></div>
                      <div className="h-4 w-24 bg-neutral-200 rounded-md"></div>
                    </div>
                    <div className="h-8 w-12 bg-neutral-200 rounded-md"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-12 text-sm text-neutral-500 pb-2 border-b border-neutral-100">
                  <div className="col-span-6">Name</div>
                  <div className="col-span-3">Category</div>
                  <div className="col-span-3 text-right">Performance</div>
                </div>
                
                {data?.topPerformers
                  .slice(0, showAllPerformers ? undefined : 3)
                  .map((performer, index) => (
                    <motion.div 
                      key={performer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="grid grid-cols-12 items-center py-2"
                    >
                      <div className="col-span-6">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded bg-primary-100 text-primary-700 flex items-center justify-center font-medium text-sm mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{performer.name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <span className="inline-block px-2 py-1 bg-neutral-100 text-neutral-800 text-xs rounded-full">
                          {performer.category}
                        </span>
                      </div>
                      <div className="col-span-3 text-right">
                        <div className="flex items-center justify-end">
                          <p className="font-medium">{formatValue(performer.value)}</p>
                          <span className={`ml-2 text-xs font-medium ${performer.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {performer.change >= 0 ? '+' : ''}{performer.change.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                
                {!showAllPerformers && data?.topPerformers && data.topPerformers.length > 3 && (
                  <div className="pt-2 border-t border-neutral-100">
                    <button 
                      onClick={() => setShowAllPerformers(true)}
                      className="text-sm text-primary-600 hover:text-primary-700 w-full text-center"
                    >
                      Show all {data.topPerformers.length} performers
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Secondary metrics (collapsed by default) */}
      <div className="mt-6">
        <Card>
          <CardContent className="p-4">
            <button 
              onClick={() => toggleMetric('secondary')}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-base font-medium">Additional Metrics</h3>
              <ChevronDown size={18} className={`transition-transform ${expandedMetric === 'secondary' ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {expandedMetric === 'secondary' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {isLoading ? (
                      Array(4).fill(0).map((_, i) => (
                        <MetricSkeleton key={i} />
                      ))
                    ) : data?.metrics.secondary.map((metric, index) => (
                      <div key={index} className="p-3 bg-neutral-50 rounded-lg">
                        <p className="text-sm text-neutral-500 mb-1">{metric.name}</p>
                        <div className="flex items-end justify-between">
                          <h4 className="text-lg font-bold">{formatValue(metric.value, metric.unit)}</h4>
                          <div className={`flex items-center ${getTrendColorClass(metric.trend)}`}>
                            {metric.trend === 'up' && <ArrowUpRight size={14} className="mr-1" />}
                            {metric.trend === 'down' && <ArrowDownRight size={14} className="mr-1" />}
                            {metric.trend === 'neutral' && <Minus size={14} className="mr-1" />}
                            <span className="text-xs font-medium">{formatChange(metric.change)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 