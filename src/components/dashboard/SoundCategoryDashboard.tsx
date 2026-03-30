"use client"

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Card } from '@/components/ui/card-component';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ChevronRight, Loader2, PieChart as PieChartIcon, TrendingUp, BarChart as BarChartIcon } from 'lucide-react';

// Types for the API response
interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

interface TrendingCategory {
  category: string;
  growthRate: number;
  velocity: number;
  previousRank: number;
  currentRank: number;
  rankChange: number;
}

interface TimeSeriesData {
  category: string;
  data: {
    date: string;
    value: number;
  }[];
}

interface SoundCategoryData {
  timeRange: string;
  distribution: CategoryDistribution[];
  trending: TrendingCategory[];
  timeSeries: TimeSeriesData[];
  totalSounds: number;
  categoriesCount: number;
}

// Component props
interface SoundCategoryDashboardProps {
  className?: string;
}

// Custom pie chart label to show percentage
const PieChartLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return percent > 0.05 ? (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  ) : null;
};

// Custom tooltip for the charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
        {label && <p className="text-sm text-gray-500 mb-2">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center text-sm">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700 font-medium">{entry.name}: </span>
            <span className="ml-1">{entry.value.toLocaleString()} ({entry.payload.percentage}%)</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

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

// Color palette for the pie chart
const COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
  '#0ea5e9', // sky-500
  '#a855f7', // purple-500
  '#f43f5e', // rose-500
  '#0891b2', // cyan-600
  '#65a30d', // lime-600
  '#4f46e5', // indigo-600
  '#db2777', // pink-600
];

export default function SoundCategoryDashboard({ className = "" }: SoundCategoryDashboardProps) {
  // State for the dashboard data
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SoundCategoryData | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [visualizationTab, setVisualizationTab] = useState<'distribution' | 'trends'>('distribution');

  // Fetch the data from the API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Construct the URL with the query parameters
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);

      const response = await fetch(`/api/analytics/sound-categories?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch category data: ${response.status}`);
      }
      
      const { success, data, error } = await response.json();
      
      if (!success) {
        throw new Error(error || 'Failed to fetch category data');
      }
      
      setData(data as SoundCategoryData);
    } catch (err) {
      console.error('Error fetching sound category data:', err);
      setError((err as Error).message || 'Failed to load category data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [timeRange]);

  // Render the pie chart for category distribution
  const renderPieChart = () => {
    if (!data) return null;

    return (
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.distribution.slice(0, 10)} // Limit to top 10 categories
              cx="50%"
              cy="50%"
              labelLine={false}
              label={PieChartLabel}
              outerRadius={150}
              fill="#8884d8"
              dataKey="count"
              nameKey="category"
            >
              {data.distribution.slice(0, 10).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend layout="vertical" verticalAlign="middle" align="right" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render the bar chart for category distribution
  const renderBarChart = () => {
    if (!data) return null;

    return (
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data.distribution.slice(0, 10)} // Limit to top 10 categories
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" tickFormatter={formatNumber} />
            <YAxis 
              type="category" 
              dataKey="category" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              name="Sounds" 
              fill="#3b82f6"
              background={{ fill: '#f1f5f9' }}
              radius={[0, 4, 4, 0]}
            >
              {data.distribution.slice(0, 10).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render the trending categories section
  const renderTrendingCategories = () => {
    if (!data) return null;

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Trending Categories</h3>
        <div className="space-y-4">
          {data.trending.map((category, index) => (
            <Card key={category.category} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-2 h-10 rounded-sm mr-3" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <div className="font-medium text-lg">{category.category}</div>
                    <div className="text-sm text-gray-500">
                      Rank: {category.currentRank}
                      {category.rankChange !== 0 && (
                        <span className="ml-2">
                          {category.rankChange > 0 ? (
                            <span className="text-green-600">
                              <ArrowUp size={14} className="inline mb-1" /> 
                              +{category.rankChange}
                            </span>
                          ) : (
                            <span className="text-red-600">
                              <ArrowDown size={14} className="inline mb-1" /> 
                              {category.rankChange}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <div className={`text-lg font-bold ${category.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatGrowthRate(category.growthRate)}
                    </div>
                    <ChevronRight className="ml-2 text-gray-400" size={18} />
                  </div>
                  <div className="text-xs text-gray-500">Growth Rate</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Render the time series chart for top categories
  const renderTimeSeriesChart = () => {
    if (!data) return null;

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Trends Over Time</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                allowDuplicatedCategory={false}
                type="category"
              />
              <YAxis 
                tickFormatter={formatNumber}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip />
              <Legend />
              {data.timeSeries.map((series, index) => (
                <Line
                  key={series.category}
                  data={series.data}
                  dataKey="value"
                  name={series.category}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Main component render
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sound Category Dashboard</h2>
          <p className="text-gray-500 mt-1">
            Explore sound distribution and trends by category
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
            value={visualizationTab} 
            onValueChange={(value) => setVisualizationTab(value as 'distribution' | 'trends')}
            className="w-[250px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
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
          {/* Summary stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-gray-500 text-sm">Total Sounds</div>
              <div className="text-2xl font-bold">{formatNumber(data.totalSounds)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-gray-500 text-sm">Categories</div>
              <div className="text-2xl font-bold">{data.categoriesCount}</div>
            </Card>
            <Card className="p-4">
              <div className="text-gray-500 text-sm">Top Category</div>
              <div className="text-2xl font-bold">{data.distribution[0].category}</div>
              <div className="text-sm text-gray-500 mt-1">{data.distribution[0].percentage}% of total</div>
            </Card>
          </div>

          {visualizationTab === 'distribution' ? (
            <div>
              <div className="flex justify-end mb-4">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
                  <Button 
                    variant={chartType === 'pie' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setChartType('pie')}
                    className="flex items-center"
                  >
                    <PieChartIcon size={16} className="mr-1" />
                    Pie
                  </Button>
                  <Button 
                    variant={chartType === 'bar' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setChartType('bar')}
                    className="flex items-center"
                  >
                    <BarChartIcon size={16} className="mr-1" />
                    Bar
                  </Button>
                </div>
              </div>
              
              {chartType === 'pie' ? renderPieChart() : renderBarChart()}
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {data.distribution.map((category, index) => (
                    <Badge 
                      key={category.category}
                      variant="outline" 
                      className="flex justify-between items-center py-2 px-3"
                    >
                      <span className="truncate">{category.category}</span>
                      <span className="ml-2 text-xs text-gray-500 whitespace-nowrap">{category.percentage}%</span>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {renderTrendingCategories()}
              {renderTimeSeriesChart()}
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
} 