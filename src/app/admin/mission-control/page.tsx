'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, XCircle, Zap, Activity, Database, Users, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from '@/lib/services/websocketService';

interface ModuleStatus {
  module_name: string;
  status: 'running' | 'idle' | 'error' | 'maintenance';
  health_status: 'healthy' | 'warning' | 'unhealthy' | 'idle';
  throughput_per_hour: number;
  last_run: string | null;
  last_success: string | null;
  error_count: number;
  performance_metrics: {
    avg_response_time?: number;
    success_rate?: number;
    queue_length?: number;
  };
}

interface PipelineFlow {
  id: string;
  flow_id: string;
  source_module: string;
  target_module: string;
  data_type: string;
  records_processed: number;
  processing_time_ms: number;
  status: 'processing' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
}

interface TemplateStatus {
  status: string;
  template_count: number;
  avg_temperature: number;
  avg_velocity: number;
  total_viral_24h: number;
}

export default function MissionControlPage() {
  const [moduleStatuses, setModuleStatuses] = useState<ModuleStatus[]>([]);
  const [pipelineFlows, setPipelineFlows] = useState<PipelineFlow[]>([]);
  const [templateStatuses, setTemplateStatuses] = useState<TemplateStatus[]>([]);
  const [systemMetrics, setSystemMetrics] = useState({
    totalUsers: 0,
    activeToday: 0,
    analysesToday: 0,
    predictionsToday: 0
  });
  const [loading, setLoading] = useState(true);

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage } = useWebSocket('system_update');

  useEffect(() => {
    fetchMissionControlData();
    const interval = setInterval(fetchMissionControlData, 30000); // Fallback refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle real-time WebSocket updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'system_update') {
      const data = lastMessage.data;
      if (data.moduleStatus) setModuleStatuses(data.moduleStatus);
      if (data.userActivity) {
        // Update system metrics based on user activity
        const activity = data.userActivity;
        const activeUsers = new Set(activity.map((a: any) => a.user_id)).size;
        const analyses = activity.filter((a: any) => a.action_type === 'video_analyzed').length;
        const predictions = activity.filter((a: any) => a.action_type === 'prediction_made').length;
        
        setSystemMetrics(prev => ({
          ...prev,
          activeToday: activeUsers,
          analysesToday: analyses,
          predictionsToday: predictions
        }));
      }
    }
  }, [lastMessage]);

  const fetchMissionControlData = async () => {
    try {
      // Fetch module statuses
      const moduleRes = await fetch('/api/admin/mission-control/modules');
      const moduleData = await moduleRes.json();
      
      // Fetch pipeline flows
      const pipelineRes = await fetch('/api/admin/mission-control/pipeline');
      const pipelineData = await pipelineRes.json();
      
      // Fetch template statuses
      const templateRes = await fetch('/api/admin/mission-control/templates');
      const templateData = await templateRes.json();
      
      // Fetch system metrics
      const metricsRes = await fetch('/api/admin/mission-control/metrics');
      const metricsData = await metricsRes.json();

      if (moduleData.success) setModuleStatuses(moduleData.modules);
      if (pipelineData.success) setPipelineFlows(pipelineData.flows);
      if (templateData.success) setTemplateStatuses(templateData.templates);
      if (metricsData.success) setSystemMetrics(metricsData.metrics);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch mission control data:', error);
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string, healthStatus: string) => {
    if (status === 'error' || healthStatus === 'unhealthy') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (status === 'running' && healthStatus === 'healthy') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (healthStatus === 'warning') {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return <Clock className="h-5 w-5 text-gray-500" />;
  };

  const getStatusBadge = (status: string, healthStatus: string) => {
    const variant = 
      status === 'error' || healthStatus === 'unhealthy' ? 'destructive' :
      status === 'running' && healthStatus === 'healthy' ? 'default' :
      healthStatus === 'warning' ? 'secondary' : 'outline';
    
    return (
      <Badge variant={variant} className="capitalize">
        {status === 'running' ? healthStatus : status}
      </Badge>
    );
  };

  const restartModule = async (moduleName: string) => {
    try {
      const response = await fetch('/api/admin/mission-control/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_name: moduleName })
      });
      
      if (response.ok) {
        fetchMissionControlData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to restart module:', error);
    }
  };

  const systemHealth = moduleStatuses.length > 0 ? {
    healthy: moduleStatuses.filter(m => m.health_status === 'healthy').length,
    warning: moduleStatuses.filter(m => m.health_status === 'warning').length,
    unhealthy: moduleStatuses.filter(m => m.health_status === 'unhealthy').length,
    idle: moduleStatuses.filter(m => m.health_status === 'idle').length
  } : { healthy: 0, warning: 0, unhealthy: 0, idle: 0 };

  const overallHealthScore = moduleStatuses.length > 0 
    ? ((systemHealth.healthy * 100 + systemHealth.warning * 60) / moduleStatuses.length)
    : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🎛️ Mission Control</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of all 11 viral prediction modules
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-xs ml-1">Live</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <WifiOff className="h-4 w-4" />
                <span className="text-xs ml-1">Offline</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{overallHealthScore.toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground">System Health</div>
          </div>
          <Button onClick={fetchMissionControlData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <a href="/admin/operations/system-health" className="ml-2 text-sm text-blue-600 hover:underline">Open System Health</a>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallHealthScore.toFixed(0)}%</div>
            <Progress value={overallHealthScore} className="mt-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span className="text-green-600">{systemHealth.healthy} healthy</span>
              <span className="text-red-600">{systemHealth.unhealthy} issues</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.activeToday}</div>
            <p className="text-xs text-muted-foreground">
              {systemMetrics.totalUsers} total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyses Today</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.analysesToday}</div>
            <p className="text-xs text-muted-foreground">
              {systemMetrics.predictionsToday} predictions made
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Flow</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipelineFlows.filter(f => f.status === 'processing').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active data flows
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules">Module Status</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline Flow</TabsTrigger>
          <TabsTrigger value="templates">Template Intelligence</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Module Status Tab */}
        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {moduleStatuses.map((module) => (
              <Card key={module.module_name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{module.module_name}</CardTitle>
                    {getStatusIcon(module.status, module.health_status)}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(module.status, module.health_status)}
                    <Badge variant="outline">{module.throughput_per_hour}/hr</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Last Run:</span>
                      <span className="text-muted-foreground">
                        {module.last_run 
                          ? new Date(module.last_run).toLocaleTimeString()
                          : 'Never'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Success Rate:</span>
                      <span className="text-muted-foreground">
                        {module.performance_metrics?.success_rate 
                          ? `${(module.performance_metrics.success_rate * 100).toFixed(1)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Errors:</span>
                      <span className={module.error_count > 0 ? 'text-red-600' : 'text-green-600'}>
                        {module.error_count}
                      </span>
                    </div>
                    {module.health_status === 'unhealthy' && (
                      <Button
                        size="sm"
                        onClick={() => restartModule(module.module_name)}
                        className="w-full mt-2"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Restart Module
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Pipeline Flow Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Data Flows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineFlows.slice(0, 10).map((flow) => (
                  <div key={flow.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={flow.status === 'completed' ? 'default' : flow.status === 'failed' ? 'destructive' : 'secondary'}>
                        {flow.status}
                      </Badge>
                      <div>
                        <div className="font-medium">{flow.source_module} → {flow.target_module}</div>
                        <div className="text-sm text-muted-foreground">{flow.data_type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{flow.records_processed.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{flow.processing_time_ms}ms</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template Intelligence Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {templateStatuses.map((template) => (
              <Card key={template.status}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    {template.status === 'HOT' && '🔥'}
                    {template.status === 'NEW' && '✨'}
                    {template.status === 'COOLING' && '❄️'}
                    {template.status === 'STABLE' && '🎯'}
                    <span className="ml-2">{template.status}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Templates:</span>
                      <span className="font-medium">{template.template_count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Temperature:</span>
                      <span className="font-medium">{template.avg_temperature?.toFixed(1)}°</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Viral 24h:</span>
                      <span className="font-medium">{template.total_viral_24h}</span>
                    </div>
                    <Progress 
                      value={template.avg_temperature || 0} 
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Module Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {moduleStatuses.map((module) => (
                    <div key={module.module_name} className="flex items-center justify-between">
                      <span className="text-sm">{module.module_name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          {module.performance_metrics?.avg_response_time || 0}ms
                        </span>
                        <Progress 
                          value={Math.min((module.performance_metrics?.avg_response_time || 0) / 10, 100)} 
                          className="w-20"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CPU Usage</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">45%</span>
                      <Progress value={45} className="w-20" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">67%</span>
                      <Progress value={67} className="w-20" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Load</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">23%</span>
                      <Progress value={23} className="w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}