"use client"

import React, { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card } from '@/components/ui/card-component';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Info, BarChart, TrendingUp, ArrowUpRight, Plus, Filter } from 'lucide-react';
import PremiumFeatureGate from '@/components/ui/PremiumFeatureGate';

// Types for the API response
interface SoundCorrelationPoint {
  soundId: string;
  soundName: string;
  category: string;
  tempo: number;
  duration: number;
  usageCount: number;
  engagementRate: number;
  completionRate: number;
  shareRate: number;
  conversionRate: number;
  userRetentionImpact: number;
}

interface CorrelationMetrics {
  totalSounds: number;
  avgEngagementRate: number;
  avgCompletionRate: number;
  avgShareRate: number;
  avgConversionRate: number;
  avgUserRetentionImpact: number;
}

interface CategoryCount {
  category: string;
  count: number;
}

interface Insight {
  id: string;
  type: 'correlation' | 'trend' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

interface TopPerformer {
  soundId: string;
  soundName: string;
  category: string;
  engagementRate: number;
  completionRate: number;
  improvementPotential: number;
}

interface CategoryComparison {
  category: string;
  avgEngagement: number;
  avgCompletion: number;
  avgShare: number;
  soundCount: number;
}

interface ComparativeAnalysis {
  topPerformers: TopPerformer[];
  categoryComparison: CategoryComparison[];
}

interface CorrelationData {
  points: SoundCorrelationPoint[];
  metrics: CorrelationMetrics;
  categories: CategoryCount[];
  insights: Insight[];
  comparativeAnalysis: ComparativeAnalysis;
}

// Chart props
interface SoundEngagementCorrelationProps {
  className?: string;
  isPremium?: boolean;
}

// Format functions
const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

const COLORS = {
  'Ambient': '#4299e1',     // blue-500
  'Bass': '#ed8936',        // orange-500
  'Beats': '#9f7aea',       // purple-500
  'Cinematic': '#38b2ac',   // teal-500
  'Drums': '#f56565',       // red-500
  'Electronic': '#48bb78',  // green-500
  'FX': '#ecc94b',          // yellow-500
  'Guitar': '#805ad5',      // purple-600
  'Hip Hop': '#dd6b20',     // orange-600
  'Vocal': '#3182ce',       // blue-600
  'Other': '#a0aec0',       // gray-500
};

// Custom tooltip for the scatter chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
        <p className="font-medium text-gray-900 mb-1">{data.soundName}</p>
        <p className="text-sm text-gray-500 mb-2">Category: {data.category}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Engagement:</span>
            <span className="font-medium">{formatPercent(data.engagementRate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Completion:</span>
            <span className="font-medium">{formatPercent(data.completionRate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Share Rate:</span>
            <span className="font-medium">{formatPercent(data.shareRate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tempo:</span>
            <span className="font-medium">{data.tempo} BPM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">{data.duration}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Usage:</span>
            <span className="font-medium">{formatNumber(data.usageCount)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function SoundEngagementCorrelation({ className = "", isPremium = false }: SoundEngagementCorrelationProps) {
  // State for the component
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CorrelationData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('engagement');
  const [xAxis, setXAxis] = useState<'tempo' | 'duration'>('tempo');
  const [yAxis, setYAxis] = useState<'engagementRate' | 'completionRate' | 'shareRate'>('engagementRate');
  const [minEngagement, setMinEngagement] = useState<string>('0');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'correlation' | 'analysis'>('correlation');

  // Fetch the data from the API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construct the URL with the query parameters
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      params.append('sortBy', sortBy);
      params.append('minEngagement', minEngagement);

      const response = await fetch(`/api/analytics/sound-engagement?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch correlation data: ${response.status}`);
      }
      
      const { success, data, error } = await response.json();
      
      if (!success) {
        throw new Error(error || 'Failed to fetch correlation data');
      }
      
      setData(data as CorrelationData);
    } catch (err) {
      console.error('Error fetching sound engagement correlation data:', err);
      setError((err as Error).message || 'Failed to load correlation data');
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters when they change
  const applyFilters = () => {
    fetchData();
    setShowFilters(false);
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory('all');
    setSortBy('engagement');
    setMinEngagement('0');
    setXAxis('tempo');
    setYAxis('engagementRate');
  };

  // Render the scatter chart
  const renderScatterChart = () => {
    if (!data || data.points.length === 0) return null;

    // Prepare data for the chart
    const chartData = data.points.map(point => ({
      ...point,
      // For size scaling in the chart (based on usage count)
      z: Math.sqrt(point.usageCount) / 20
    }));

    // Get dynamic axis labels based on selection
    const xAxisLabel = xAxis === 'tempo' ? 'Tempo (BPM)' : 'Duration (seconds)';
    const yAxisLabel = yAxis === 'engagementRate' 
      ? 'Engagement Rate' 
      : yAxis === 'completionRate' 
        ? 'Completion Rate' 
        : 'Share Rate';

    return (
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">X Axis</label>
              <Select 
                value={xAxis} 
                onValueChange={(value) => setXAxis(value as 'tempo' | 'duration')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="X Axis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tempo">Tempo</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Y Axis</label>
              <Select 
                value={yAxis} 
                onValueChange={(value) => setYAxis(value as 'engagementRate' | 'completionRate' | 'shareRate')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Y Axis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engagementRate">Engagement</SelectItem>
                  <SelectItem value="completionRate">Completion</SelectItem>
                  <SelectItem value="shareRate">Share Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} className="mr-1" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <Card className="p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <Select 
                  value={selectedCategory} 
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {data.categories.map(cat => (
                      <SelectItem key={cat.category} value={cat.category}>
                        {cat.category} ({cat.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <Select 
                  value={sortBy} 
                  onValueChange={setSortBy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="completion">Completion</SelectItem>
                    <SelectItem value="share">Share Rate</SelectItem>
                    <SelectItem value="usage">Usage Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min. Engagement</label>
                <Select 
                  value={minEngagement} 
                  onValueChange={setMinEngagement}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Min. Engagement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any</SelectItem>
                    <SelectItem value="0.3">30%+</SelectItem>
                    <SelectItem value="0.4">40%+</SelectItem>
                    <SelectItem value="0.5">50%+</SelectItem>
                    <SelectItem value="0.6">60%+</SelectItem>
                    <SelectItem value="0.7">70%+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>Reset</Button>
              <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
            </div>
          </Card>
        )}

        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey={xAxis} 
                name={xAxisLabel} 
                domain={['dataMin - 10', 'dataMax + 10']}
                label={{ value: xAxisLabel, position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                type="number" 
                dataKey={yAxis} 
                name={yAxisLabel} 
                tickFormatter={formatPercent}
                domain={[0, 1]}
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
              />
              <ZAxis 
                type="number" 
                dataKey="z" 
                range={[50, 300]} 
                name="Usage Count" 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Scatter 
                name="Sounds" 
                data={chartData} 
                fill="#8884d8"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.category as keyof typeof COLORS] || COLORS.Other} 
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(COLORS).slice(0, 10).map(([category, color]) => (
            <div key={category} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-700">{category}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render insights section
  const renderInsights = () => {
    if (!data) return null;

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.insights.map(insight => (
            <Card key={insight.id} className="p-4">
              <div className="flex items-start">
                <div 
                  className={`p-2 rounded-full mr-3 ${
                    insight.impact === 'high' 
                      ? 'bg-red-100 text-red-600' 
                      : insight.impact === 'medium' 
                        ? 'bg-amber-100 text-amber-600' 
                        : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {insight.type === 'correlation' ? (
                    <Info size={18} />
                  ) : insight.type === 'trend' ? (
                    <TrendingUp size={18} />
                  ) : (
                    <ArrowUpRight size={18} />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  <Badge 
                    variant="outline" 
                    className={`mt-2 ${
                      insight.impact === 'high' 
                        ? 'border-red-200 text-red-700' 
                        : insight.impact === 'medium' 
                          ? 'border-amber-200 text-amber-700' 
                          : 'border-blue-200 text-blue-700'
                    }`}
                  >
                    {insight.impact.charAt(0).toUpperCase() + insight.impact.slice(1)} Impact
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Render summary metrics
  const renderSummaryMetrics = () => {
    if (!data) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-gray-500 text-sm">Total Sounds</div>
          <div className="text-2xl font-bold">{data.metrics.totalSounds}</div>
        </Card>
        <Card className="p-4">
          <div className="text-gray-500 text-sm">Avg. Engagement</div>
          <div className="text-2xl font-bold">{formatPercent(data.metrics.avgEngagementRate)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-gray-500 text-sm">Avg. Completion</div>
          <div className="text-2xl font-bold">{formatPercent(data.metrics.avgCompletionRate)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-gray-500 text-sm">Avg. Share Rate</div>
          <div className="text-2xl font-bold">{formatPercent(data.metrics.avgShareRate)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-gray-500 text-sm">Avg. Conversion</div>
          <div className="text-2xl font-bold">{formatPercent(data.metrics.avgConversionRate)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-gray-500 text-sm">Retention Impact</div>
          <div className="text-2xl font-bold">{formatPercent(data.metrics.avgUserRetentionImpact)}</div>
        </Card>
      </div>
    );
  };

  // Render comparative analysis section (premium)
  const renderComparativeAnalysis = () => {
    if (!data) return null;
    
    if (!isPremium) {
      return (
        <div className="mt-8">
          <PremiumFeatureGate
            featureName="Comparative Analysis"
            description="Unlock in-depth comparative analysis to discover patterns and optimization opportunities for your sounds."
          >
            <div className="flex justify-center items-center p-4">
              <BarChart size={48} className="text-blue-400 opacity-50" />
            </div>
          </PremiumFeatureGate>
        </div>
      );
    }

    return (
      <div className="mt-8 space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Sounds</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.comparativeAnalysis.topPerformers.map((sound, index) => (
              <Card key={sound.soundId} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <Badge className="mr-2 bg-blue-100 text-blue-700 border-0">#{index + 1}</Badge>
                      <h4 className="font-medium text-gray-900">{sound.soundName}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Category: {sound.category}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600 w-24">Engagement:</span>
                        <span className="font-medium">{formatPercent(sound.engagementRate)}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600 w-24">Completion:</span>
                        <span className="font-medium">{formatPercent(sound.completionRate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Improvement Potential</div>
                    <div className="text-lg font-semibold">
                      {formatPercent(sound.improvementPotential)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance Comparison</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sounds
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Engagement
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Completion
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Share Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.comparativeAnalysis.categoryComparison.map((category) => (
                  <tr key={category.category}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[category.category as keyof typeof COLORS] || COLORS.Other }}
                        />
                        <div className="text-sm font-medium text-gray-900">{category.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.soundCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPercent(category.avgEngagement)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPercent(category.avgCompletion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPercent(category.avgShare)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Main component render
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sound-Engagement Correlation</h2>
          <p className="text-gray-500 mt-1">
            Analyze the relationship between sound attributes and user engagement metrics
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Tabs 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as 'correlation' | 'analysis')}
            className="w-[300px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="correlation">Correlation View</TabsTrigger>
              <TabsTrigger value="analysis">Comparative Analysis</TabsTrigger>
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
      ) : data ? (
        <div>
          {renderSummaryMetrics()}

          {viewMode === 'correlation' ? (
            <>
              {renderScatterChart()}
              {renderInsights()}
            </>
          ) : (
            renderComparativeAnalysis()
          )}
        </div>
      ) : null}
    </Card>
  );
} 