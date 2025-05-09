"use client"

import { useState, useEffect } from 'react';
import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import { 
  BarChart2, TrendingUp, TrendingDown, Lock, Eye, 
  Filter, Share2, ThumbsUp, BarChart, PieChart, 
  ChevronDown, Calendar, Search, Check, ArrowRight, 
  LayoutDashboard, LineChart, Minus, ArrowUpRight,
  Video, BarChart4, Tag, SortDesc
} from 'lucide-react'
import Link from 'next/link'
import PerformanceChart from '@/components/analytics/PerformanceChart'
import TemplateComparison from '@/components/analytics/TemplateComparison'
import TemplateMetricsCard from '@/components/analytics/TemplateMetricsCard'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/design-utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

// Define time range type
type TimeRange = '7d' | '30d' | '90d' | 'ytd' | 'all';

// Helper function for time range labels
function getTimeRangeLabel(range: TimeRange): string {
  switch (range) {
    case '7d': return 'Last 7 Days';
    case '30d': return 'Last 30 Days';
    case '90d': return 'Last 90 Days';
    case 'ytd': return 'Year to Date';
    case 'all': return 'All Time';
    default: return '';
  }
}

// Types
interface Template {
  id: string;
  title: string;
  category: string;
  thumbnailUrl: string;
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    engagementRate: number;
  };
  analyticsData: {
    growthRate: number;
    viewTrend: string;
    bestPerformingDemographic: string;
    averageCompletionRate: number;
    conversionRate: number;
    sectionUsage: { [key: string]: number };
    conversionFunnel: {
      views: number;
      engaged: number;
      completed: number;
      converted: number;
    };
  };
  historyData: {
    dates: string[];
    views: number[];
    engagementRate: number[];
  };
  industryBenchmarks: {
    views: number;
    engagementRate: number;
  };
}

export default function AnalyticsPage() {
  const { tier, hasPremium } = useSubscription()
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [category, setCategory] = useState<string>('All')
  const [sort, setSort] = useState<'views' | 'engagement' | 'growth'>('views')
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [compareTemplate, setCompareTemplate] = useState<string | null>(null)
  const [comparisonMode, setComparisonMode] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showTimeRangeSelector, setShowTimeRangeSelector] = useState(false)
  const [showCategorySelector, setShowCategorySelector] = useState(false)
  const [showSortSelector, setShowSortSelector] = useState(false)
  const [comparisonData, setComparisonData] = useState<any>(null)
  const [selectedTemplateData, setSelectedTemplateData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  const handleTemplateClick = (id: string) => {
    if (comparisonMode && id !== selectedTemplate) {
      setCompareTemplate(id === compareTemplate ? null : id)
    } else {
      setSelectedTemplate(id)
      setCompareTemplate(null)
    }
  }

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/templates/analytics?timeRange=${timeRange}&category=${category}&sort=${sort}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data')
        }
        
        const data = await response.json()
        
        if (data.success && data.templates) {
          setTemplates(data.templates)
          // Set the first template as selected if none is selected
          if (!selectedTemplate && data.templates.length > 0) {
            setSelectedTemplate(data.templates[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnalytics()
  }, [timeRange, category, sort])
  
  // TEMPORARILY COMMENTED OUT FOR DEVELOPMENT/TESTING
  // If user doesn't have premium, show upgrade prompt
  /*
  if (!hasPremium) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-12 text-center">
        <div className="mb-4 rounded-full bg-blue-100 p-4">
          <Lock className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Premium Feature</h1>
        <p className="mb-6 max-w-md text-gray-600">
          Performance analytics is available for Premium and Business subscribers. Upgrade your plan to access detailed insights about your content performance.
        </p>
        <div className="flex gap-4">
          <Link
            href="/pricing"
            className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
          >
            Upgrade to Premium
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }
  */
  
  // Use effects to update the selected template data
  useEffect(() => {
    // Update the selectedTemplateData whenever templates or selectedTemplate changes
    if (templates.length > 0 && selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      setSelectedTemplateData(template || null);
    } else {
      setSelectedTemplateData(null);
    }
  }, [templates, selectedTemplate]);

  // Update compareTemplateData similar way
  useEffect(() => {
    if (templates.length > 0 && compareTemplate) {
      const template = templates.find(t => t.id === compareTemplate);
      setComparisonData(template || null);
    } else {
      setComparisonData(null);
    }
  }, [templates, compareTemplate]);
  
  // Filter templates based on search term
  const filteredTemplates = templates.filter(
    t => searchTerm === '' || 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Prepare chart data
  const prepareViewChartData = () => {
    if (!selectedTemplateData) return []
    
    return selectedTemplateData.historyData.dates.map((date: string, index: number) => ({
      date,
      value: selectedTemplateData.historyData.views[index],
      benchmark: selectedTemplateData.industryBenchmarks.views
    }))
  }
  
  const prepareEngagementChartData = () => {
    if (!selectedTemplateData) return []
    
    return selectedTemplateData.historyData.dates.map((date: string, index: number) => ({
      date,
      value: selectedTemplateData.historyData.engagementRate[index] * 100, // Convert to percentage
      benchmark: selectedTemplateData.industryBenchmarks.engagementRate * 100 // Convert to percentage
    }))
  }
  
  // Prepare comparison data
  const prepareComparisonData = () => {
    if (!selectedTemplateData) return []
    
    const metrics = [
      { 
        name: 'Engagement', 
        template1: Math.round(selectedTemplateData.stats.engagementRate * 100),
        template2: comparisonData ? Math.round(comparisonData.stats.engagementRate * 100) : undefined,
        fullMark: 100 
      },
      { 
        name: 'Growth', 
        template1: Math.round(selectedTemplateData.analyticsData.growthRate * 100),
        template2: comparisonData ? Math.round(comparisonData.analyticsData.growthRate * 100) : undefined,
        fullMark: 100 
      },
      { 
        name: 'Completion', 
        template1: Math.round(selectedTemplateData.analyticsData.averageCompletionRate * 100),
        template2: comparisonData ? Math.round(comparisonData.analyticsData.averageCompletionRate * 100) : undefined,
        fullMark: 100 
      },
      { 
        name: 'Conversion', 
        template1: Math.round(selectedTemplateData.analyticsData.conversionRate * 100),
        template2: comparisonData ? Math.round(comparisonData.analyticsData.conversionRate * 100) : undefined,
        fullMark: 100 
      },
      { 
        name: 'Shares', 
        template1: Math.min(100, Math.round((selectedTemplateData.stats.shares / selectedTemplateData.stats.views) * 1000)),
        template2: comparisonData ? Math.min(100, Math.round((comparisonData.stats.shares / comparisonData.stats.views) * 1000)) : undefined,
        fullMark: 100 
      }
    ]
    
    return metrics
  }

  // Calculate metrics for the metrics card
  const calculateMetrics = () => {
    if (!selectedTemplateData) return []
    
    const engagementVsAvg = Math.round(
      ((selectedTemplateData.stats.engagementRate / selectedTemplateData.industryBenchmarks.engagementRate) - 1) * 100
    )
    
    const viewsVsAvg = Math.round(
      ((selectedTemplateData.stats.views / selectedTemplateData.industryBenchmarks.views) - 1) * 100
    )
    
    return [
      {
        label: 'Total Views',
        value: selectedTemplateData.stats.views,
        change: viewsVsAvg,
        icon: <Eye size={16} className="text-blue-500" />,
        color: 'bg-blue-100'
      },
      {
        label: 'Engagement Rate',
        value: `${(selectedTemplateData.stats.engagementRate * 100).toFixed(1)}%`,
        change: engagementVsAvg,
        icon: <TrendingUp size={16} className="text-green-500" />,
        color: 'bg-green-100'
      },
      {
        label: 'Likes',
        value: selectedTemplateData.stats.likes,
        icon: <ThumbsUp size={16} className="text-pink-500" />,
        color: 'bg-pink-100'
      },
      {
        label: 'Shares',
        value: selectedTemplateData.stats.shares,
        icon: <Share2 size={16} className="text-purple-500" />,
        color: 'bg-purple-100'
      }
    ]
  }
  
  // Format view numbers
  const formatViews = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M'
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K'
    }
    return value.toString()
  }
  
  // Format percentage values
  const formatPercent = (value: number) => {
    return value.toFixed(1) + '%'
  }
  
  // Loading state
  if (loading) {
    return <div className="flex h-64 items-center justify-center">Loading analytics data...</div>
  }
  
  // Premium users see the analytics content
  return (
    <div className="w-full max-w-screen-2xl mx-auto py-6 space-y-6 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold mb-1">Performance Analytics</h1>
          <p className="text-muted-foreground">Track and optimize your content performance</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector with dropdown */}
          <Popover open={showTimeRangeSelector} onOpenChange={setShowTimeRangeSelector}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "h-9 border-gray-200 gap-1",
                  showTimeRangeSelector && "border-primary/50 bg-gray-50"
                )}
              >
                <Calendar className="h-4 w-4 text-gray-500" />
                {getTimeRangeLabel(timeRange as TimeRange)}
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 text-gray-500 transition-transform",
                  showTimeRangeSelector && "transform rotate-180"
                )} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end">
              <div className="py-1">
                {['7d', '30d', '90d', 'ytd', 'all'].map((range) => (
                  <motion.button
                    key={range}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors",
                      timeRange === range && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => {
                      setTimeRange(range as TimeRange);
                      setShowTimeRangeSelector(false);
                    }}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {getTimeRangeLabel(range as TimeRange)}
                  </motion.button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Category Filter */}
          <Popover open={showCategorySelector} onOpenChange={setShowCategorySelector}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "h-9 border-gray-200 gap-1",
                  showCategorySelector && "border-primary/50 bg-gray-50",
                  category !== 'All' && "border-primary/30 text-primary"
                )}
              >
                <Filter className={cn(
                  "h-4 w-4",
                  category !== 'All' ? "text-primary" : "text-gray-500"
                )} />
                {category}
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 text-gray-500 transition-transform",
                  showCategorySelector && "transform rotate-180"
                )} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end">
              <div className="py-1">
                {['All', 'Entertainment', 'Education', 'Marketing', 'Lifestyle'].map((cat) => (
                  <motion.button
                    key={cat}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors",
                      category === cat && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => {
                      setCategory(cat);
                      setShowCategorySelector(false);
                    }}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {cat}
                  </motion.button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Sort By */}
          <Popover open={showSortSelector} onOpenChange={setShowSortSelector}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "h-9 border-gray-200",
                  showSortSelector && "border-primary/50 bg-gray-50"
                )}
              >
                {sort === 'views' ? 'Sort: Views' : 
                 sort === 'engagement' ? 'Sort: Engagement' : 'Sort: Growth'}
                <ChevronDown className={cn(
                  "ml-1 h-3.5 w-3.5 text-gray-500 transition-transform",
                  showSortSelector && "transform rotate-180"
                )} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0" align="end">
              <div className="py-1">
                {[
                  {value: 'views', label: 'Views'},
                  {value: 'engagement', label: 'Engagement'},
                  {value: 'growth', label: 'Growth'}
                ].map((option) => (
                  <motion.button
                    key={option.value}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors",
                      sort === option.value && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => {
                      setSort(option.value as any);
                      setShowSortSelector(false);
                    }}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </motion.div>
    
      <motion.h2 
        className="text-xl font-medium mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        Select Template to Analyze
      </motion.h2>
      
      <motion.div 
        className="relative mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full max-w-md"
        />
      </motion.div>
      
      {loading ? (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="h-32 bg-gray-100 animate-pulse rounded-lg border border-gray-200"
            />
          ))}
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          initial="hidden"
          animate="show"
        >
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              className={cn(
                "rounded-lg border border-gray-200 overflow-hidden cursor-pointer transition-all",
                "hover:shadow-md hover:border-primary/30",
                selectedTemplate === template.id && "ring-2 ring-primary shadow-md",
                comparisonMode && compareTemplate === template.id && "ring-2 ring-purple-500 shadow-md"
              )}
              onClick={() => {
                handleTemplateClick(template.id)
              }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative h-20">
                <img
                  src={template.thumbnailUrl}
                  alt={template.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 text-white font-medium text-sm">
                  {template.title}
                </div>
                <div className="absolute top-2 right-2">
                  <Badge color="blue">{template.category}</Badge>
                </div>
              </div>
              <div className="p-3 flex justify-between items-center">
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Eye className="h-3 w-3" />
                    <span>{formatViews(template.stats.views)} views</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <TrendingUp className="h-3 w-3" />
                    <span>{(template.stats.engagementRate * 100).toFixed(1)}% eng.</span>
                  </div>
                </div>
                {selectedTemplate === template.id && (
                  <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                {comparisonMode && compareTemplate === template.id && (
                  <div className="h-6 w-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {filteredTemplates.length === 0 && (
            <motion.div
              className="col-span-full flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 text-center"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1 }
              }}
            >
              <Search className="h-10 w-10 text-gray-300 mb-2" />
              <h3 className="text-base font-medium mb-1">No templates found</h3>
              <p className="text-gray-500 max-w-md mb-4">
                {searchTerm ? `No templates matching "${searchTerm}"` : 'No templates match the current filters.'}
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setCategory('All');
                }}
              >
                Clear filters
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}
      
      <div className="mt-8">
        {selectedTemplateData ? (
          <div className="space-y-6">
            {/* Metrics Overview */}
            <TemplateMetricsCard 
              title="Performance Overview" 
              metrics={calculateMetrics()} 
            />
            
            {/* Add "Select another template to compare" link */}
            {selectedTemplate && !compareTemplate && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <Button
                  variant="ghost"
                  onClick={() => setComparisonMode(true)}
                  className="text-primary hover:text-primary-dark hover:bg-primary-50 flex items-center gap-1"
                >
                  <span>Select another template to compare</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            )}
            
            {/* Comparison mode instructions */}
            {comparisonMode && !compareTemplate && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-md p-4 text-center"
              >
                <p className="text-blue-800 font-medium mb-2">Select a second template to compare</p>
                <p className="text-blue-600 text-sm">Click on any template from the list above to compare with {selectedTemplateData.title}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setComparisonMode(false)} 
                  className="mt-3 text-blue-700 border-blue-300 bg-white hover:bg-blue-50"
                >
                  Cancel
                </Button>
              </motion.div>
            )}
            
            {/* Template Comparison - Move this before the charts when we have a comparison */}
            {selectedTemplate && compareTemplate && (
              <TemplateComparison
                template1={{
                  id: selectedTemplateData?.id || '',
                  title: selectedTemplateData?.title || '',
                  color: '#3b82f6', // blue
                  stats: {
                    views: selectedTemplateData?.stats.views || 0,
                    engagementRate: selectedTemplateData?.stats.engagementRate || 0,
                    growthRate: selectedTemplateData?.analyticsData.growthRate || 0,
                    completionRate: selectedTemplateData?.analyticsData.averageCompletionRate || 0
                  }
                }}
                template2={comparisonData ? {
                  id: comparisonData.id,
                  title: comparisonData.title,
                  color: '#8b5cf6', // purple
                  stats: {
                    views: comparisonData.stats.views,
                    engagementRate: comparisonData.stats.engagementRate,
                    growthRate: comparisonData.analyticsData.growthRate,
                    completionRate: comparisonData.analyticsData.averageCompletionRate
                  }
                } : undefined}
                metrics={prepareComparisonData()}
                className="mb-6"
                isActive={true}
              />
            )}
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Views Chart */}
              <PerformanceChart
                data={prepareViewChartData()}
                title="View Trends"
                valueLabel="Views"
                formatValue={formatViews}
                color="#3b82f6" // blue
              />
              
              {/* Engagement Chart */}
              <PerformanceChart
                data={prepareEngagementChartData()}
                title="Engagement Rate"
                valueLabel="Engagement %"
                formatValue={formatPercent}
                color="#10b981" // green
              />
            </div>
            
            {/* Additional Details */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Additional Insights</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <h3 className="mb-2 font-medium text-gray-700">Demographic Data</h3>
                    <p className="text-gray-600">
                      Best performing demographic: <span className="font-semibold">{selectedTemplateData.analyticsData.bestPerformingDemographic}</span>
                    </p>
                  </div>
                  
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <h3 className="mb-2 font-medium text-gray-700">Content Completion</h3>
                    <p className="text-gray-600">
                      Average completion rate: <span className="font-semibold">{(selectedTemplateData.analyticsData.averageCompletionRate * 100).toFixed(1)}%</span>
                    </p>
                  </div>
                </div>
                
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <h3 className="mb-2 font-medium text-gray-700">Growth Trajectory</h3>
                  <p className="text-gray-600">
                    This template is currently <span className="font-semibold">{selectedTemplateData.analyticsData.viewTrend}</span> in popularity.
                    It has a growth rate of <span className="font-semibold">{(selectedTemplateData.analyticsData.growthRate * 100).toFixed(1)}%</span> which is 
                    {selectedTemplateData.analyticsData.growthRate > 0.2 ? ' above average' : ' average'} for its category.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-gray-500">Select a template to view analytics.</p>
          </div>
        )}
      </div>
    </div>
  )
} 