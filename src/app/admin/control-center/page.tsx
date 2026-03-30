'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Layers, Cpu, Target, Zap, AlertTriangle,
  RefreshCw, Gauge, Server, ChevronDown, Filter, ArrowRight, Info
} from 'lucide-react';
import Link from 'next/link';
import { 
  SystemHealthSummary, 
  PageHealth, 
  ComponentHealth, 
  EnhancementStatus,
  ErrorLogEntry,
  AccuracyData
} from '@/lib/control-center/types';
import { CATEGORY_CONFIG } from '@/lib/control-center/constants';
import { StatusDot, StatusBadge } from '@/components/control-center/StatusDot';
import { PageHealthGrid } from '@/components/control-center/PageHealthCard';
import { ComponentStatusTable } from '@/components/control-center/ComponentStatusTable';
import { AccuracyChart } from '@/components/control-center/AccuracyChart';
import { AccuracyBreakdown } from '@/components/control-center/AccuracyBreakdown';
import { EnhancementGrid } from '@/components/control-center/EnhancementCard';
import { ErrorList } from '@/components/control-center/ErrorItem';
import { DetailPanel } from '@/components/control-center/DetailPanel';

type Section = 'overview' | 'pages' | 'components' | 'accuracy' | 'enhancements' | 'errors';

export default function ControlCenterPage() {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [selectedItem, setSelectedItem] = useState<PageHealth | ComponentHealth | null>(null);
  const [selectedType, setSelectedType] = useState<'page' | 'component' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Data state
  const [summary, setSummary] = useState<SystemHealthSummary | null>(null);
  const [pages, setPages] = useState<PageHealth[]>([]);
  const [components, setComponents] = useState<ComponentHealth[]>([]);
  const [enhancements, setEnhancements] = useState<EnhancementStatus[]>([]);
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [accuracyData, setAccuracyData] = useState<AccuracyData | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [healthRes, accuracyRes, errorsRes] = await Promise.all([
        fetch('/api/system-health'),
        fetch('/api/system-health/accuracy'),
        fetch('/api/system-health/errors')
      ]);
      
      const healthData = await healthRes.json();
      const accuracyDataRes = await accuracyRes.json();
      const errorsData = await errorsRes.json();
      
      setSummary(healthData.summary);
      setPages(healthData.pages);
      setComponents(healthData.components);
      setEnhancements(healthData.enhancements);
      setAccuracyData(accuracyDataRes);
      setErrors(errorsData.errors);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handlePageClick = (page: PageHealth) => {
    setSelectedItem(page);
    setSelectedType('page');
  };

  const handleComponentClick = (component: ComponentHealth) => {
    setSelectedItem(component);
    setSelectedType('component');
  };

  const handleClosePanel = () => {
    setSelectedItem(null);
    setSelectedType(null);
  };

  const navItems: { id: Section; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'pages', label: 'Pages & Workflows', icon: Layers },
    { id: 'components', label: 'AI Components', icon: Cpu },
    { id: 'accuracy', label: 'Prediction Accuracy', icon: Target },
    { id: 'enhancements', label: 'Enhancements', icon: Zap },
    { id: 'errors', label: 'Error Log', icon: AlertTriangle }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-purple-500" size={32} />
          <p className="text-gray-400">Loading Control Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Deprecation Banner */}
      <div className="bg-purple-500/20 border-b border-purple-500/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="text-purple-400" size={18} />
            <span className="text-sm">
              <strong>New!</strong> Control Center has been upgraded to the Operations Intelligence Center with enhanced features.
            </span>
          </div>
          <Link 
            href="/admin/operations/health"
            className="flex items-center gap-2 px-4 py-1.5 bg-purple-500/30 hover:bg-purple-500/40 rounded-lg text-sm font-medium text-purple-300 transition-colors"
          >
            Go to Operations Center <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      
      <div className="flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col flex-shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Gauge size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg">Control Center</h1>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeSection === item.id 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
                {item.id === 'errors' && errors.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {errors.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-2">Python Service</div>
          <div className="flex items-center gap-2">
            <StatusDot status={enhancements.some(e => e.connected) ? 'healthy' : 'error'} />
            <span className="text-sm text-gray-300">localhost:8001</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-gray-900/50 border-b border-gray-800 px-6 py-4 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {navItems.find(n => n.id === activeSection)?.label}
              </h2>
              <p className="text-sm text-gray-500">CleanCopy System Health Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              {summary && (
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-gray-400">{summary.pagesHealthy} Healthy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span className="text-gray-400">{summary.pagesWarning} Warning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-gray-400">{summary.pagesError} Error</span>
                  </div>
                </div>
              )}
              <button 
                onClick={handleRefresh}
                className={`flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors ${isRefreshing ? 'opacity-50' : ''}`}
                disabled={isRefreshing}
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6">
          {/* Overview Section */}
          {activeSection === 'overview' && summary && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Layers size={20} className="text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{pages.length}</div>
                      <div className="text-xs text-gray-500">Total Pages</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-400">{summary.pagesHealthy} healthy</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-yellow-400">{summary.pagesWarning} warning</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-red-400">{summary.pagesError} error</span>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Cpu size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{summary.componentsActive}/{summary.componentsTotal}</div>
                      <div className="text-xs text-gray-500">Active Components</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {Math.round((summary.componentsActive / summary.componentsTotal) * 100)}% utilization
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Target size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{summary.avgAccuracy}%</div>
                      <div className="text-xs text-gray-500">Avg Accuracy</div>
                    </div>
                  </div>
                  <div className="text-xs text-yellow-400">
                    Below 90% target
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Server size={20} className="text-orange-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{summary.avgLatency.toFixed(1)}s</div>
                      <div className="text-xs text-gray-500">Avg Latency</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Across all components
                  </div>
                </div>
              </div>

              {/* Quick Status Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pages with Issues */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-yellow-400" />
                    Pages Needing Attention
                  </h3>
                  <div className="space-y-2">
                    {pages.filter(p => p.status !== 'healthy').map(page => (
                      <button
                        key={page.id}
                        onClick={() => handlePageClick(page)}
                        className="w-full flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <StatusDot status={page.status} />
                          <span className="text-white">{page.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {page.lastError}
                        </span>
                      </button>
                    ))}
                    {pages.filter(p => p.status !== 'healthy').length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        All pages are healthy!
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Errors */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-400" />
                    Recent Errors ({errors.length})
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {errors.slice(0, 5).map(error => (
                      <div 
                        key={error.id}
                        className={`p-3 rounded-lg ${
                          error.severity === 'error' ? 'bg-red-500/10 border border-red-500/30' :
                          'bg-yellow-500/10 border border-yellow-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white text-sm">{error.source}</span>
                          <StatusBadge status={error.severity === 'error' ? 'error' : 'warning'} showLabel={false} />
                        </div>
                        <p className="text-xs text-gray-400 truncate">{error.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Accuracy Preview */}
              {accuracyData && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <h3 className="font-semibold mb-4">Prediction Accuracy Trend</h3>
                  <AccuracyChart predictions={accuracyData.predictions} height={200} />
                </div>
              )}
            </div>
          )}

          {/* Pages Section */}
          {activeSection === 'pages' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-400">
                  {pages.length} pages monitored
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="healthy">Healthy</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
              </div>
              <PageHealthGrid 
                pages={statusFilter === 'all' ? pages : pages.filter(p => p.status === statusFilter)}
                onPageClick={handlePageClick}
              />
            </div>
          )}

          {/* Components Section */}
          {activeSection === 'components' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-400">
                  {components.length} AI components
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Categories</option>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="healthy">Healthy</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <ComponentStatusTable 
                  components={components}
                  onComponentClick={handleComponentClick}
                  filterCategory={categoryFilter}
                  filterStatus={statusFilter}
                />
              </div>
            </div>
          )}

          {/* Accuracy Section */}
          {activeSection === 'accuracy' && accuracyData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <h3 className="font-semibold mb-4">Predicted vs Actual DPS</h3>
                  <AccuracyChart predictions={accuracyData.predictions} height={300} />
                </div>
                
                {accuracyData.lastPrediction && (
                  <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                    <h3 className="font-semibold mb-4">Last Prediction Breakdown</h3>
                    <AccuracyBreakdown 
                      componentScores={accuracyData.lastPrediction.componentScores}
                      predicted={accuracyData.lastPrediction.predicted}
                      actual={accuracyData.lastPrediction.actual}
                      error={accuracyData.lastPrediction.error}
                    />
                  </div>
                )}
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <h3 className="font-semibold mb-4">Accuracy Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-white mb-1">{accuracyData.avgAccuracy}%</div>
                    <div className="text-sm text-gray-400">Average Accuracy</div>
                    <div className="text-xs text-yellow-400 mt-2">23% below 90% target</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-white mb-1">{accuracyData.predictions.length}</div>
                    <div className="text-sm text-gray-400">Predictions Tracked</div>
                    <div className="text-xs text-gray-500 mt-2">Last 7 days</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-red-400 mb-1">+39.3</div>
                    <div className="text-sm text-gray-400">Largest Error</div>
                    <div className="text-xs text-red-400 mt-2">182% over-prediction</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhancements Section */}
          {activeSection === 'enhancements' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Server size={20} className="text-purple-400" />
                  <h3 className="font-semibold">Python Enhancement Service</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  FastAPI microservice running on localhost:8001 providing advanced analysis capabilities.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <StatusDot status={enhancements.some(e => e.connected) ? 'healthy' : 'error'} />
                    <span className="text-sm text-gray-300">
                      {enhancements.some(e => e.connected) ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {enhancements.filter(e => e.usedInPredictions).length} of {enhancements.length} active in predictions
                  </div>
                </div>
              </div>

              <EnhancementGrid enhancements={enhancements} />

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <h4 className="font-medium text-yellow-400 mb-2">Integration Note</h4>
                <p className="text-sm text-gray-400">
                  PySceneDetect, faster-whisper, and SHAP Explainer are installed and connected but not yet 
                  integrated into the prediction pipeline. Enable them in the component settings to start 
                  using these enhancements.
                </p>
              </div>
            </div>
          )}

          {/* Errors Section */}
          {activeSection === 'errors' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-400">
                  {errors.length} active issues
                </p>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                    Export Logs
                  </button>
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors">
                    Mark All Resolved
                  </button>
                </div>
              </div>
              
              <ErrorList 
                errors={errors}
                onResolve={(id) => {
                  setErrors(errors.filter(e => e.id !== id));
                }}
              />
            </div>
          )}
        </main>
      </div>
      </div>

      {/* Detail Panel */}
      <DetailPanel 
        item={selectedItem} 
        type={selectedType}
        onClose={handleClosePanel}
      />
    </div>
  );
}









