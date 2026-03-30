'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Brain,
  Database,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  BarChart3,
  FlaskConical,
  Server,
  RefreshCw,
  ChevronRight,
  Play,
  Pause,
  AlertCircle,
  Cpu,
  HardDrive,
  Wifi,
  Shield,
  Search,
  Layers,
  XCircle,
  Radar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface ModelPerformance {
  accuracy: number;
  accuracyTrend: number;
  calibration: number;
  coverage: number;
  mae: number;
  activeModel: string;
  lastTrained: string;
}

interface PlatformMetrics {
  videosAnalyzed: number;
  videosTrend: number;
  predictionsToday: number;
  avgResponseTime: number;
  errorRate: number;
  uptime: number;
}

interface TrainingPipeline {
  totalSamples: number;
  viral: number;
  aboveAverage: number;
  average: number;
  belowAverage: number;
  poor: number;
  lastTraining: string;
  nextScheduled: string;
  jobStatus: 'idle' | 'running' | 'queued';
  currentJobProgress?: number;
}

interface BusinessKPIs {
  mrr: number;
  mrrTrend: number;
  activeAgencies: number;
  activeCreators: number;
  campaignSpend: number;
  platformFees: number;
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  time: string;
  metric?: string;
}

interface Experiment {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'draft';
  progress: number;
  lift: string;
  samples: number;
}

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
}

// Fallback data - API should return real data from Kai Orchestrator tables
// DATA SOURCES: video_analysis, component_results, training_features
const mockData = {
  modelPerformance: {
    accuracy: 73.2,
    accuracyTrend: +2.3,
    calibration: 0.82,
    coverage: 98.5,
    mae: 8.4,
    activeModel: 'XGBoost Ensemble v2.3.1',
    lastTrained: '2 days ago',
  },
  platformMetrics: {
    videosAnalyzed: 4470,
    videosTrend: +156,
    predictionsToday: 127,
    avgResponseTime: 340,
    errorRate: 0.3,
    uptime: 99.97,
  },
  trainingPipeline: {
    totalSamples: 12847,
    viral: 2156,
    aboveAverage: 3421,
    average: 4813,
    belowAverage: 1543,
    poor: 914,
    lastTraining: '2 days ago',
    nextScheduled: 'Tomorrow 3:00 AM',
    jobStatus: 'idle' as const,
  },
  businessKPIs: {
    mrr: 12400,
    mrrTrend: +8.2,
    activeAgencies: 4,
    activeCreators: 147,
    campaignSpend: 23200,
    platformFees: 4800,
  },
  alerts: [
    { id: '1', severity: 'warning' as const, title: 'Model accuracy trending below threshold', time: '2h ago', metric: 'accuracy' },
    { id: '2', severity: 'info' as const, title: 'New training data batch ready (342 samples)', time: '5h ago' },
  ],
  experiments: [
    { id: '1', name: 'Hook Pattern Weighting v2', status: 'running' as const, progress: 42, lift: '+4.2%', samples: 1847 },
    { id: '2', name: 'Emotional Peak Detection', status: 'running' as const, progress: 78, lift: '+2.8%', samples: 3102 },
  ],
  services: [
    { name: 'Supabase', status: 'operational' as const, latency: 45 },
    { name: 'Python ML Service', status: 'operational' as const, latency: 180 },
    { name: 'OpenAI API', status: 'operational' as const, latency: 890 },
    { name: 'Auth Service', status: 'operational' as const, latency: 32 },
    { name: 'Redis Cache', status: 'operational' as const, latency: 2 },
  ],
};

// Components
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  status?: 'good' | 'warning' | 'critical' | 'neutral';
  href?: string;
}

function MetricCard({ title, value, subtitle, trend, icon, status = 'neutral', href }: MetricCardProps) {
  const content = (
    <div className={cn(
      'bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 hover:border-[#2a2a4e] transition-all',
      href && 'cursor-pointer hover:scale-[1.02]'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          status === 'good' && 'bg-green-500/20',
          status === 'warning' && 'bg-yellow-500/20',
          status === 'critical' && 'bg-red-500/20',
          status === 'neutral' && 'bg-purple-500/20'
        )}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium',
            trend >= 0 ? 'text-green-400' : 'text-red-400'
          )}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function StatusIndicator({ status, label, latency }: { status: 'operational' | 'degraded' | 'down'; label: string; latency?: number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <div className={cn(
          'w-2 h-2 rounded-full',
          status === 'operational' && 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]',
          status === 'degraded' && 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.5)]',
          status === 'down' && 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)] animate-pulse'
        )} />
        <span className="text-sm text-gray-300">{label}</span>
      </div>
      {latency !== undefined && (
        <span className="text-xs text-gray-500">{latency}ms</span>
      )}
    </div>
  );
}

function AlertBanner({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  
  const bgColor = criticalCount > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30';
  const textColor = criticalCount > 0 ? 'text-red-400' : 'text-yellow-400';
  
  return (
    <div className={cn('border rounded-xl p-4', bgColor)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className={textColor} size={20} />
          <span className={cn('font-medium', textColor)}>
            {criticalCount > 0 ? `${criticalCount} Critical` : ''} 
            {criticalCount > 0 && warningCount > 0 ? ' & ' : ''}
            {warningCount > 0 ? `${warningCount} Warning${warningCount > 1 ? 's' : ''}` : ''}
          </span>
          <span className="text-gray-400 text-sm">
            {alerts[0].title}
          </span>
        </div>
        <Link 
          href="/admin/operations/alerts"
          className={cn('text-sm hover:underline flex items-center gap-1', textColor)}
        >
          View All <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export default function OperationsCenterPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // System Health Audit State
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // System Verification State
  const [isRunningVerify, setIsRunningVerify] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const runVerificationSuite = async () => {
    setIsRunningVerify(true);
    setVerifyResult(null);
    setShowVerifyModal(true);
    
    try {
      const response = await fetch('/api/system-health/verify', { method: 'POST' });
      const result = await response.json();
      setVerifyResult(result.report);
    } catch (error) {
      console.error('Verification failed:', error);
      setVerifyResult({ error: 'Failed to run verification' });
    } finally {
      setIsRunningVerify(false);
    }
  };

  const runSystemAudit = async () => {
    setIsRunningAudit(true);
    setAuditResult(null);
    setShowAuditModal(true);
    
    try {
      const response = await fetch('/api/system-health/full-audit');
      const result = await response.json();
      setAuditResult(result);
    } catch (error) {
      console.error('Audit failed:', error);
      setAuditResult({ error: 'Failed to run audit' });
    } finally {
      setIsRunningAudit(false);
    }
  };

  // Fetch real data from API
  const fetchData = async () => {
    try {
      const response = await fetch('/api/operations/stats');
      const result = await response.json();
      
      if (result.success) {
        // Map API response to expected structure
        // Map API response to display format
        // DATA SOURCES: video_analysis, component_results, training_features
        const tp = result.data.trainingPipeline || {};
        const mp = result.data.modelPerformance || {};
        const pm = result.data.platformMetrics || {};
        const bk = result.data.businessKPIs || {};
        
        setApiData({
          modelPerformance: {
            accuracy: mp.accuracy || 0,
            accuracyTrend: 0,
            calibration: mp.calibration || 0,
            coverage: tp.featureCoveragePercent || 0,
            mae: mp.mae || 0,
            activeModel: `KaiOrchestrator (${mp.predictionsWithActuals || 0} verified)`,
            lastTrained: mp.lastUpdated 
              ? new Date(mp.lastUpdated).toLocaleDateString()
              : 'Unknown',
          },
          platformMetrics: {
            videosAnalyzed: bk.totalVideosAnalyzed || 0,
            videosTrend: 0,
            predictionsToday: pm.todayPredictions || 0,
            avgResponseTime: pm.avgLatencyMs || 0,
            errorRate: pm.errorRate || 0,
            uptime: pm.uptimePercent || 99.9,
          },
          trainingPipeline: {
            totalSamples: tp.totalSamples || 0,
            viral: 0,
            aboveAverage: 0,
            average: 0,
            belowAverage: 0,
            poor: 0,
            lastTraining: tp.latestExtractionVersion || 'Unknown',
            nextScheduled: 'Not scheduled',
            jobStatus: 'idle' as const,
            // New fields from Kai data
            avgFeaturesPerSample: tp.avgFeaturesPerSample || 0,
            targetFeatures: tp.targetFeatures || 180,
          },
          businessKPIs: {
            ...mockData.businessKPIs,
            // Override with real data
            totalVideosScraped: bk.totalVideosScraped || mockData.businessKPIs.activeCreators,
            analysisRate: bk.analysisRate || 0,
            componentSuccessRates: bk.componentSuccessRates || {},
            dataQualityScore: bk.dataQualityScore || 'unknown',
            systemHealthScore: bk.systemHealthScore || 0,
          },
          alerts: mockData.alerts,
          experiments: mockData.experiments,
          services: result.data.services?.map((s: any) => ({
            name: s.name,
            status: s.status === 'healthy' ? 'operational' : 'degraded',
            latency: s.latencyMs || s.componentsActive || 0
          })) || mockData.services,
        });
      }
    } catch (error) {
      console.error('Failed to fetch operations data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Use API data if available, otherwise fall back to mock data
  const data = apiData || mockData;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    setLastUpdated(new Date());
  };

  // Calculate overall system status
  const allOperational = data.services.every(s => s.status === 'operational');
  const hasDegraded = data.services.some(s => s.status === 'degraded');
  const hasDown = data.services.some(s => s.status === 'down');

  return (
    <div className="p-6 space-y-6 min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Operations Intelligence Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Platform health, model performance, and operational metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={runVerificationSuite}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] hover:bg-[#2a2a4e] border border-purple-500/30 text-purple-400 rounded-lg transition-colors font-medium text-sm"
          >
            <Shield size={16} />
            Verify System
          </button>
          <button 
            onClick={runSystemAudit}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-purple-900/20"
          >
            <Activity size={16} />
            Run System Audit
          </button>
          
          <span className="text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              'p-2 bg-[#111118] border border-[#1a1a2e] rounded-lg hover:border-purple-500/50 transition-colors',
              isRefreshing && 'opacity-50'
            )}
          >
            <RefreshCw size={18} className={cn('text-gray-400', isRefreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Active Alerts Banner */}
      <AlertBanner alerts={data.alerts} />

      {/* System Status Bar */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {data.services.slice(0, 5).map((service) => (
              <StatusIndicator 
                key={service.name}
                status={service.status}
                label={service.name}
                latency={service.latency}
              />
            ))}
          </div>
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
            allOperational && 'bg-green-500/10 text-green-400',
            hasDegraded && !hasDown && 'bg-yellow-500/10 text-yellow-400',
            hasDown && 'bg-red-500/10 text-red-400'
          )}>
            {allOperational && <><CheckCircle size={16} /> All Systems Operational</>}
            {hasDegraded && !hasDown && <><AlertCircle size={16} /> Degraded Performance</>}
            {hasDown && <><AlertTriangle size={16} /> Service Outage</>}
          </div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Prediction Accuracy"
          value={`${data.modelPerformance.accuracy}%`}
          subtitle={`MAE: ${data.modelPerformance.mae} DPS`}
          trend={data.modelPerformance.accuracyTrend}
          icon={<Target className="text-purple-400" size={20} />}
          status={data.modelPerformance.accuracy >= 70 ? 'good' : 'warning'}
          href="/admin/operations/model"
        />
        
        <MetricCard
          title="Calibration Score"
          value={data.modelPerformance.calibration.toFixed(2)}
          subtitle={`Feature coverage: ${data.modelPerformance.coverage}%`}
          icon={<Activity className="text-blue-400" size={20} />}
          status={data.modelPerformance.calibration >= 0.8 ? 'good' : 'warning'}
          href="/admin/operations/model"
        />

        <MetricCard
          title="Videos Analyzed"
          value={data.platformMetrics.videosAnalyzed.toLocaleString()}
          subtitle={`+${data.platformMetrics.videosTrend} this week`}
          trend={3.5}
          icon={<BarChart3 className="text-green-400" size={20} />}
          status="good"
        />

        <MetricCard
          title="Avg Response Time"
          value={`${data.platformMetrics.avgResponseTime}ms`}
          subtitle={`Error rate: ${data.platformMetrics.errorRate}%`}
          icon={<Zap className="text-yellow-400" size={20} />}
          status={data.platformMetrics.avgResponseTime < 500 ? 'good' : 'warning'}
          href="/admin/operations/health"
        />
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Training Pipeline */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Database className="text-purple-400" size={18} />
              Training Pipeline
            </h2>
            <Link 
              href="/admin/operations/training"
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Manage <ChevronRight size={12} />
            </Link>
          </div>
          
          <div className="space-y-4">
            <div className="text-3xl font-bold">
              {data.trainingPipeline.totalSamples.toLocaleString()}
              <span className="text-sm font-normal text-gray-400 ml-2">training samples</span>
            </div>
            
            {/* Distribution */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                  Viral (Top 5%)
                </span>
                <span className="text-gray-300">{data.trainingPipeline.viral.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  Above Average
                </span>
                <span className="text-gray-300">{data.trainingPipeline.aboveAverage.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full" />
                  Average
                </span>
                <span className="text-gray-300">{data.trainingPipeline.average.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-400 rounded-full" />
                  Below Average
                </span>
                <span className="text-gray-300">{data.trainingPipeline.belowAverage.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  Poor
                </span>
                <span className="text-gray-300">{data.trainingPipeline.poor.toLocaleString()}</span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="h-2.5 bg-[#1a1a2e] rounded-full overflow-hidden flex">
              <div className="bg-emerald-400 h-full" style={{ width: '17%' }} title="Viral" />
              <div className="bg-green-400 h-full" style={{ width: '26%' }} title="Above Average" />
              <div className="bg-blue-400 h-full" style={{ width: '37%' }} title="Average" />
              <div className="bg-orange-400 h-full" style={{ width: '12%' }} title="Below Average" />
              <div className="bg-red-400 h-full" style={{ width: '8%' }} title="Poor" />
            </div>
            
            <div className="pt-3 border-t border-[#1a1a2e] space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Last training:</span>
                <span className="text-gray-300">{data.trainingPipeline.lastTraining}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Next scheduled:</span>
                <span className="text-gray-300">{data.trainingPipeline.nextScheduled}</span>
              </div>
            </div>
            
            <button className="w-full py-2.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2 font-medium">
              <Play size={16} />
              Start Training Job
            </button>
          </div>
        </div>

        {/* Active Model */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Brain className="text-blue-400" size={18} />
              Active Model
            </h2>
            <Link 
              href="/admin/operations/model"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Details <ChevronRight size={12} />
            </Link>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-lg font-bold text-white">{data.modelPerformance.activeModel}</div>
              <div className="text-sm text-gray-400 flex items-center gap-1">
                <Clock size={12} />
                Trained {data.modelPerformance.lastTrained}
              </div>
            </div>
            
            {/* Performance metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0a0a0f] rounded-lg p-3 border border-[#1a1a2e]">
                <div className="text-xl font-bold text-green-400">{data.modelPerformance.accuracy}%</div>
                <div className="text-xs text-gray-500">Accuracy</div>
              </div>
              <div className="bg-[#0a0a0f] rounded-lg p-3 border border-[#1a1a2e]">
                <div className="text-xl font-bold text-blue-400">{data.modelPerformance.calibration}</div>
                <div className="text-xs text-gray-500">Calibration</div>
              </div>
              <div className="bg-[#0a0a0f] rounded-lg p-3 border border-[#1a1a2e]">
                <div className="text-xl font-bold text-yellow-400">{data.modelPerformance.mae}</div>
                <div className="text-xs text-gray-500">MAE (DPS)</div>
              </div>
              <div className="bg-[#0a0a0f] rounded-lg p-3 border border-[#1a1a2e]">
                <div className="text-xl font-bold text-purple-400">{data.modelPerformance.coverage}%</div>
                <div className="text-xs text-gray-500">Coverage</div>
              </div>
            </div>
            
            {/* Trend indicator */}
            <div className={cn(
              'flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium',
              data.modelPerformance.accuracyTrend >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            )}>
              {data.modelPerformance.accuracyTrend >= 0 ? (
                <>
                  <TrendingUp size={16} />
                  <span>+{data.modelPerformance.accuracyTrend}% vs last week</span>
                </>
              ) : (
                <>
                  <TrendingDown size={16} />
                  <span>{data.modelPerformance.accuracyTrend}% vs last week</span>
                </>
              )}
            </div>

            {/* Feature importance preview */}
            <div className="pt-3 border-t border-[#1a1a2e]">
              <div className="text-xs text-gray-500 mb-2">Top Features</div>
              <div className="space-y-1">
                {['hook_strength', 'emotional_peak', 'trend_alignment'].map((feature, i) => (
                  <div key={feature} className="flex items-center gap-2">
                    <div className="h-1.5 bg-purple-400/30 rounded-full flex-1">
                      <div 
                        className="h-full bg-purple-400 rounded-full"
                        style={{ width: `${100 - i * 25}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-24 truncate">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Experiments */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FlaskConical className="text-green-400" size={18} />
              Active Experiments
            </h2>
            <Link 
              href="/admin/operations/experiments"
              className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
            >
              View All <ChevronRight size={12} />
            </Link>
          </div>
          
          {data.experiments.length > 0 ? (
            <div className="space-y-3">
              {data.experiments.map((exp) => (
                <div key={exp.id} className="bg-[#0a0a0f] rounded-lg p-4 border border-[#1a1a2e]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{exp.name}</span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      exp.status === 'running' && 'bg-green-500/20 text-green-400',
                      exp.status === 'completed' && 'bg-blue-500/20 text-blue-400',
                      exp.status === 'draft' && 'bg-gray-500/20 text-gray-400'
                    )}>
                      {exp.status}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>{exp.samples.toLocaleString()} samples</span>
                      <span>{exp.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-400 transition-all"
                        style={{ width: `${exp.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Preliminary lift:</span>
                    <span className={cn(
                      'font-medium',
                      exp.lift.startsWith('+') ? 'text-green-400' : 'text-red-400'
                    )}>
                      {exp.lift}
                    </span>
                  </div>
                </div>
              ))}
              
              <Link
                href="/admin/operations/experiments/new"
                className="block w-full py-2.5 border border-dashed border-[#2a2a4e] text-gray-400 rounded-lg hover:border-green-500/50 hover:text-green-400 transition-colors text-center text-sm"
              >
                + New Experiment
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <FlaskConical className="mx-auto text-gray-600 mb-2" size={32} />
              <p className="text-gray-400 text-sm">No active experiments</p>
              <Link 
                href="/admin/operations/experiments/new"
                className="mt-3 text-sm text-green-400 hover:text-green-300 inline-block"
              >
                Start an experiment →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Business KPIs */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Business KPIs</h2>
          <Link 
            href="/admin/operations/analytics"
            className="text-xs text-gray-400 hover:text-gray-300"
          >
            View Analytics →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center p-3 bg-[#0a0a0f] rounded-lg">
            <div className="text-2xl font-bold text-green-400">
              ${(data.businessKPIs.mrr / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-gray-400 mt-1">MRR</div>
            <div className="text-xs text-green-400 flex items-center justify-center gap-1 mt-1">
              <TrendingUp size={10} />
              +{data.businessKPIs.mrrTrend}%
            </div>
          </div>
          <div className="text-center p-3 bg-[#0a0a0f] rounded-lg">
            <div className="text-2xl font-bold">{data.businessKPIs.activeAgencies}</div>
            <div className="text-xs text-gray-400 mt-1">Active Agencies</div>
          </div>
          <div className="text-center p-3 bg-[#0a0a0f] rounded-lg">
            <div className="text-2xl font-bold">{data.businessKPIs.activeCreators}</div>
            <div className="text-xs text-gray-400 mt-1">Active Creators</div>
          </div>
          <div className="text-center p-3 bg-[#0a0a0f] rounded-lg">
            <div className="text-2xl font-bold">
              ${(data.businessKPIs.campaignSpend / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-gray-400 mt-1">Campaign Spend</div>
          </div>
          <div className="text-center p-3 bg-[#0a0a0f] rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">
              ${(data.businessKPIs.platformFees / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-gray-400 mt-1">Platform Fees</div>
          </div>
          <div className="text-center p-3 bg-[#0a0a0f] rounded-lg">
            <div className="text-2xl font-bold text-blue-400">
              {data.platformMetrics.predictionsToday}
            </div>
            <div className="text-xs text-gray-400 mt-1">Predictions Today</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Row 1 */}
        <Link
          href="/admin/operations/training/data"
          className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 hover:border-purple-500/50 hover:bg-[#111118]/80 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Database className="text-purple-400" size={20} />
          </div>
          <div>
            <div className="font-medium">Training Data</div>
            <div className="text-xs text-gray-400">Manage training samples</div>
          </div>
        </Link>
        
        <Link
          href="/admin/operations/training/jobs"
          className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 hover:border-cyan-500/50 hover:bg-[#111118]/80 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="text-cyan-400" size={20} />
          </div>
          <div>
            <div className="font-medium">Training Jobs</div>
            <div className="text-xs text-gray-400">Run and monitor training</div>
          </div>
        </Link>
        
        <Link
          href="/admin/operations/training/models"
          className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 hover:border-blue-500/50 hover:bg-[#111118]/80 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Layers className="text-blue-400" size={20} />
          </div>
          <div>
            <div className="font-medium">Model Performance</div>
            <div className="text-xs text-gray-400">Deployed models, accuracy</div>
          </div>
        </Link>
        
        {/* Row 2 */}
        <Link
          href="/admin/operations/data-explorer"
          className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 hover:border-orange-500/50 hover:bg-[#111118]/80 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Search className="text-orange-400" size={20} />
          </div>
          <div>
            <div className="font-medium">Data Explorer</div>
            <div className="text-xs text-gray-400">Browse scraped videos</div>
          </div>
        </Link>
        
        <Link
          href="/admin/operations/health"
          className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 hover:border-green-500/50 hover:bg-[#111118]/80 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Server className="text-green-400" size={20} />
          </div>
          <div>
            <div className="font-medium">System Health</div>
            <div className="text-xs text-gray-400">Services, APIs, databases</div>
          </div>
        </Link>
        
        <Link
          href="/admin/operations/experiments"
          className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 hover:border-yellow-500/50 hover:bg-[#111118]/80 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FlaskConical className="text-yellow-400" size={20} />
          </div>
          <div>
            <div className="font-medium">Experiments</div>
            <div className="text-xs text-gray-400">A/B tests, features</div>
          </div>
        </Link>

        <Link
          href="/admin/operations/system-health"
          className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 hover:border-red-500/50 hover:bg-[#111118]/80 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="text-red-400" size={20} />
          </div>
          <div>
            <div className="font-medium">Pack Health</div>
            <div className="text-xs text-gray-400">Component & pack pipeline status</div>
          </div>
        </Link>

        <Link
          href="/admin/operations/training/base"
          className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 hover:border-indigo-500/50 hover:bg-[#111118]/80 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Radar className="text-indigo-400" size={20} />
          </div>
          <div>
            <div className="font-medium">Training Base</div>
            <div className="text-xs text-gray-400">Discovery scans, pipeline control</div>
          </div>
        </Link>

        <Link
          href="/admin/operations/accuracy"
          className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 hover:border-emerald-500/50 hover:bg-[#111118]/80 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Target className="text-emerald-400" size={20} />
          </div>
          <div>
            <div className="font-medium">Prediction Accuracy</div>
            <div className="text-xs text-gray-400">VPS correlation, scatter plot, trends</div>
          </div>
        </Link>

        <Link
          href="/admin/operations/initiative"
          className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 hover:border-blue-500/50 hover:bg-[#111118]/80 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Layers className="text-blue-400" size={20} />
          </div>
          <div>
            <div className="font-medium">Initiative Intelligence</div>
            <div className="text-xs text-gray-400">Signal coverage, research progress</div>
          </div>
        </Link>
      </div>

      {/* System Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#1a1a2e] flex items-center justify-between sticky top-0 bg-[#111118] z-10">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", isRunningVerify ? "bg-purple-500/20" : "bg-blue-500/20")}>
                  <Shield className={cn(isRunningVerify ? "text-purple-400 animate-pulse" : "text-blue-400")} size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">System Verification Suite</h2>
                  <p className="text-gray-400 text-sm">End-to-end integrity check</p>
                </div>
              </div>
              <button 
                onClick={() => setShowVerifyModal(false)}
                className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {isRunningVerify ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <RefreshCw size={48} className="text-purple-500 animate-spin" />
                  <p className="text-lg font-medium text-purple-400">Running verification suite...</p>
                  <div className="text-sm text-gray-500">Testing components, features, data flow, and accuracy</div>
                </div>
              ) : verifyResult ? (
                <>
                  {/* Overall Result */}
                  <div className={cn(
                    "p-4 rounded-xl border flex items-center gap-4",
                    verifyResult.overall === 'passed'
                      ? "bg-green-500/10 border-green-500/30" 
                      : "bg-red-500/10 border-red-500/30"
                  )}>
                    {verifyResult.overall === 'passed' ? (
                      <CheckCircle className="text-green-400" size={32} />
                    ) : (
                      <XCircle className="text-red-400" size={32} />
                    )}
                    <div>
                      <h3 className={cn("font-bold text-lg", verifyResult.overall === 'passed' ? "text-green-400" : "text-red-400")}>
                        {verifyResult.overall === 'passed' ? "Verification Passed" : "Verification Failed"}
                      </h3>
                      <p className="text-sm text-gray-300">
                        {verifyResult.summary?.passed || 0} passed, {verifyResult.summary?.failed || 0} failed, {verifyResult.summary?.warnings || 0} warnings
                      </p>
                    </div>
                  </div>

                  {/* Test Results */}
                  <div className="space-y-3">
                    {verifyResult.tests?.map((test: any, i: number) => (
                      <div key={i} className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {test.status === 'passed' && <CheckCircle size={18} className="text-green-400" />}
                            {test.status === 'failed' && <XCircle size={18} className="text-red-400" />}
                            {test.status === 'warning' && <AlertTriangle size={18} className="text-yellow-400" />}
                            <span className="font-medium">{test.name}</span>
                          </div>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded uppercase font-bold",
                            test.status === 'passed' ? "bg-green-500/10 text-green-400" :
                            test.status === 'failed' ? "bg-red-500/10 text-red-400" :
                            "bg-yellow-500/10 text-yellow-400"
                          )}>
                            {test.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 ml-7">{test.message}</p>
                        {test.details && test.details.length > 0 && (
                          <div className="mt-3 ml-7 bg-[#111118] p-3 rounded border border-[#1a1a2e]">
                            <ul className="space-y-1 text-xs text-gray-500">
                              {test.details.map((d: string, j: number) => (
                                <li key={j} className="flex items-start gap-2">
                                  <span className="mt-1 w-1 h-1 rounded-full bg-gray-600 shrink-0" />
                                  {d}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-red-400">
                  {verifyResult?.error || "Failed to run verification."}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-[#1a1a2e] bg-[#111118] sticky bottom-0 flex justify-end">
              <button 
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 bg-[#1a1a2e] hover:bg-[#2a2a4e] text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#1a1a2e] flex items-center justify-between sticky top-0 bg-[#111118] z-10">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", isRunningAudit ? "bg-purple-500/20" : "bg-green-500/20")}>
                  <Activity className={cn(isRunningAudit ? "text-purple-400 animate-pulse" : "text-green-400")} size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">System Health Audit</h2>
                  <p className="text-gray-400 text-sm">Comprehensive diagnostic scan</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAuditModal(false)}
                className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {isRunningAudit ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <RefreshCw size={48} className="text-purple-500 animate-spin" />
                  <p className="text-lg font-medium text-purple-400">Running diagnostics...</p>
                  <div className="text-sm text-gray-500">Checking components, verifying data integrity, and analyzing pipeline health</div>
                </div>
              ) : auditResult ? (
                <>
                  {/* Overall Status */}
                  <div className={cn(
                    "p-4 rounded-xl border flex items-center gap-4",
                    auditResult.thresholds_met 
                      ? "bg-green-500/10 border-green-500/30" 
                      : "bg-red-500/10 border-red-500/30"
                  )}>
                    {auditResult.thresholds_met ? (
                      <CheckCircle className="text-green-400" size={32} />
                    ) : (
                      <AlertTriangle className="text-red-400" size={32} />
                    )}
                    <div>
                      <h3 className={cn("font-bold text-lg", auditResult.thresholds_met ? "text-green-400" : "text-red-400")}>
                        {auditResult.thresholds_met ? "All Systems Nominal" : "Issues Detected"}
                      </h3>
                      <p className="text-sm text-gray-300">
                        {auditResult.issues_found.length} issues found during audit
                      </p>
                    </div>
                  </div>

                  {/* Issues List */}
                  {auditResult.issues_found.length > 0 && (
                    <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 space-y-2">
                      <h4 className="text-red-400 font-medium flex items-center gap-2">
                        <AlertCircle size={16} /> Detected Issues
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-200/80">
                        {auditResult.issues_found.map((issue: string, i: number) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Kai Orchestrator Status */}
                    <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-xl p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Cpu size={16} className="text-blue-400" /> Kai Orchestrator
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status</span>
                          <span className={cn(
                            "font-medium px-2 py-0.5 rounded",
                            auditResult.kai_orchestrator.status === 'healthy' ? "bg-green-500/20 text-green-400" :
                            auditResult.kai_orchestrator.status === 'degraded' ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-red-500/20 text-red-400"
                          )}>
                            {auditResult.kai_orchestrator.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Working Components</span>
                          <span>{auditResult.kai_orchestrator.components_working}</span>
                        </div>
                        {auditResult.kai_orchestrator.components_failing.length > 0 && (
                          <div className="pt-2 border-t border-[#1a1a2e]">
                            <span className="text-red-400 text-xs block mb-1">Failing Components:</span>
                            <div className="flex flex-wrap gap-1">
                              {auditResult.kai_orchestrator.components_failing.map((c: string) => (
                                <span key={c} className="px-1.5 py-0.5 bg-red-500/10 text-red-400 text-xs rounded border border-red-500/20">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 pt-2">
                          Last successful run: {auditResult.kai_orchestrator.last_successful_run ? new Date(auditResult.kai_orchestrator.last_successful_run).toLocaleString() : 'Never'}
                        </div>
                      </div>
                    </div>

                    {/* Pipeline Health */}
                    <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-xl p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Activity size={16} className="text-purple-400" /> Pipeline Health (Last 10)
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Avg Features</span>
                          <div className="text-right">
                            <div className={cn("font-medium", auditResult.pipeline_health.avg_features_last_10 >= 200 ? "text-green-400" : "text-yellow-400")}>
                              {auditResult.pipeline_health.avg_features_last_10}
                            </div>
                            <div className="text-xs text-gray-600">Target: 200+</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Avg Components</span>
                          <div className="text-right">
                            <div className={cn("font-medium", auditResult.pipeline_health.avg_components_succeeded_last_10 >= 15 ? "text-green-400" : "text-yellow-400")}>
                              {auditResult.pipeline_health.avg_components_succeeded_last_10}
                            </div>
                            <div className="text-xs text-gray-600">Target: 15+</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Quality Score</span>
                          <div className="text-right">
                            <div className={cn("font-medium", auditResult.pipeline_health.avg_quality_score_last_10 >= 0.5 ? "text-green-400" : "text-yellow-400")}>
                              {(auditResult.pipeline_health.avg_quality_score_last_10 * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-600">Target: 50%+</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Data Integrity */}
                    <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-xl p-4 md:col-span-2">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Database size={16} className="text-cyan-400" /> Data Integrity
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-[#111118] p-3 rounded-lg border border-[#1a1a2e]">
                          <div className="text-gray-400 text-xs mb-1">Mismatched Counts</div>
                          <div className={cn("text-xl font-bold", auditResult.data_integrity.videos_with_mismatched_counts === 0 ? "text-green-400" : "text-red-400")}>
                            {auditResult.data_integrity.videos_with_mismatched_counts}
                          </div>
                        </div>
                        <div className="bg-[#111118] p-3 rounded-lg border border-[#1a1a2e]">
                          <div className="text-gray-400 text-xs mb-1">Orphaned Results</div>
                          <div className={cn("text-xl font-bold", auditResult.data_integrity.orphaned_component_results === 0 ? "text-green-400" : "text-yellow-400")}>
                            {auditResult.data_integrity.orphaned_component_results}
                          </div>
                        </div>
                        <div className="bg-[#111118] p-3 rounded-lg border border-[#1a1a2e]">
                          <div className="text-gray-400 text-xs mb-1">Orphaned Features</div>
                          <div className={cn("text-xl font-bold", auditResult.data_integrity.training_features_without_video_analysis === 0 ? "text-green-400" : "text-yellow-400")}>
                            {auditResult.data_integrity.training_features_without_video_analysis}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-red-400">
                  {auditResult?.error || "Failed to load audit results. Please try again."}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-[#1a1a2e] bg-[#111118] sticky bottom-0 flex justify-end">
              <button 
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 bg-[#1a1a2e] hover:bg-[#2a2a4e] text-white rounded-lg transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}











