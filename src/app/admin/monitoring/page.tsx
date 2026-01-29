/**
 * Comprehensive Monitoring Dashboard
 * Real-time performance, business metrics, and system health monitoring
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Database,
  Globe,
  Heart,
  LineChart,
  Monitor,
  RefreshCw,
  Server,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';

interface MonitoringDashboard {
  overview: {
    healthScore: number;
    status: string;
    lastUpdated: string;
    timeRange: string;
    activeCriticalAlerts: number;
    totalUsers: number;
    systemUptime: number;
  };
  performance: {
    api: {
      responseTime: number;
      throughput: number;
      errorRate: number;
      p95ResponseTime: number;
      totalRequests: number;
      availability: number;
    };
    system: {
      cpu: { usage: number; cores: number };
      memory: { used: number; total: number; percentage: number };
      disk: { used: number; total: number; percentage: number };
      network: { bytesIn: number; bytesOut: number };
    };
    database: {
      connections: number;
      queryTime: number;
      lockWaitTime: number;
      cacheHitRate: number;
    };
  };
  business: {
    kpis: Array<{
      id: string;
      name: string;
      value: number;
      target?: number;
      unit: string;
      trend: string;
      percentageChange: number;
    }>;
    userEngagement: {
      activeUsers: { daily: number; weekly: number; monthly: number };
      engagement: { videosAnalyzed: number; predictionsGenerated: number; templatesUsed: number };
      retention: { day1: number; day7: number; day30: number };
    };
    viralPredictions: {
      accuracy: number;
      totalPredictions: number;
      predictionsPerDay: number;
      popularNiches: Array<{ niche: string; count: number }>;
    };
    revenue: {
      mrr: number;
      totalRevenue: number;
      churnRate: number;
      conversionRate: number;
    };
  };
  realTime: {
    currentUsers: number;
    requestsPerMinute: number;
    errorCount: number;
    responseTime: number;
    queueLength: number;
  };
  alerts: {
    total: number;
    bySeverity: { critical: number; high: number; medium: number; low: number };
    recent: Array<{
      id: string;
      severity: string;
      message: string;
      startsAt: string;
    }>;
  };
  endpoints: Array<{
    endpoint: string;
    requests: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
}

export default function MonitoringDashboard() {
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('day');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/monitoring/dashboard?timeRange=${timeRange}&details=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch monitoring dashboard');
      }

      const data = await response.json();
      setDashboard(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchDashboard();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchDashboard, 30000); // 30 seconds
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [timeRange, autoRefresh]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Helper functions
  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatNumber = (num: number, unit?: string) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(unit === 'percentage' ? 1 : 0);
  };

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading monitoring dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
          <p className="text-gray-600">
            Real-time system performance and business metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-green-600' : 'text-gray-400'}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDashboard}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {dashboard.alerts.bySeverity.critical > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Alerts Active</AlertTitle>
          <AlertDescription>
            {dashboard.alerts.bySeverity.critical} critical alerts require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthScoreColor(dashboard.overview.healthScore)}`}>
              {dashboard.overview.healthScore}/100
            </div>
            <div className="flex items-center mt-2">
              <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(dashboard.overview.status)}`} />
              <span className="text-sm capitalize">{dashboard.overview.status}</span>
            </div>
            <Progress value={dashboard.overview.healthScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboard.realTime.currentUsers)}</div>
            <a href="/admin/system-health" className="text-xs text-blue-500 hover:underline">Open system-health</a>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests/Min</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboard.realTime.requestsPerMinute)}</div>
            <p className="text-xs text-muted-foreground">API requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.realTime.responseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(dashboard.overview.systemUptime)}</div>
            <p className="text-xs text-muted-foreground">System uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="business">Business Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* API Performance */}
            <Card>
              <CardHeader>
                <CardTitle>API Performance</CardTitle>
                <CardDescription>HTTP API metrics and health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Availability</span>
                  <Badge variant={dashboard.performance.api.availability > 99 ? 'default' : 'destructive'}>
                    {dashboard.performance.api.availability.toFixed(2)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Error Rate</span>
                  <Badge variant={dashboard.performance.api.errorRate < 1 ? 'default' : 'destructive'}>
                    {dashboard.performance.api.errorRate.toFixed(2)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Throughput</span>
                  <span className="text-sm font-medium">{dashboard.performance.api.throughput.toFixed(1)} req/s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">P95 Response Time</span>
                  <span className="text-sm font-medium">{dashboard.performance.api.p95ResponseTime.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Requests</span>
                  <span className="text-sm font-medium">{formatNumber(dashboard.performance.api.totalRequests)}</span>
                </div>
              </CardContent>
            </Card>

            {/* System Resources */}
            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
                <CardDescription>CPU, memory, and disk usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">CPU Usage</span>
                    <span className="text-sm font-medium">{dashboard.performance.system.cpu.usage.toFixed(1)}%</span>
                  </div>
                  <Progress value={dashboard.performance.system.cpu.usage} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Memory Usage</span>
                    <span className="text-sm font-medium">{dashboard.performance.system.memory.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={dashboard.performance.system.memory.percentage} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatBytes(dashboard.performance.system.memory.used)} / {formatBytes(dashboard.performance.system.memory.total)}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">CPU Cores</span>
                  <span className="text-sm font-medium">{dashboard.performance.system.cpu.cores}</span>
                </div>
              </CardContent>
            </Card>

            {/* Database Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Database Performance</CardTitle>
                <CardDescription>Query performance and connections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Connections</span>
                  <span className="text-sm font-medium">{dashboard.performance.database.connections}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg Query Time</span>
                  <span className="text-sm font-medium">{dashboard.performance.database.queryTime.toFixed(1)}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cache Hit Rate</span>
                  <Badge variant={dashboard.performance.database.cacheHitRate > 90 ? 'default' : 'secondary'}>
                    {dashboard.performance.database.cacheHitRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Lock Wait Time</span>
                  <span className="text-sm font-medium">{dashboard.performance.database.lockWaitTime.toFixed(1)}ms</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Business Metrics Tab */}
        <TabsContent value="business" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {dashboard.business.kpis.map((kpi) => (
              <Card key={kpi.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{kpi.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {formatNumber(kpi.value, kpi.unit)}
                          {kpi.unit === 'percentage' && '%'}
                          {kpi.unit === 'dollars' && '$'}
                        </span>
                        {getTrendIcon(kpi.trend)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {kpi.percentageChange > 0 ? '+' : ''}{kpi.percentageChange.toFixed(1)}% vs last period
                      </p>
                      {kpi.target && (
                        <Progress 
                          value={(kpi.value / kpi.target) * 100} 
                          className="mt-2 h-1"
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* User Engagement */}
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Active users and engagement metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Daily Active Users</span>
                  <span className="text-lg font-semibold">{formatNumber(dashboard.business.userEngagement.activeUsers.daily)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Weekly Active Users</span>
                  <span className="text-lg font-semibold">{formatNumber(dashboard.business.userEngagement.activeUsers.weekly)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Monthly Active Users</span>
                  <span className="text-lg font-semibold">{formatNumber(dashboard.business.userEngagement.activeUsers.monthly)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Videos Analyzed</span>
                    <span className="text-sm font-medium">{formatNumber(dashboard.business.userEngagement.engagement.videosAnalyzed)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Predictions Generated</span>
                    <span className="text-sm font-medium">{formatNumber(dashboard.business.userEngagement.engagement.predictionsGenerated)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Viral Predictions */}
            <Card>
              <CardHeader>
                <CardTitle>Viral Predictions</CardTitle>
                <CardDescription>Prediction accuracy and usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Accuracy</span>
                  <Badge variant={dashboard.business.viralPredictions.accuracy > 85 ? 'default' : 'secondary'}>
                    {dashboard.business.viralPredictions.accuracy.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Predictions</span>
                  <span className="text-lg font-semibold">{formatNumber(dashboard.business.viralPredictions.totalPredictions)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Per Day</span>
                  <span className="text-sm font-medium">{dashboard.business.viralPredictions.predictionsPerDay.toFixed(0)}</span>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Popular Niches</p>
                  {dashboard.business.viralPredictions.popularNiches.slice(0, 3).map((niche, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs">{niche.niche}</span>
                      <span className="text-xs font-medium">{niche.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
                <CardDescription>Financial performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Monthly Recurring Revenue</span>
                  <span className="text-lg font-semibold">${formatNumber(dashboard.business.revenue.mrr)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Revenue</span>
                  <span className="text-lg font-semibold">${formatNumber(dashboard.business.revenue.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Churn Rate</span>
                  <Badge variant={dashboard.business.revenue.churnRate < 5 ? 'default' : 'destructive'}>
                    {dashboard.business.revenue.churnRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Conversion Rate</span>
                  <span className="text-sm font-medium">{(dashboard.business.revenue.conversionRate * 100).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Retention */}
            <Card>
              <CardHeader>
                <CardTitle>User Retention</CardTitle>
                <CardDescription>User retention rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Day 1 Retention</span>
                    <span className="text-sm font-medium">{(dashboard.business.userEngagement.retention.day1 * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={dashboard.business.userEngagement.retention.day1 * 100} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Day 7 Retention</span>
                    <span className="text-sm font-medium">{(dashboard.business.userEngagement.retention.day7 * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={dashboard.business.userEngagement.retention.day7 * 100} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Day 30 Retention</span>
                    <span className="text-sm font-medium">{(dashboard.business.userEngagement.retention.day30 * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={dashboard.business.userEngagement.retention.day30 * 100} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{dashboard.alerts.bySeverity.critical}</div>
                  <p className="text-sm text-muted-foreground">Critical</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{dashboard.alerts.bySeverity.high}</div>
                  <p className="text-sm text-muted-foreground">High</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{dashboard.alerts.bySeverity.medium}</div>
                  <p className="text-sm text-muted-foreground">Medium</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{dashboard.alerts.bySeverity.low}</div>
                  <p className="text-sm text-muted-foreground">Low</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Latest system and business alerts</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.alerts.recent.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No recent alerts</p>
              ) : (
                <div className="space-y-4">
                  {dashboard.alerts.recent.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={
                          alert.severity === 'critical' ? 'bg-red-500' :
                          alert.severity === 'high' ? 'bg-orange-500' :
                          alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }>
                          {alert.severity}
                        </Badge>
                        <span className="font-medium">{alert.message}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(alert.startsAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Performance</CardTitle>
              <CardDescription>Performance metrics for each API endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboard.endpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">{endpoint.endpoint}</span>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Requests: {formatNumber(endpoint.requests)}</span>
                        <span>Avg Response: {endpoint.averageResponseTime.toFixed(0)}ms</span>
                        <Badge variant={endpoint.errorRate < 1 ? 'default' : 'destructive'}>
                          {endpoint.errorRate.toFixed(2)}% errors
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}