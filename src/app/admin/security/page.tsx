/**
 * Admin Security Dashboard
 * Comprehensive security monitoring and management interface
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  Users, 
  Key, 
  Eye, 
  Ban,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';

interface SecurityDashboard {
  overview: {
    securityScore: number;
    totalEvents: number;
    alertsTriggered: number;
    actionsAutomated: number;
    activeThreats: number;
    blockedIPs: number;
    lastUpdated: string;
  };
  severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  eventTypes: Array<{ type: string; count: number }>;
  topSources: Array<{ source: string; count: number }>;
  recentCriticalEvents: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    source: string;
    timestamp: string;
    severity: string;
  }>;
  activeThreats: Array<{
    id: string;
    type: string;
    severity: string;
    source: string;
    description: string;
    timestamp: string;
  }>;
  blockedIPs: Array<{
    ip_address: string;
    reason: string;
    blocked_at: string;
    blockedDuration: number;
    auto_blocked: boolean;
  }>;
  systemHealth: {
    score: number;
    status: string;
    eventsLastHour: number;
    uptime: number;
  };
  recommendations: Array<{
    priority: string;
    title: string;
    description: string;
    action: string;
  }>;
}

export default function SecurityDashboard() {
  const [dashboard, setDashboard] = useState<SecurityDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/security/dashboard?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch security dashboard');
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
      const interval = setInterval(fetchDashboard, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  // Helper functions
  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading security dashboard...</span>
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
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-gray-600">
            Last updated: {new Date(dashboard.overview.lastUpdated).toLocaleString()}
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

      {/* Security Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSecurityScoreColor(dashboard.overview.securityScore)}`}>
              {dashboard.overview.securityScore}/100
            </div>
            <Progress 
              value={dashboard.overview.securityScore} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboard.overview.activeThreats}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.overview.alertsTriggered} alerts triggered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.overview.blockedIPs}
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-blocked threats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboard.systemHealth.score}%
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.systemHealth.eventsLastHour} events/hour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {dashboard.recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Security Recommendations</h2>
          {dashboard.recommendations.map((rec, index) => (
            <Alert key={index} variant={rec.priority === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{rec.title}</AlertTitle>
              <AlertDescription>
                {rec.description}
                <br />
                <strong>Action:</strong> {rec.action}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threats">Active Threats</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Severity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Events by Severity</CardTitle>
                <CardDescription>Security events breakdown by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(dashboard.severity).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${getSeverityColor(severity)}`} />
                        <span className="capitalize">{severity}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Event Types */}
            <Card>
              <CardHeader>
                <CardTitle>Top Security Events</CardTitle>
                <CardDescription>Most frequent security event types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.eventTypes.slice(0, 5).map((event, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{event.type.replace('_', ' ')}</span>
                      <Badge variant="outline">{event.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Active Threats Tab */}
        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Security Threats</CardTitle>
              <CardDescription>Unresolved security threats requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.activeThreats.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No active threats detected</p>
              ) : (
                <div className="space-y-4">
                  {dashboard.activeThreats.map((threat) => (
                    <div key={threat.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Badge className={getSeverityColor(threat.severity)}>
                            {threat.severity}
                          </Badge>
                          <span className="ml-2 font-medium">{threat.type}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(threat.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{threat.description}</p>
                      <p className="text-xs text-gray-500">Source: {threat.source}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Critical Events</CardTitle>
              <CardDescription>Latest critical security events</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.recentCriticalEvents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No recent critical events</p>
              ) : (
                <div className="space-y-4">
                  {dashboard.recentCriticalEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{event.title}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{event.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <span className="text-xs text-gray-500">Source: {event.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked IPs Tab */}
        <TabsContent value="blocked" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blocked IP Addresses</CardTitle>
              <CardDescription>Currently blocked IP addresses and reasons</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.blockedIPs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No blocked IPs</p>
              ) : (
                <div className="space-y-4">
                  {dashboard.blockedIPs.map((blockedIP, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-medium">{blockedIP.ip_address}</span>
                        <div className="flex items-center gap-2">
                          {blockedIP.auto_blocked && (
                            <Badge variant="secondary">Auto-blocked</Badge>
                          )}
                          <span className="text-sm text-gray-500">
                            {formatDuration(blockedIP.blockedDuration)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{blockedIP.reason}</p>
                      <p className="text-xs text-gray-500">
                        Blocked: {new Date(blockedIP.blocked_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}