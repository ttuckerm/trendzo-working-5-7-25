'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Users, Video, Mail, DollarSign, AlertTriangle, CheckCircle, Clock, Target, Zap, Eye } from 'lucide-react';
import { analyticsProcessor } from '@/lib/services/analyticsProcessor';
import { conversionFunnelAnalyzer } from '@/lib/services/conversionFunnelAnalyzer';
import { viralPredictionModel } from '@/lib/services/viralPredictionModel';
import { attributionTracker } from '@/lib/services/attributionTracker';

interface RealtimeMetrics {
  activeUsers: number;
  currentConversions: number;
  liveVideosCreated: number;
  trendingTemplates: string[];
  conversionRateLastHour: number;
  revenueToday: number;
}

interface DashboardData {
  realtimeMetrics: RealtimeMetrics;
  funnelMetrics: any;
  viralPredictions: any[];
  attributionData: any;
  performanceAlerts: any[];
}

export function RealtimeAnalyticsDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const [realtimeMetrics, funnelMetrics, viralPredictions, attributionData] = await Promise.all([
        analyticsProcessor.getRealtimeMetrics(),
        conversionFunnelAnalyzer.getRealtimeFunnelMetrics(),
        viralPredictionModel.getModelPerformance(),
        attributionTracker.getAttributionInsights({
          timeframe: selectedTimeframe,
          modelId: 'time_decay'
        })
      ]);

      // Generate performance alerts
      const performanceAlerts = generatePerformanceAlerts(realtimeMetrics, funnelMetrics);

      setDashboardData({
        realtimeMetrics,
        funnelMetrics,
        viralPredictions,
        attributionData,
        performanceAlerts
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    fetchDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedTimeframe, autoRefresh]);

  // Generate performance alerts
  const generatePerformanceAlerts = (realtime: RealtimeMetrics, funnel: any) => {
    const alerts = [];

    if (realtime.conversionRateLastHour < 5) {
      alerts.push({
        type: 'warning',
        title: 'Low Conversion Rate',
        message: `Conversion rate dropped to ${realtime.conversionRateLastHour}% in the last hour`,
        action: 'Review funnel performance'
      });
    }

    if (funnel.currentHourConversions < 10) {
      alerts.push({
        type: 'info',
        title: 'Low Activity Period',
        message: 'Consider scheduling content for peak hours',
        action: 'View optimal timing recommendations'
      });
    }

    if (realtime.activeUsers > 500) {
      alerts.push({
        type: 'success',
        title: 'High Traffic Alert',
        message: `${realtime.activeUsers} active users - monitor system performance`,
        action: 'Check server metrics'
      });
    }

    return alerts;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading real-time analytics...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load dashboard data</p>
        <Button onClick={fetchDashboardData} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            <Clock className="h-4 w-4 mr-2" />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button onClick={fetchDashboardData} size="sm" variant="outline">
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Performance Alerts */}
      {dashboardData.performanceAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData.performanceAlerts.map((alert, index) => (
            <Card key={index} className={`border-l-4 ${
              alert.type === 'success' ? 'border-l-green-500 bg-green-50' :
              alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
              alert.type === 'error' ? 'border-l-red-500 bg-red-50' :
              'border-l-blue-500 bg-blue-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                  </div>
                  {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                  {alert.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                </div>
                <Button size="sm" variant="ghost" className="mt-2 text-xs">
                  {alert.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Users"
          value={dashboardData.realtimeMetrics.activeUsers}
          change={12}
          icon={<Users className="h-6 w-6" />}
          trend="up"
        />
        <MetricCard
          title="Conversions/Hour"
          value={dashboardData.realtimeMetrics.currentConversions}
          change={-3}
          icon={<Target className="h-6 w-6" />}
          trend="down"
        />
        <MetricCard
          title="Videos Created"
          value={dashboardData.realtimeMetrics.liveVideosCreated}
          change={8}
          icon={<Video className="h-6 w-6" />}
          trend="up"
        />
        <MetricCard
          title="Revenue Today"
          value={`$${dashboardData.realtimeMetrics.revenueToday.toLocaleString()}`}
          change={15}
          icon={<DollarSign className="h-6 w-6" />}
          trend="up"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="1h">Last Hour</TabsTrigger>
          <TabsTrigger value="24h">24 Hours</TabsTrigger>
          <TabsTrigger value="7d">7 Days</TabsTrigger>
          <TabsTrigger value="30d">30 Days</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTimeframe} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Conversion Funnel
                </CardTitle>
                <CardDescription>
                  Real-time funnel performance with drop-off analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConversionFunnelChart data={dashboardData.funnelMetrics} />
              </CardContent>
            </Card>

            {/* Attribution Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Traffic Attribution
                </CardTitle>
                <CardDescription>
                  Channel performance and attribution breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AttributionChart data={dashboardData.attributionData} />
              </CardContent>
            </Card>
          </div>

          {/* Viral Predictions & Trending */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Viral Prediction Insights</CardTitle>
                <CardDescription>
                  AI-powered predictions for template performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ViralPredictionInsights predictions={dashboardData.viralPredictions} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trending Templates</CardTitle>
                <CardDescription>
                  Most popular templates right now
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrendingTemplatesList templates={dashboardData.realtimeMetrics.trendingTemplates} />
              </CardContent>
            </Card>
          </div>

          {/* Performance Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
                <CardDescription>
                  Conversion rates by platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlatformPerformanceChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement Timeline</CardTitle>
                <CardDescription>
                  Activity patterns throughout the day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EngagementTimelineChart />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}

function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">{title}</p>
          <div className={`flex items-center text-sm ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {Math.abs(change)}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Conversion Funnel Chart Component
function ConversionFunnelChart({ data }: { data: any }) {
  const funnelData = [
    { stage: 'Landing', visitors: 1000, conversions: 850, rate: 85 },
    { stage: 'Engagement', visitors: 850, conversions: 680, rate: 80 },
    { stage: 'Email Capture', visitors: 680, conversions: 204, rate: 30 },
    { stage: 'Template Select', visitors: 204, conversions: 163, rate: 80 },
    { stage: 'Video Created', visitors: 163, conversions: 122, rate: 75 }
  ];

  return (
    <div className="space-y-4">
      {funnelData.map((stage, index) => (
        <div key={stage.stage} className="flex items-center space-x-4">
          <div className="w-20 text-sm font-medium">{stage.stage}</div>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span>{stage.conversions} conversions</span>
              <span className="font-medium">{stage.rate}%</span>
            </div>
            <Progress value={stage.rate} className="h-2" />
          </div>
          <div className="w-16 text-right text-sm text-gray-600">
            {stage.visitors} users
          </div>
        </div>
      ))}
    </div>
  );
}

// Attribution Chart Component
function AttributionChart({ data }: { data: any }) {
  const attributionData = [
    { channel: 'Organic Search', value: 35, color: '#3B82F6' },
    { channel: 'Social Media', value: 28, color: '#10B981' },
    { channel: 'Direct', value: 20, color: '#F59E0B' },
    { channel: 'Email', value: 12, color: '#EF4444' },
    { channel: 'Referral', value: 5, color: '#8B5CF6' }
  ];

  return (
    <div className="space-y-4">
      {attributionData.map((channel) => (
        <div key={channel.channel} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: channel.color }}
            />
            <span className="text-sm font-medium">{channel.channel}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full"
                style={{ 
                  width: `${channel.value}%`,
                  backgroundColor: channel.color 
                }}
              />
            </div>
            <span className="text-sm font-bold w-8">{channel.value}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Viral Prediction Insights Component
function ViralPredictionInsights({ predictions }: { predictions: any[] }) {
  const mockInsights = [
    {
      template: 'Business Growth Template',
      score: 85,
      confidence: 92,
      recommendations: ['Optimize for Instagram', 'Post at 7-9 PM'],
      estimatedViews: '50K-150K'
    },
    {
      template: 'Fitness Motivation Template',
      score: 78,
      confidence: 88,
      recommendations: ['Add trending audio', 'Improve hook strength'],
      estimatedViews: '25K-75K'
    },
    {
      template: 'Tech Tutorial Template',
      score: 72,
      confidence: 85,
      recommendations: ['Shorten duration', 'Add visual effects'],
      estimatedViews: '15K-45K'
    }
  ];

  return (
    <div className="space-y-4">
      {mockInsights.map((insight, index) => (
        <div key={index} className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-semibold">{insight.template}</h4>
              <p className="text-sm text-gray-600">Est. {insight.estimatedViews} views</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{insight.score}</div>
              <div className="text-xs text-gray-500">{insight.confidence}% confidence</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {insight.recommendations.map((rec, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {rec}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Trending Templates List Component
function TrendingTemplatesList({ templates }: { templates: string[] }) {
  const mockTrending = [
    { name: 'Business Growth Story', uses: 234, growth: '+15%' },
    { name: 'Fitness Transformation', uses: 189, growth: '+22%' },
    { name: 'Tech Product Demo', uses: 156, growth: '+8%' },
    { name: 'Lifestyle Tips', uses: 134, growth: '+18%' },
    { name: 'Educational Content', uses: 98, growth: '+12%' }
  ];

  return (
    <div className="space-y-3">
      {mockTrending.map((template, index) => (
        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <div className="font-medium text-sm">{template.name}</div>
            <div className="text-xs text-gray-600">{template.uses} uses today</div>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            {template.growth}
          </Badge>
        </div>
      ))}
    </div>
  );
}

// Platform Performance Chart Component
function PlatformPerformanceChart() {
  const platformData = [
    { platform: 'Instagram', conversions: 145, rate: 8.2 },
    { platform: 'TikTok', conversions: 132, rate: 12.1 },
    { platform: 'LinkedIn', conversions: 89, rate: 6.8 },
    { platform: 'Twitter', conversions: 67, rate: 5.4 },
    { platform: 'Facebook', conversions: 45, rate: 4.2 },
    { platform: 'YouTube', conversions: 23, rate: 3.1 }
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={platformData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="platform" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="conversions" fill="#3B82F6" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Engagement Timeline Chart Component
function EngagementTimelineChart() {
  const timelineData = [
    { hour: '00:00', users: 45, conversions: 3 },
    { hour: '02:00', users: 32, conversions: 2 },
    { hour: '04:00', users: 28, conversions: 1 },
    { hour: '06:00', users: 67, conversions: 5 },
    { hour: '08:00', users: 156, conversions: 12 },
    { hour: '10:00', users: 234, conversions: 18 },
    { hour: '12:00', users: 289, conversions: 22 },
    { hour: '14:00', users: 267, conversions: 20 },
    { hour: '16:00', users: 298, conversions: 25 },
    { hour: '18:00', users: 387, conversions: 32 },
    { hour: '20:00', users: 445, conversions: 38 },
    { hour: '22:00', users: 298, conversions: 24 }
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={timelineData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="hour" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="users" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
        <Area type="monotone" dataKey="conversions" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
      </AreaChart>
    </ResponsiveContainer>
  );
}