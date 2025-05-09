"use client"

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card-component';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Clock, TrendingUp, BarChart2, Briefcase, ChevronRight, Settings, CheckCircle, Download, ThumbsUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types for the expert insights
interface ExpertInsight {
  id: string;
  expert: {
    name: string;
    role: string;
    avatar?: string;
    verified: boolean;
  };
  title: string;
  summary: string;
  content: string;
  category: string; // 'user-retention' | 'user-engagement' | 'conversion'
  date: string;
  stats: {
    implementations: number;
    successRate: number;
    avgRetentionIncrease?: number;
    avgEngagementIncrease?: number;
    avgConversionIncrease?: number;
    avgFocusIncrease?: number;
  };
  recommendations: string[];
}

interface CategoryCount {
  name: string;
  count: number;
}

interface ExpertInsightsData {
  insights: ExpertInsight[];
  categories: CategoryCount[];
  totalInsights: number;
  featuredInsight: ExpertInsight | null;
}

// Component props
interface ExpertSoundInsightsProps {
  className?: string;
}

// Format time function
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) {
    return `${seconds} seconds ago`;
  } else if (minutes < 60) {
    return `${minutes} minutes ago`;
  } else if (hours < 24) {
    return `${hours} hours ago`;
  } else if (days < 30) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Category icon mapping
const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'trending':
      return <TrendingUp size={18} />;
    case 'technical':
      return <Settings size={18} />;
    case 'creative':
      return <BarChart2 size={18} />;
    case 'business':
      return <Briefcase size={18} />;
    default:
      return <TrendingUp size={18} />;
  }
};

export default function ExpertSoundInsights({ className = "" }: ExpertSoundInsightsProps) {
  // Component state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ExpertInsightsData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'timestamp'>('relevance');
  const [selectedInsight, setSelectedInsight] = useState<ExpertInsight | null>(null);
  const [appliedRecommendations, setAppliedRecommendations] = useState<string[]>([]);

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
      params.append('sort', sortBy === 'relevance' ? 'success-rate' : 'latest');

      const response = await fetch(`/api/insights/sound-experts?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch expert insights: ${response.status}`);
      }
      
      // Direct parsing of the response without checking 'success' flag
      const responseData = await response.json();
      
      // Set data using the response structure that matches the API
      setData({
        insights: responseData.insights || [],
        categories: responseData.categories || [],
        totalInsights: responseData.total || 0,
        featuredInsight: null
      });
      
      if (responseData.insights && responseData.insights.length > 0) {
        setSelectedInsight(responseData.insights[0]);
      }
    } catch (err) {
      console.error('Error fetching expert insights:', err);
      setError((err as Error).message || 'Failed to load expert insights');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [selectedCategory, sortBy]);

  // Apply recommendation
  const handleApplyRecommendation = (recommendationId: string) => {
    if (appliedRecommendations.includes(recommendationId)) {
      // Remove if already applied
      setAppliedRecommendations(appliedRecommendations.filter(id => id !== recommendationId));
    } else {
      // Add to applied recommendations
      setAppliedRecommendations([...appliedRecommendations, recommendationId]);
    }
  };

  // Render insights list
  const renderInsightsList = () => {
    if (!data || !data.insights) return null;

    return (
      <div className="space-y-4">
        {data.insights.map(insight => (
          <Card 
            key={insight.id} 
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedInsight?.id === insight.id ? 'border-blue-500 shadow-sm' : ''
            }`}
            onClick={() => setSelectedInsight(insight)}
          >
            <div className="flex items-start space-x-4">
              <div 
                className={`p-2 rounded-full ${
                  insight.category === 'user-retention' 
                    ? 'bg-purple-100 text-purple-600' 
                    : insight.category === 'user-engagement' 
                      ? 'bg-blue-100 text-blue-600' 
                      : insight.category === 'conversion' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-amber-100 text-amber-600'
                }`}
              >
                <CategoryIcon category={insight.category} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{insight.title}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{insight.summary}</p>
                <div className="flex items-center mt-2">
                  <div className="text-xs text-gray-500 flex items-center">
                    <Clock size={12} className="mr-1" />
                    {formatTimeAgo(insight.date)}
                  </div>
                  <Badge 
                    variant="outline"
                    className="ml-2 text-xs capitalize"
                  >
                    {insight.category}
                  </Badge>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400 mt-2" />
            </div>
          </Card>
        ))}
      </div>
    );
  };

  // Render detailed insight view
  const renderDetailedInsight = () => {
    if (!selectedInsight) return null;

    return (
      <div>
        <div className="mb-6">
          <div 
            className={`inline-block p-2 rounded-full mb-4 ${
              selectedInsight.category === 'user-retention' 
                ? 'bg-purple-100 text-purple-600' 
                : selectedInsight.category === 'user-engagement' 
                  ? 'bg-blue-100 text-blue-600' 
                  : selectedInsight.category === 'conversion' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-amber-100 text-amber-600'
            }`}
          >
            <CategoryIcon category={selectedInsight.category} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">{selectedInsight.title}</h2>
          <p className="text-lg text-gray-600 mt-2">{selectedInsight.summary}</p>
          
          <div className="flex items-center mt-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedInsight.expert.avatar} />
              <AvatarFallback>{selectedInsight.expert.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{selectedInsight.expert.name}</p>
              <p className="text-xs text-gray-500">{selectedInsight.expert.role}</p>
            </div>
            <div className="ml-auto text-sm text-gray-500">
              {formatTimeAgo(selectedInsight.date)}
            </div>
          </div>
        </div>
        
        <div className="prose prose-blue max-w-none mb-8">
          {selectedInsight.content.split('\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Implementation Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-sm text-gray-500">Implementations</div>
              <div className="text-xl font-bold text-gray-900">{selectedInsight.stats.implementations}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-500">Success Rate</div>
              <div className="text-xl font-bold text-gray-900">{selectedInsight.stats.successRate}%</div>
            </Card>
            {selectedInsight.stats.avgRetentionIncrease && (
              <Card className="p-4">
                <div className="text-sm text-gray-500">Avg. Retention Increase</div>
                <div className="text-xl font-bold text-gray-900">{selectedInsight.stats.avgRetentionIncrease}%</div>
              </Card>
            )}
            {selectedInsight.stats.avgEngagementIncrease && (
              <Card className="p-4">
                <div className="text-sm text-gray-500">Avg. Engagement Increase</div>
                <div className="text-xl font-bold text-gray-900">{selectedInsight.stats.avgEngagementIncrease}%</div>
              </Card>
            )}
          </div>
        </div>
        
        {selectedInsight.recommendations && selectedInsight.recommendations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h3>
            <div className="space-y-4">
              {selectedInsight.recommendations.map((recommendation, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-600">{recommendation}</p>
                    </div>
                    <Button 
                      variant={appliedRecommendations.includes(recommendation) ? "default" : "outline"}
                      size="sm"
                      className="ml-4"
                      onClick={() => handleApplyRecommendation(recommendation)}
                    >
                      {appliedRecommendations.includes(recommendation) ? (
                        <>
                          <CheckCircle size={16} className="mr-1" />
                          Applied
                        </>
                      ) : (
                        <>
                          <Download size={16} className="mr-1" />
                          Apply
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-end">
          <Button variant="ghost" size="sm" className="mr-2">
            <ThumbsUp size={16} className="mr-1" />
            Helpful
          </Button>
          <Button variant="ghost" size="sm">
            Share
          </Button>
        </div>
      </div>
    );
  };

  // Main component render
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Expert Sound Insights</h2>
          <p className="text-gray-500 mt-1">
            Curated expert analysis and recommendations on sound trends
          </p>
        </div>
        
        <div className="flex space-x-4 mt-4 md:mt-0">
          <div>
            <Select 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {data?.categories.map(cat => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.name} ({cat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select 
              value={sortBy} 
              onValueChange={(value) => setSortBy(value as 'relevance' | 'timestamp')}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="timestamp">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights ({data.totalInsights})</h3>
              {renderInsightsList()}
            </div>
          </div>
          <div className="md:col-span-2">
            {renderDetailedInsight()}
          </div>
        </div>
      ) : null}
    </Card>
  );
} 