"use client"

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { Card } from '@/components/ui/card-component';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, BarChart, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import PremiumFeatureGate from '@/components/ui/PremiumFeatureGate';

// Types for the API response
interface SoundGrowthDataPoint {
  date: string;
  usageCount: number;
  engagement: number;
  shareRate: number;
}

interface SoundGrowthData {
  id: string;
  name: string;
  data: SoundGrowthDataPoint[];
  metrics?: {
    totalUsage: number;
    avgEngagement: number;
    avgShareRate: number;
    growthRate: number;
  };
  predictedGrowth?: {
    next7d: number;
    next30d: number;
    next90d: number;
  };
}

// Additional properties for sound in compare view
interface SoundCompareData extends SoundGrowthData {
  totalUsage: number;
  growthRate: number;
}

interface CompareViewData {
  timeRange: string;
  sounds: SoundCompareData[];
}

// Chart props
interface SoundGrowthChartProps {
  soundId?: string;
  className?: string;
  isPremium?: boolean;
}

// Custom formatters
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const formatGrowthRate = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

// Custom tooltip for the charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
        <p className="text-sm text-gray-500">{`Date: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${formatNumber(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Component for the trend indicator
const TrendIndicator = ({ value }: { value: number }) => {
  if (value > 5) {
    return (
      <div className="flex items-center text-green-600 text-sm font-medium">
        <ArrowUp size={16} className="mr-1" />
        <span>{formatGrowthRate(value)}</span>
      </div>
    );
  } else if (value < -5) {
    return (
      <div className="flex items-center text-red-600 text-sm font-medium">
        <ArrowDown size={16} className="mr-1" />
        <span>{formatGrowthRate(value)}</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center text-amber-600 text-sm font-medium">
        <Minus size={16} className="mr-1" />
        <span>{formatGrowthRate(value)}</span>
      </div>
    );
  }
};

export default function SoundGrowthChart({ soundId, className = "", isPremium = false }: SoundGrowthChartProps) {
  // State for the chart data
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [singleViewData, setSingleViewData] = useState<SoundGrowthData | null>(null);
  const [compareViewData, setCompareViewData] = useState<CompareViewData | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'compare'>('single');
  const [showPredictive, setShowPredictive] = useState<boolean>(false);

  // Colors for the chart lines
  const chartColors = [
    '#3b82f6', // blue-500
    '#ef4444', // red-500
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#8b5cf6', // violet-500
  ];

  // Fetch the data from the API
  const fetchData = async (mode: 'single' | 'compare') => {
    try {
      setLoading(true);
      setError(null);

      // Construct the URL with the query parameters
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      if (soundId) {
        params.append('soundId', soundId);
      }
      if (mode === 'compare') {
        params.append('compareMode', 'true');
      }

      const response = await fetch(`/api/analytics/sound-growth?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch growth data: ${response.status}`);
      }
      
      const { success, data, error } = await response.json();
      
      if (!success) {
        throw new Error(error || 'Failed to fetch growth data');
      }
      
      // Update the appropriate state based on the view mode
      if (mode === 'compare') {
        setCompareViewData(data as CompareViewData);
      } else {
        setSingleViewData(data as SoundGrowthData);
      }
    } catch (err) {
      console.error('Error fetching sound growth data:', err);
      setError((err as Error).message || 'Failed to load sound growth data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData(viewMode);
  }, [timeRange, soundId, viewMode]);

  // Render the single view chart
  const renderSingleViewChart = () => {
    if (!singleViewData) return null;

    // Prepare data with predictions if needed
    const chartData = [...singleViewData.data];
    
    // Add predicted data points if premium and showPredictive is true
    if (isPremium && showPredictive && singleViewData.predictedGrowth) {
      const lastDate = new Date(chartData[chartData.length - 1].date);
      
      // Add 7-day prediction
      const date7d = new Date(lastDate);
      date7d.setDate(lastDate.getDate() + 7);
      chartData.push({
        date: date7d.toISOString().split('T')[0],
        usageCount: singleViewData.predictedGrowth.next7d,
        engagement: 0, // Not predicted
        shareRate: 0, // Not predicted
      });
      
      // Add 30-day prediction
      const date30d = new Date(lastDate);
      date30d.setDate(lastDate.getDate() + 30);
      chartData.push({
        date: date30d.toISOString().split('T')[0],
        usageCount: singleViewData.predictedGrowth.next30d,
        engagement: 0, // Not predicted
        shareRate: 0, // Not predicted
      });
    }

    return (
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis
              tickFormatter={formatNumber}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="usageCount"
              stroke={chartColors[0]}
              strokeWidth={2}
              name="Usage"
              dot={false}
              activeDot={{ r: 6 }}
            />
            {isPremium && showPredictive && (
              <Area
                type="monotone"
                dataKey="usageCount"
                fill={chartColors[0]}
                fillOpacity={0.1}
                stroke="none"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {isPremium && singleViewData.predictedGrowth && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-semibold text-gray-700">Growth Predictions</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPredictive(!showPredictive)}
              >
                {showPredictive ? 'Hide Predictions' : 'Show Predictions'}
              </Button>
            </div>
            {showPredictive && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-gray-500 text-sm">Next 7 Days</div>
                  <div className="text-2xl font-bold">{formatNumber(singleViewData.predictedGrowth.next7d)}</div>
                  <TrendIndicator value={(singleViewData.predictedGrowth.next7d / singleViewData.data[singleViewData.data.length - 1].usageCount - 1) * 100} />
                </Card>
                <Card className="p-4">
                  <div className="text-gray-500 text-sm">Next 30 Days</div>
                  <div className="text-2xl font-bold">{formatNumber(singleViewData.predictedGrowth.next30d)}</div>
                  <TrendIndicator value={(singleViewData.predictedGrowth.next30d / singleViewData.data[singleViewData.data.length - 1].usageCount - 1) * 100} />
                </Card>
                <Card className="p-4">
                  <div className="text-gray-500 text-sm">Next 90 Days</div>
                  <div className="text-2xl font-bold">{formatNumber(singleViewData.predictedGrowth.next90d)}</div>
                  <TrendIndicator value={(singleViewData.predictedGrowth.next90d / singleViewData.data[singleViewData.data.length - 1].usageCount - 1) * 100} />
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render the compare view chart
  const renderCompareViewChart = () => {
    if (!compareViewData) return null;

    return (
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={
              // Merge all sounds data into one array with the same date structure
              compareViewData.sounds[0].data.map((item, index) => {
                const mergedItem: any = { date: item.date };
                compareViewData.sounds.forEach((sound, soundIndex) => {
                  mergedItem[sound.id] = sound.data[index].usageCount;
                });
                return mergedItem;
              })
            }
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis
              tickFormatter={formatNumber}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {compareViewData.sounds.map((sound, index) => (
              <Line
                key={sound.id}
                type="monotone"
                dataKey={sound.id}
                stroke={chartColors[index % chartColors.length]}
                strokeWidth={2}
                name={sound.name}
                dot={false}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {compareViewData.sounds.map((sound, index) => (
            <Card key={sound.id} className="p-4 flex items-center space-x-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: chartColors[index % chartColors.length] }}
              />
              <div>
                <div className="font-medium">{sound.name}</div>
                <div className="text-gray-500 text-sm flex items-center">
                  <span className="mr-2">Total: {formatNumber(sound.totalUsage)}</span>
                  <TrendIndicator value={sound.growthRate} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Main component render
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sound Growth Metrics</h2>
          <p className="text-gray-500 mt-1">
            Track usage trends and growth projections over time
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4 md:mt-0">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="14d">Last 14 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Tabs 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as 'single' | 'compare')}
            className="w-[200px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single View</TabsTrigger>
              <TabsTrigger value="compare">Compare</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-700">
          {error}
        </div>
      ) : (
        <>
          {viewMode === 'single' ? (
            <div>
              {singleViewData?.metrics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="p-4">
                    <div className="text-gray-500 text-sm">Total Usage</div>
                    <div className="text-2xl font-bold">
                      {formatNumber(singleViewData.metrics.totalUsage)}
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-gray-500 text-sm">Growth Rate</div>
                    <div className="flex items-center">
                      <div className="text-2xl font-bold mr-2">
                        {formatGrowthRate(singleViewData.metrics.growthRate)}
                      </div>
                      <TrendIndicator value={singleViewData.metrics.growthRate} />
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-gray-500 text-sm">Avg. Engagement</div>
                    <div className="text-2xl font-bold">
                      {singleViewData.metrics.avgEngagement.toFixed(1)}%
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-gray-500 text-sm">Avg. Share Rate</div>
                    <div className="text-2xl font-bold">
                      {singleViewData.metrics.avgShareRate.toFixed(1)}%
                    </div>
                  </Card>
                </div>
              )}
              {renderSingleViewChart()}
            </div>
          ) : (
            <div>
              {isPremium ? (
                renderCompareViewChart()
              ) : (
                <PremiumFeatureGate
                  featureName="Sound Comparison"
                  description="Unlock the ability to compare multiple sounds and analyze their relative performance."
                >
                  <div className="flex justify-center items-center">
                    <BarChart className="h-12 w-12 text-blue-500" />
                  </div>
                </PremiumFeatureGate>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
} 