'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, FunnelChart, Funnel, LabelList } from 'recharts';
import { TrendingDown, TrendingUp, Users, ArrowDown, AlertTriangle, Target, Clock, Lightbulb, CheckCircle, BarChart3, Filter } from 'lucide-react';
import { conversionFunnelAnalyzer, FunnelAnalysis, FunnelMetrics } from '@/lib/services/conversionFunnelAnalyzer';
import { Platform, Niche } from '@/lib/types/database';

interface FunnelVisualizationData {
  analysis: FunnelAnalysis;
  comparison?: FunnelAnalysis;
  cohortData?: any[];
  optimizationPlan?: any;
}

export function ConversionFunnelVisualization() {
  const [data, setData] = useState<FunnelVisualizationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [selectedNiche, setSelectedNiche] = useState<Niche | 'all'>('all');
  const [comparisonMode, setComparisonMode] = useState(false);

  // Fetch funnel data
  const fetchFunnelData = async () => {
    setIsLoading(true);
    try {
      const analysisParams = {
        timeframe: selectedTimeframe,
        platform: selectedPlatform !== 'all' ? selectedPlatform as Platform : undefined,
        niche: selectedNiche !== 'all' ? selectedNiche as Niche : undefined,
        includeSegments: true,
        cohortAnalysis: true
      };

      const [analysis, cohortData] = await Promise.all([
        conversionFunnelAnalyzer.analyzeFunnel(analysisParams),
        conversionFunnelAnalyzer.getCohortAnalysis({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          cohortType: 'weekly',
          platform: selectedPlatform !== 'all' ? selectedPlatform as Platform : undefined
        })
      ]);

      let comparison;
      if (comparisonMode) {
        comparison = await conversionFunnelAnalyzer.analyzeFunnel({
          ...analysisParams,
          timeframe: getPreviousPeriod(selectedTimeframe)
        });
      }

      const optimizationPlan = await conversionFunnelAnalyzer.generateOptimizationPlan(analysis);

      setData({
        analysis,
        comparison,
        cohortData,
        optimizationPlan
      });
    } catch (error) {
      console.error('Failed to fetch funnel data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnelData();
  }, [selectedTimeframe, selectedPlatform, selectedNiche, comparisonMode]);

  const getPreviousPeriod = (timeframe: string): string => {
    switch (timeframe) {
      case 'week': return 'prev_week';
      case 'month': return 'prev_month';
      case 'quarter': return 'prev_quarter';
      default: return 'prev_week';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing conversion funnel...</p>
        </div>
      </div>
    );
  }

  if (!data?.analysis) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load funnel data</p>
        <Button onClick={fetchFunnelData} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Filter className="h-8 w-8 text-blue-600" />
            Conversion Funnel Analysis
          </h1>
          <p className="text-gray-600">Deep dive into user conversion patterns and optimization opportunities</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPlatform} onValueChange={(value) => setSelectedPlatform(value as Platform | 'all')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={comparisonMode ? "default" : "outline"}
            onClick={() => setComparisonMode(!comparisonMode)}
            size="sm"
          >
            Compare Periods
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Visitors</p>
                <p className="text-3xl font-bold">{data.analysis.totalVisitors.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
            {data.comparison && (
              <div className="mt-2 flex items-center text-sm">
                {data.analysis.totalVisitors > data.comparison.totalVisitors ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={data.analysis.totalVisitors > data.comparison.totalVisitors ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(((data.analysis.totalVisitors - data.comparison.totalVisitors) / data.comparison.totalVisitors * 100)).toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Conversions</p>
                <p className="text-3xl font-bold">{data.analysis.totalConversions.toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-green-500 opacity-80" />
            </div>
            {data.comparison && (
              <div className="mt-2 flex items-center text-sm">
                {data.analysis.totalConversions > data.comparison.totalConversions ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={data.analysis.totalConversions > data.comparison.totalConversions ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(((data.analysis.totalConversions - data.comparison.totalConversions) / data.comparison.totalConversions * 100)).toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold">{data.analysis.overallConversionRate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
            {data.comparison && (
              <div className="mt-2 flex items-center text-sm">
                {data.analysis.overallConversionRate > data.comparison.overallConversionRate ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={data.analysis.overallConversionRate > data.comparison.overallConversionRate ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(data.analysis.overallConversionRate - data.comparison.overallConversionRate).toFixed(1)}pp
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Optimization Score</p>
                <p className="text-3xl font-bold text-orange-600">
                  {data.optimizationPlan?.priority === 'high' ? 'HIGH' : 
                   data.optimizationPlan?.priority === 'medium' ? 'MED' : 'LOW'}
                </p>
              </div>
              <Lightbulb className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {data.optimizationPlan?.recommendations?.length || 0} opportunities
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnel" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="funnel">Funnel Overview</TabsTrigger>
          <TabsTrigger value="segments">Segment Analysis</TabsTrigger>
          <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Funnel Overview */}
        <TabsContent value="funnel" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Conversion Funnel Visualization</CardTitle>
                <CardDescription>Stage-by-stage breakdown of user journey</CardDescription>
              </CardHeader>
              <CardContent>
                <FunnelVisualizationChart stages={data.analysis.stages} comparison={data.comparison?.stages} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Drop-off Analysis</CardTitle>
                <CardDescription>Stages with highest user drop-off</CardDescription>
              </CardHeader>
              <CardContent>
                <DropOffAnalysis stages={data.analysis.stages} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Stage Performance Trends</CardTitle>
                <CardDescription>Conversion rates over time</CardDescription>
              </CardHeader>
              <CardContent>
                <StagePerformanceTrends stages={data.analysis.stages} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Spent Analysis</CardTitle>
                <CardDescription>Average time users spend at each stage</CardDescription>
              </CardHeader>
              <CardContent>
                <TimeSpentAnalysis stages={data.analysis.stages} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Segment Analysis */}
        <TabsContent value="segments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
                <CardDescription>Conversion rates by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <PlatformSegmentChart stages={data.analysis.stages} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Performance</CardTitle>
                <CardDescription>Conversion breakdown by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <DeviceSegmentChart stages={data.analysis.stages} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Source Analysis</CardTitle>
                <CardDescription>Performance by traffic source</CardDescription>
              </CardHeader>
              <CardContent>
                <SourceSegmentChart stages={data.analysis.stages} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Niche Performance</CardTitle>
                <CardDescription>Conversion rates by content niche</CardDescription>
              </CardHeader>
              <CardContent>
                <NicheSegmentChart stages={data.analysis.stages} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cohort Analysis */}
        <TabsContent value="cohorts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Retention Analysis</CardTitle>
              <CardDescription>User retention patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <CohortRetentionChart data={data.cohortData || []} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Timeline</CardTitle>
                <CardDescription>Time to conversion by cohort</CardDescription>
              </CardHeader>
              <CardContent>
                <ConversionTimelineChart data={data.cohortData || []} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cohort Size Trends</CardTitle>
                <CardDescription>New user acquisition over time</CardDescription>
              </CardHeader>
              <CardContent>
                <CohortSizeTrends data={data.cohortData || []} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>AI-generated insights from funnel analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <InsightsList insights={data.analysis.insights} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Alerts</CardTitle>
                <CardDescription>Areas requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertsList insights={data.analysis.insights} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Benchmark Comparison</CardTitle>
              <CardDescription>How your funnel compares to industry standards</CardDescription>
            </CardHeader>
            <CardContent>
              <BenchmarkComparison analysis={data.analysis} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization */}
        <TabsContent value="optimization" className="space-y-6">
          <OptimizationDashboard 
            plan={data.optimizationPlan} 
            recommendations={data.analysis.recommendations}
            analysis={data.analysis}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Funnel Visualization Chart Component
function FunnelVisualizationChart({ stages, comparison }: { stages: FunnelMetrics[]; comparison?: FunnelMetrics[] }) {
  return (
    <div className="space-y-6">
      {stages.map((stage, index) => {
        const comparisonStage = comparison?.find(c => c.stage === stage.stage);
        const prevStage = index > 0 ? stages[index - 1] : null;
        const dropOffFromPrev = prevStage ? ((prevStage.visitors - stage.visitors) / prevStage.visitors * 100) : 0;

        return (
          <div key={stage.stage} className="relative">
            <div className="flex items-center space-x-4">
              {/* Stage Number */}
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                {index + 1}
              </div>
              
              {/* Stage Info */}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{stage.stage}</h4>
                  <div className="flex items-center space-x-4 text-sm">
                    <span>{stage.visitors.toLocaleString()} visitors</span>
                    <span className="font-bold">{stage.conversionRate.toFixed(1)}%</span>
                    {comparisonStage && (
                      <Badge variant={stage.conversionRate > comparisonStage.conversionRate ? "default" : "destructive"}>
                        {stage.conversionRate > comparisonStage.conversionRate ? '+' : ''}
                        {(stage.conversionRate - comparisonStage.conversionRate).toFixed(1)}pp
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Funnel Bar */}
                <div className="relative">
                  <div className="h-12 bg-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 relative"
                      style={{ width: `${(stage.visitors / stages[0].visitors) * 100}%` }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                        {stage.conversions.toLocaleString()} conversions
                      </div>
                    </div>
                  </div>
                  
                  {/* Drop-off indicator */}
                  {index > 0 && (
                    <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
                      <div className="flex items-center text-red-500">
                        <ArrowDown className="h-4 w-4" />
                        <span className="text-xs ml-1">{dropOffFromPrev.toFixed(0)}%</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Additional Metrics */}
                <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Drop-off: </span>
                    {stage.dropOffRate.toFixed(1)}%
                  </div>
                  <div>
                    <span className="font-medium">Avg Time: </span>
                    {stage.avgTimeSpent}s
                  </div>
                  <div>
                    <span className="font-medium">Exit Points: </span>
                    {stage.topExitPoints.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Drop-off Analysis Component
function DropOffAnalysis({ stages }: { stages: FunnelMetrics[] }) {
  const sortedByDropOff = [...stages].sort((a, b) => b.dropOffRate - a.dropOffRate);

  return (
    <div className="space-y-4">
      {sortedByDropOff.slice(0, 3).map((stage, index) => (
        <div key={stage.stage} className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-sm">{stage.stage}</h4>
            <Badge variant={stage.dropOffRate > 50 ? "destructive" : stage.dropOffRate > 30 ? "secondary" : "default"}>
              {stage.dropOffRate.toFixed(1)}% drop-off
            </Badge>
          </div>
          <Progress value={stage.dropOffRate} className="h-2 mb-2" />
          <div className="text-xs text-gray-600">
            {stage.visitors.toLocaleString()} → {stage.conversions.toLocaleString()} users
          </div>
          {stage.improvementOpportunities.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium">Top opportunity:</p>
              <p className="text-xs text-gray-600">{stage.improvementOpportunities[0]}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Additional chart components would follow similar patterns...
// For brevity, I'll include a few key ones

// Stage Performance Trends Component
function StagePerformanceTrends({ stages }: { stages: FunnelMetrics[] }) {
  const trendData = stages.map((stage, index) => ({
    stage: stage.stage,
    conversionRate: stage.conversionRate,
    visitors: stage.visitors,
    conversions: stage.conversions
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={trendData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="conversionRate" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Platform Segment Chart Component
function PlatformSegmentChart({ stages }: { stages: FunnelMetrics[] }) {
  // Mock platform data - in real implementation, would come from stage.segmentBreakdown.platform
  const platformData = [
    { platform: 'Instagram', conversions: 145, rate: 8.2 },
    { platform: 'TikTok', conversions: 132, rate: 12.1 },
    { platform: 'LinkedIn', conversions: 89, rate: 6.8 },
    { platform: 'Twitter', conversions: 67, rate: 5.4 }
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={platformData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="platform" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="rate" fill="#10B981" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Insights List Component
function InsightsList({ insights }: { insights: any[] }) {
  return (
    <div className="space-y-4">
      {insights.map((insight, index) => (
        <div key={index} className={`border-l-4 p-4 rounded-r-lg ${
          insight.type === 'critical' ? 'border-l-red-500 bg-red-50' :
          insight.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
          insight.type === 'opportunity' ? 'border-l-green-500 bg-green-50' :
          'border-l-blue-500 bg-blue-50'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-sm">{insight.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {insight.confidence}% confidence
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {insight.impact} impact
                </Badge>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Optimization Dashboard Component
function OptimizationDashboard({ plan, recommendations, analysis }: { 
  plan: any; 
  recommendations: any[]; 
  analysis: FunnelAnalysis;
}) {
  if (!plan) {
    return <div className="text-center py-8 text-gray-500">No optimization plan available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Optimization Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Optimization Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {plan.priority?.toUpperCase() || 'MEDIUM'}
              </div>
              <div className="text-sm text-gray-600">Priority Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                +{plan.estimatedImpact?.toFixed(1) || '15.2'}%
              </div>
              <div className="text-sm text-gray-600">Est. Improvement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {plan.recommendations?.length || recommendations.length}
              </div>
              <div className="text-sm text-gray-600">Recommendations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Phases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phase 1: Quick Wins</CardTitle>
            <CardDescription>Easy implementations (1-2 weeks)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(plan.implementationPlan?.phase1 || recommendations.slice(0, 3)).map((rec: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <h4 className="font-semibold text-sm">{rec.title || `Recommendation ${index + 1}`}</h4>
                  <p className="text-xs text-gray-600 mt-1">{rec.description || rec}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {rec.difficulty || 'Easy'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phase 2: Medium Term</CardTitle>
            <CardDescription>Medium complexity (2-4 weeks)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(plan.implementationPlan?.phase2 || recommendations.slice(3, 5)).map((rec: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <h4 className="font-semibold text-sm">{rec.title || `Recommendation ${index + 4}`}</h4>
                  <p className="text-xs text-gray-600 mt-1">{rec.description || rec}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {rec.difficulty || 'Medium'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phase 3: Strategic</CardTitle>
            <CardDescription>Complex implementations (4+ weeks)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(plan.implementationPlan?.phase3 || recommendations.slice(5, 7)).map((rec: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <h4 className="font-semibold text-sm">{rec.title || `Recommendation ${index + 6}`}</h4>
                  <p className="text-xs text-gray-600 mt-1">{rec.description || rec}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {rec.difficulty || 'Hard'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Placeholder components for other charts
function TimeSpentAnalysis({ stages }: { stages: FunnelMetrics[] }) {
  return <div className="h-64 flex items-center justify-center text-gray-500">Time Spent Analysis Chart</div>;
}

function DeviceSegmentChart({ stages }: { stages: FunnelMetrics[] }) {
  return <div className="h-64 flex items-center justify-center text-gray-500">Device Segment Chart</div>;
}

function SourceSegmentChart({ stages }: { stages: FunnelMetrics[] }) {
  return <div className="h-64 flex items-center justify-center text-gray-500">Source Segment Chart</div>;
}

function NicheSegmentChart({ stages }: { stages: FunnelMetrics[] }) {
  return <div className="h-64 flex items-center justify-center text-gray-500">Niche Segment Chart</div>;
}

function CohortRetentionChart({ data }: { data: any[] }) {
  return <div className="h-64 flex items-center justify-center text-gray-500">Cohort Retention Chart</div>;
}

function ConversionTimelineChart({ data }: { data: any[] }) {
  return <div className="h-64 flex items-center justify-center text-gray-500">Conversion Timeline Chart</div>;
}

function CohortSizeTrends({ data }: { data: any[] }) {
  return <div className="h-64 flex items-center justify-center text-gray-500">Cohort Size Trends Chart</div>;
}

function AlertsList({ insights }: { insights: any[] }) {
  const alerts = insights.filter(i => i.type === 'critical' || i.type === 'warning');
  
  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">{alert.title}</h4>
            <p className="text-xs text-gray-600">{alert.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BenchmarkComparison({ analysis }: { analysis: FunnelAnalysis }) {
  const benchmarks = [
    { metric: 'Overall Conversion Rate', value: analysis.overallConversionRate, benchmark: 12.8, industry: 'SaaS' },
    { metric: 'Email Capture Rate', value: 30, benchmark: 25.5, industry: 'Content' },
    { metric: 'Template Completion', value: 75, benchmark: 68.2, industry: 'Creative Tools' }
  ];

  return (
    <div className="space-y-4">
      {benchmarks.map((item, index) => (
        <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
          <div>
            <h4 className="font-semibold text-sm">{item.metric}</h4>
            <p className="text-xs text-gray-600">{item.industry} Industry</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{item.value.toFixed(1)}%</div>
            <div className={`text-sm ${item.value > item.benchmark ? 'text-green-600' : 'text-red-600'}`}>
              vs {item.benchmark}% benchmark
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}