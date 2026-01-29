'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Play, Square, Settings, TrendingUp, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ModuleStatus {
  id: string;
  title: string;
  description: string;
  status: 'running' | 'idle' | 'error' | 'success' | 'processing';
  icon: string;
  category: 'macro' | 'micro' | 'feedback';
  lastRun?: string;
  duration?: number;
  itemsProcessed?: number;
  successRate?: number;
  errorMessage?: string;
  dependencies?: string[];
  nextRun?: string;
}

interface WorkflowStats {
  macroTrack: {
    totalRuns: number;
    successRate: number;
    avgDuration: number;
    templatesGenerated: number;
  };
  microTrack: {
    totalAnalyzed: number;
    avgScore: number;
    avgResponseTime: number;
  };
  overall: {
    videosProcessed: number;
    errorRate: number;
    uptime: number;
  };
}

const INITIAL_MODULES: ModuleStatus[] = [
  // Macro Track (Template Factory - 24h loop)
  {
    id: 'apify-scraper',
    title: 'ApifyScraper',
    description: 'Pulls ~2,000 TikToks per hour from trending content',
    status: 'running',
    icon: '🕷️',
    category: 'macro',
    lastRun: '2 minutes ago',
    duration: 45000,
    itemsProcessed: 1247,
    successRate: 98.2,
    dependencies: []
  },
  {
    id: 'feature-decomposer',
    title: 'FeatureDecomposer',
    description: 'Extracts frames, audio, OCR text, and transcripts',
    status: 'processing',
    icon: '🔬',
    category: 'macro',
    lastRun: '1 minute ago',
    duration: 89000,
    itemsProcessed: 1198,
    successRate: 96.8,
    dependencies: ['apify-scraper']
  },
  {
    id: 'gene-tagger',
    title: 'GeneTagger',
    description: 'Maps each clip to 48-dimensional gene vector',
    status: 'success',
    icon: '🧬',
    category: 'macro',
    lastRun: '5 minutes ago',
    duration: 67000,
    itemsProcessed: 1089,
    successRate: 99.1,
    dependencies: ['feature-decomposer']
  },
  {
    id: 'viral-filter',
    title: 'ViralFilter (DPS)',
    description: 'Keeps top-5% viral pool + 5% balanced negatives',
    status: 'idle',
    icon: '🔥',
    category: 'macro',
    lastRun: '1 hour ago',
    duration: 23000,
    itemsProcessed: 54,
    successRate: 100,
    dependencies: ['gene-tagger']
  },
  {
    id: 'template-generator',
    title: 'TemplateGenerator',
    description: 'Clusters viral genes into master templates using HDBSCAN',
    status: 'idle',
    icon: '📝',
    category: 'macro',
    lastRun: '2 hours ago',
    duration: 156000,
    itemsProcessed: 12,
    successRate: 100,
    dependencies: ['viral-filter']
  },
  {
    id: 'evolution-engine',
    title: 'EvolutionEngine',
    description: 'Labels templates HOT/COOLING/NEW via 7-day trend analysis',
    status: 'success',
    icon: '🧪',
    category: 'macro',
    lastRun: '30 minutes ago',
    duration: 8900,
    itemsProcessed: 47,
    successRate: 100,
    dependencies: ['template-generator']
  },
  {
    id: 'recipe-book-api',
    title: 'RecipeBookAPI',
    description: 'REST endpoint serving template library to UI',
    status: 'running',
    icon: '📖',
    category: 'macro',
    lastRun: 'continuous',
    duration: 0,
    itemsProcessed: 0,
    successRate: 99.5,
    dependencies: ['evolution-engine']
  },
  
  // Micro Track (Single-Video Predictor - on demand)
  {
    id: 'dna-detective',
    title: 'DNA_Detective',
    description: 'Gene-centroid matching for single video analysis',
    status: 'idle',
    icon: '🔍',
    category: 'micro',
    lastRun: '10 minutes ago',
    duration: 2100,
    itemsProcessed: 5,
    successRate: 94.0,
    dependencies: ['feature-decomposer', 'gene-tagger']
  },
  {
    id: 'orchestrator',
    title: 'Orchestrator',
    description: 'Chooses and blends five prediction algorithms',
    status: 'idle',
    icon: '🎭',
    category: 'micro',
    lastRun: '10 minutes ago',
    duration: 4500,
    itemsProcessed: 5,
    successRate: 92.0,
    dependencies: ['dna-detective']
  },
  {
    id: 'advisor-service',
    title: 'AdvisorService',
    description: 'Matches draft to HOT template, generates fix list',
    status: 'idle',
    icon: '💡',
    category: 'micro',
    lastRun: '10 minutes ago',
    duration: 1800,
    itemsProcessed: 5,
    successRate: 96.0,
    dependencies: ['orchestrator']
  },
  
  // Feedback Loop (Self-Improvement)
  {
    id: 'feedback-ingest',
    title: 'FeedbackIngest',
    description: 'Pulls real post stats hourly for model improvement',
    status: 'idle',
    icon: '📥',
    category: 'feedback',
    lastRun: '1 hour ago',
    duration: 12000,
    itemsProcessed: 234,
    successRate: 98.9,
    dependencies: []
  }
];

const WORKFLOW_STATS: WorkflowStats = {
  macroTrack: {
    totalRuns: 168,
    successRate: 97.8,
    avgDuration: 2.3,
    templatesGenerated: 47
  },
  microTrack: {
    totalAnalyzed: 1429,
    avgScore: 0.847,
    avgResponseTime: 4.2
  },
  overall: {
    videosProcessed: 24891,
    errorRate: 2.1,
    uptime: 99.2
  }
};

export default function PipelineDashboard() {
  const [modules, setModules] = useState<ModuleStatus[]>(INITIAL_MODULES);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [batchOperation, setBatchOperation] = useState<string | null>(null);
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats>(WORKFLOW_STATS);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch real-time pipeline status
  const fetchPipelineStatus = async () => {
    try {
      const response = await fetch('/api/admin/pipeline-status');
      if (response.ok) {
        const data = await response.json();
        setModules(data.modules);
        setWorkflowStats({
          macroTrack: data.macroTrack,
          microTrack: data.microTrack,
          overall: data.overall
        });
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch pipeline status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh pipeline status every 30 seconds
  useEffect(() => {
    fetchPipelineStatus();
    const interval = setInterval(fetchPipelineStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'idle':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      running: 'default',
      processing: 'default',
      success: 'secondary',
      error: 'destructive',
      idle: 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  const handleModuleAction = async (moduleId: string, action: 'run' | 'stop' | 'configure') => {
    console.log(`${action} action for module: ${moduleId}`);
    
    if (action === 'configure') {
      setSelectedModule(moduleId);
      return;
    }
    
    try {
      // Update module status to processing immediately for UI feedback
      if (action === 'run') {
        setModules(prev => prev.map(mod => 
          mod.id === moduleId 
            ? { ...mod, status: 'processing' as const }
            : mod
        ));
      }
      
      // Call the real API
      const response = await fetch('/api/admin/pipeline-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          moduleId,
          action
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ ${action} successful for ${moduleId}: ${result.message}`);
        // Refresh pipeline status to get latest data
        setTimeout(fetchPipelineStatus, 2000);
      } else {
        console.error(`❌ ${action} failed for ${moduleId}: ${result.message}`);
        // Reset status on failure
        if (action === 'run') {
          setModules(prev => prev.map(mod => 
            mod.id === moduleId 
              ? { ...mod, status: 'error' as const, errorMessage: result.message }
              : mod
          ));
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} module ${moduleId}:`, error);
      // Reset status on error
      if (action === 'run') {
        setModules(prev => prev.map(mod => 
          mod.id === moduleId 
            ? { ...mod, status: 'error' as const, errorMessage: 'API call failed' }
            : mod
        ));
      }
    }
  };

  const handleBatchOperation = async (track: 'macro' | 'micro') => {
    setBatchOperation(track);
    console.log(`Running ${track} track batch operation`);
    
    try {
      const response = await fetch('/api/admin/pipeline-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          track,
          action: 'run'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Batch ${track} track successful:`, result.summary);
        // Refresh pipeline status after batch operation
        setTimeout(fetchPipelineStatus, 3000);
      } else {
        console.error(`❌ Batch ${track} track failed:`, result.message);
      }
    } catch (error) {
      console.error(`Failed to run batch ${track} track operation:`, error);
    } finally {
      setBatchOperation(null);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const macroModules = modules.filter(m => m.category === 'macro');
  const microModules = modules.filter(m => m.category === 'micro');
  const feedbackModules = modules.filter(m => m.category === 'feedback');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔄 Pipeline Dashboard</h1>
              <p className="text-gray-600 mt-1">Mission control for TikTok viral prediction system</p>
              <a href="/admin/system-health" className="text-sm text-blue-600 hover:underline">Open System Health</a>
            </div>
            <div className="flex gap-4">
              <Button 
                onClick={() => handleBatchOperation('macro')}
                disabled={batchOperation === 'macro'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {batchOperation === 'macro' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Running Macro Track...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Macro Track
                  </>
                )}
              </Button>
              <Button 
                onClick={() => handleBatchOperation('micro')}
                disabled={batchOperation === 'micro'}
                variant="outline"
              >
                {batchOperation === 'micro' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Running Micro Track...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Micro Track
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : workflowStats.overall.videosProcessed.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Videos Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : workflowStats.macroTrack.templatesGenerated}
              </div>
              <div className="text-sm text-gray-500">Templates Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : `${workflowStats.overall.uptime}%`}
              </div>
              <div className="text-sm text-gray-500">System Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : `${workflowStats.microTrack.avgResponseTime}s`}
              </div>
              <div className="text-sm text-gray-500">Avg Response Time</div>
            </div>
          </div>
          
          {/* Last Updated */}
          <div className="text-center mt-4">
            <div className="text-xs text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refresh every 30s
            </div>
          </div>
        </div>

        {/* Macro Track - Template Factory */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">📊 Macro Track - Template Factory</h2>
            <Badge variant="secondary">24h Batch Loop</Badge>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              {workflowStats.macroTrack.successRate}% Success Rate
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {macroModules.map((module, index) => (
              <ModuleCard 
                key={module.id}
                module={module}
                onAction={handleModuleAction}
                showArrow={index < macroModules.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Micro Track - Single Video Predictor */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🎯 Micro Track - Single Video Predictor</h2>
            <Badge variant="secondary">On Demand</Badge>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              {workflowStats.microTrack.avgResponseTime}s Avg Response
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {microModules.map((module, index) => (
              <ModuleCard 
                key={module.id}
                module={module}
                onAction={handleModuleAction}
                showArrow={index < microModules.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Feedback Loop - Self Improvement */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🔄 Feedback Loop - Self Improvement</h2>
            <Badge variant="secondary">Continuous Learning</Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {feedbackModules.map((module) => (
              <ModuleCard 
                key={module.id}
                module={module}
                onAction={handleModuleAction}
                showArrow={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ModuleCardProps {
  module: ModuleStatus;
  onAction: (moduleId: string, action: 'run' | 'stop' | 'configure') => void;
  showArrow: boolean;
}

function ModuleCard({ module, onAction, showArrow }: ModuleCardProps) {
  return (
    <div className="relative">
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{module.icon}</span>
              <CardTitle className="text-base">{module.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {React.createElement(
                () => {
                  switch (module.status) {
                    case 'running':
                    case 'processing':
                      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
                    case 'success':
                      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
                    case 'error':
                      return <XCircle className="h-4 w-4 text-red-500" />;
                    case 'idle':
                      return <Clock className="h-4 w-4 text-gray-500" />;
                    default:
                      return <Clock className="h-4 w-4 text-gray-500" />;
                  }
                }
              )}
              <Badge 
                variant={
                  module.status === 'error' ? 'destructive' :
                  module.status === 'success' ? 'secondary' :
                  module.status === 'running' || module.status === 'processing' ? 'default' :
                  'outline'
                }
                className="capitalize"
              >
                {module.status}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-600">{module.description}</p>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-gray-500">Last Run</div>
                <div className="font-medium">{module.lastRun || 'Never'}</div>
              </div>
              <div>
                <div className="text-gray-500">Duration</div>
                <div className="font-medium">
                  {module.duration ? formatDuration(module.duration) : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Processed</div>
                <div className="font-medium">{module.itemsProcessed?.toLocaleString() || '0'}</div>
              </div>
              <div>
                <div className="text-gray-500">Success Rate</div>
                <div className="font-medium">{module.successRate?.toFixed(1) || '0'}%</div>
              </div>
            </div>

            {/* Error Message */}
            {module.errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <div className="flex items-center gap-1 text-red-700 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  {module.errorMessage}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => onAction(module.id, 'run')}
                disabled={module.status === 'processing' || module.status === 'running'}
                className="flex-1"
              >
                <Play className="h-3 w-3 mr-1" />
                Run
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onAction(module.id, 'configure')}
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Flow Arrow */}
      {showArrow && (
        <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 hidden xl:block">
          <div className="text-gray-400 text-2xl">→</div>
        </div>
      )}
    </div>
  );
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}