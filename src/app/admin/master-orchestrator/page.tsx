'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Square, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Zap,
  Activity,
  TrendingUp,
  Brain,
  Search,
  Database,
  Target
} from 'lucide-react';

interface ViralObjective {
  id: string;
  name: string;
  description: string;
  category: 'discovery' | 'analysis' | 'replication' | 'prediction' | 'learning';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'running' | 'completed' | 'failed';
  uiPath?: string;
}

interface SubAgent {
  id: string;
  name: string;
  type: 'service' | 'api' | 'ui' | 'hybrid';
  status: 'idle' | 'busy' | 'error' | 'offline';
  performance: {
    successRate: number;
    avgResponseTime: number;
    totalExecutions: number;
  };
}

interface WorkflowStatus {
  isRunning: boolean;
  objectives: ViralObjective[];
  subAgents: SubAgent[];
  results: Record<string, any>;
}

interface SystemHealth {
  overallHealth: number;
  healthyAgents: number;
  totalAgents: number;
  avgSuccessRate: number;
  avgResponseTime: number;
}

export default function MasterOrchestratorPage() {
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecution, setLastExecution] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const [statusRes, healthRes] = await Promise.all([
        fetch('/api/admin/master-orchestrator?action=status'),
        fetch('/api/admin/master-orchestrator?action=health')
      ]);

      const statusData = await statusRes.json();
      const healthData = await healthRes.json();

      if (statusData.success) setWorkflowStatus(statusData.data);
      if (healthData.success) setSystemHealth(healthData.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch orchestrator status:', error);
      setLoading(false);
    }
  };

  const executeWorkflow = async (type: 'complete' | 'daily' | 'test') => {
    setIsExecuting(true);
    try {
      const actionMap = {
        complete: 'execute-complete-workflow',
        daily: 'execute-daily-workflow',
        test: 'test-coordination'
      };

      const response = await fetch('/api/admin/master-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionMap[type] })
      });

      const result = await response.json();
      setLastExecution(result);
      
      if (result.success) {
        await fetchStatus(); // Refresh status after execution
      }
    } catch (error) {
      console.error('Workflow execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const resetOrchestrator = async () => {
    try {
      const response = await fetch('/api/admin/master-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });

      if (response.ok) {
        await fetchStatus();
        setLastExecution(null);
      }
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      running: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      discovery: <Search className="h-4 w-4" />,
      analysis: <Brain className="h-4 w-4" />,
      replication: <Database className="h-4 w-4" />,
      prediction: <Target className="h-4 w-4" />,
      learning: <TrendingUp className="h-4 w-4" />
    };
    return icons[category as keyof typeof icons] || <Activity className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent tracking-tight">🎭 Master Agent Orchestrator</h1>
          <p className="text-zinc-400">
            Coordinate all 15 viral prediction subagents across 5 core system capabilities
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => executeWorkflow('test')} 
            disabled={isExecuting}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
          >
            <Zap className="h-4 w-4 mr-2" />
            Test Coordination
          </Button>
          <Button 
            onClick={() => executeWorkflow('daily')} 
            disabled={isExecuting}
            variant="default"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border border-white/10 shadow-lg shadow-purple-500/20"
          >
            <Play className="h-4 w-4 mr-2" />
            Execute Daily Workflow
          </Button>
          <Button 
            onClick={() => executeWorkflow('complete')} 
            disabled={isExecuting}
            variant="default"
            className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white border border-white/10 shadow-lg shadow-pink-500/20"
          >
            <Play className="h-4 w-4 mr-2" />
            Execute Complete Workflow
          </Button>
          <Button onClick={resetOrchestrator} variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* System Overview */}
      {systemHealth && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-white/5 backdrop-blur border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">System Health</CardTitle>
              <Activity className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{systemHealth.overallHealth.toFixed(0)}%</div>
              <Progress value={systemHealth.overallHealth} className="mt-2" />
              <div className="flex justify-between text-xs text-white mt-2">
                <span className="text-white">{systemHealth.healthyAgents} healthy</span>
                <span className="text-white">{systemHealth.totalAgents} total</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{(systemHealth.avgSuccessRate * 100).toFixed(1)}%</div>
              <p className="text-xs text-white">
                Average across all agents
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{systemHealth.avgResponseTime.toFixed(0)}ms</div>
              <p className="text-xs text-white">
                Average response time
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Status</CardTitle>
              <Activity className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {workflowStatus?.isRunning ? 'RUNNING' : 'IDLE'}
              </div>
              <p className="text-xs text-white">
                {isExecuting ? 'Executing workflow...' : 'Ready for execution'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dashboard */}
      <Tabs defaultValue="objectives" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10">
          <TabsTrigger value="objectives" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-zinc-300">Viral Objectives</TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-zinc-300">SubAgents</TabsTrigger>
          <TabsTrigger value="workflow" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-zinc-300">Workflow Results</TabsTrigger>
          <TabsTrigger value="coordination" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-zinc-300">Coordination Map</TabsTrigger>
        </TabsList>

        {/* Objectives Tab */}
        <TabsContent value="objectives" className="space-y-4">
          {workflowStatus && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-zinc-200">
              {workflowStatus.objectives.map((objective) => (
                <Card key={objective.id} className="bg-white/5 backdrop-blur border-white/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(objective.category)}
                        <CardTitle className="text-sm text-white">{objective.name}</CardTitle>
                      </div>
                      {getStatusIcon(objective.status)}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(objective.status)}
                       <Badge variant="outline" className="capitalize border-white/20 text-white">
                        {objective.category}
                      </Badge>
                      <Badge variant={objective.priority === 'high' ? 'destructive' : objective.priority === 'medium' ? 'default' : 'secondary'} className="text-white">
                        {objective.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                     <p className="text-sm text-white mb-3 leading-relaxed">
                      {objective.description}
                    </p>
                    {objective.uiPath && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => window.open(objective.uiPath, '_blank')}
                         className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
                      >
                        View Dashboard
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SubAgents Tab */}
        <TabsContent value="agents" className="space-y-4">
          {workflowStatus && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-zinc-200">
              {workflowStatus.subAgents.map((agent) => (
                <Card key={agent.id} className="bg-white/5 backdrop-blur border-white/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-white">{agent.name}</CardTitle>
                      <Badge variant={agent.status === 'idle' ? 'default' : agent.status === 'busy' ? 'secondary' : 'destructive'}>
                        {agent.status}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="w-fit capitalize border-white/20 text-white">
                      {agent.type}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-white">
                        <span className="text-white">Success Rate:</span>
                        <span className="font-medium text-white">
                          {(agent.performance.successRate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-white">
                        <span className="text-white">Avg Response:</span>
                        <span className="font-medium text-white">
                          {agent.performance.avgResponseTime.toFixed(0)}ms
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-white">
                        <span className="text-white">Executions:</span>
                        <span className="font-medium text-white">
                          {agent.performance.totalExecutions}
                        </span>
                      </div>
                      <Progress 
                        value={agent.performance.successRate * 100} 
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Workflow Results Tab */}
        <TabsContent value="workflow" className="space-y-4">
          {lastExecution ? (
            <Card className="bg-white/5 backdrop-blur border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <span className="text-white">Last Execution Results</span>
                  {lastExecution.success ? 
                    <CheckCircle className="h-5 w-5 text-green-500" /> : 
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-white">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {lastExecution.data?.completedObjectives?.length || 0}
                    </div>
                     <div className="text-sm text-white">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">
                      {lastExecution.data?.failedObjectives?.length || 0}
                    </div>
                     <div className="text-sm text-white">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {lastExecution.data?.totalExecutionTime 
                        ? `${(lastExecution.data.totalExecutionTime / 1000).toFixed(1)}s`
                        : 'N/A'
                      }
                    </div>
                     <div className="text-sm text-white">Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {lastExecution.success ? '✅' : '❌'}
                    </div>
                     <div className="text-sm text-white">Status</div>
                  </div>
                </div>
                
                {lastExecution.data?.errors && lastExecution.data.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2 text-white">Errors:</h4>
                    <div className="space-y-1">
                       {lastExecution.data.errors.map((error: string, index: number) => (
                         <div key={index} className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/5 backdrop-blur border-white/10">
              <CardHeader>
                <CardTitle className="text-white">No Workflow Results</CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-white">
                  Execute a workflow to see results here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Coordination Map Tab */}
        <TabsContent value="coordination" className="space-y-4">
          <Card className="bg-white/5 backdrop-blur border-white/10">
            <CardHeader>
              <CardTitle className="text-white">5 Core System Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {['Discovery', 'Analysis', 'Replication', 'Prediction', 'Learning'].map((capability, index) => {
                  const objectivesInCategory = workflowStatus?.objectives.filter(
                    obj => obj.category === capability.toLowerCase()
                  ) || [];
                  
                  const completed = objectivesInCategory.filter(obj => obj.status === 'completed').length;
                  const total = objectivesInCategory.length;
                  const progress = total > 0 ? (completed / total) * 100 : 0;

                  return (
                    <div key={capability} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium flex items-center space-x-2 text-white">
                          {getCategoryIcon(capability.toLowerCase())}
                          <span className="text-white">{capability}</span>
                        </h3>
                     <Badge variant="outline" className="border-white/20 text-white">
                          {completed}/{total} Complete
                        </Badge>
                      </div>
                      <Progress value={progress} className="mb-2" />
                      <div className="flex flex-wrap gap-2">
                        {objectivesInCategory.map(obj => (
                          <Badge 
                            key={obj.id} 
                            variant={obj.status === 'completed' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {obj.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}