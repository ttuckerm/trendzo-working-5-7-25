'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  AlertCircle,
  Bell,
  BellOff,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  Settings,
  Filter,
  Search,
  X,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  TrendingDown,
  TrendingUp,
  Activity,
  Database,
  Brain,
  Server,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Alert {
  id: string;
  type: 'model_drift' | 'accuracy_drop' | 'service_down' | 'error_spike' | 'anomaly' | 'threshold';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  metricName?: string;
  metricValue?: number;
  thresholdValue?: number;
  status: 'active' | 'acknowledged' | 'resolved' | 'snoozed';
  firstTriggeredAt: string;
  lastTriggeredAt: string;
  triggerCount: number;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  snoozedUntil?: string;
}

interface AlertThreshold {
  id: string;
  name: string;
  metric: string;
  condition: 'above' | 'below';
  value: number;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
}

// Mock data
const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'accuracy_drop',
    severity: 'warning',
    title: 'Model accuracy trending below threshold',
    message: 'Prediction accuracy has dropped to 71.2%, below the 72% warning threshold. This may indicate model drift or changes in content patterns.',
    metricName: 'prediction_accuracy',
    metricValue: 71.2,
    thresholdValue: 72,
    status: 'active',
    firstTriggeredAt: '2 hours ago',
    lastTriggeredAt: '30 min ago',
    triggerCount: 3,
  },
  {
    id: '2',
    type: 'threshold',
    severity: 'info',
    title: 'New training data batch ready',
    message: '342 new training samples have been collected and are ready for the next training run. Current total: 12,847 samples.',
    metricName: 'pending_training_samples',
    metricValue: 342,
    thresholdValue: 300,
    status: 'active',
    firstTriggeredAt: '5 hours ago',
    lastTriggeredAt: '5 hours ago',
    triggerCount: 1,
  },
  {
    id: '3',
    type: 'error_spike',
    severity: 'warning',
    title: 'Elevated error rate on thumbnail API',
    message: 'Error rate on /api/thumbnails/resolve has increased to 2.1% in the last hour, exceeding the 1% threshold.',
    metricName: 'thumbnail_api_error_rate',
    metricValue: 2.1,
    thresholdValue: 1,
    status: 'acknowledged',
    firstTriggeredAt: '1 hour ago',
    lastTriggeredAt: '45 min ago',
    triggerCount: 2,
    acknowledgedBy: 'Admin',
    acknowledgedAt: '30 min ago',
  },
  {
    id: '4',
    type: 'service_down',
    severity: 'critical',
    title: 'Python ML Service unresponsive',
    message: 'The Python ML service at localhost:8000 failed health checks for 2 consecutive minutes.',
    status: 'resolved',
    firstTriggeredAt: 'Yesterday',
    lastTriggeredAt: 'Yesterday',
    triggerCount: 1,
    resolvedAt: 'Yesterday',
  },
  {
    id: '5',
    type: 'model_drift',
    severity: 'warning',
    title: 'Feature distribution drift detected',
    message: 'The "trend_alignment_score" feature has shifted 5.2% from baseline, which may affect prediction quality.',
    metricName: 'trend_alignment_drift',
    metricValue: 5.2,
    thresholdValue: 5,
    status: 'snoozed',
    firstTriggeredAt: '3 days ago',
    lastTriggeredAt: '3 days ago',
    triggerCount: 1,
    snoozedUntil: 'Tomorrow',
  },
];

const mockThresholds: AlertThreshold[] = [
  { id: '1', name: 'Accuracy Warning', metric: 'prediction_accuracy', condition: 'below', value: 72, severity: 'warning', enabled: true },
  { id: '2', name: 'Accuracy Critical', metric: 'prediction_accuracy', condition: 'below', value: 68, severity: 'critical', enabled: true },
  { id: '3', name: 'Error Rate', metric: 'api_error_rate', condition: 'above', value: 1, severity: 'warning', enabled: true },
  { id: '4', name: 'Response Time', metric: 'avg_response_time', condition: 'above', value: 500, severity: 'warning', enabled: true },
  { id: '5', name: 'Training Data Ready', metric: 'pending_training_samples', condition: 'above', value: 300, severity: 'info', enabled: true },
  { id: '6', name: 'Feature Drift', metric: 'max_feature_drift', condition: 'above', value: 5, severity: 'warning', enabled: true },
];

const severityColors = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const severityIcons = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Bell,
};

const typeIcons = {
  model_drift: Brain,
  accuracy_drop: TrendingDown,
  service_down: Server,
  error_spike: Activity,
  anomaly: Zap,
  threshold: Database,
};

function AlertCard({ alert, onAcknowledge, onResolve, onSnooze }: { 
  alert: Alert; 
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onSnooze: (id: string) => void;
}) {
  const SeverityIcon = severityIcons[alert.severity];
  const TypeIcon = typeIcons[alert.type];

  return (
    <div className={cn(
      'bg-[#111118] border rounded-xl p-5 transition-all',
      alert.status === 'active' && severityColors[alert.severity].split(' ')[2],
      alert.status !== 'active' && 'border-[#1a1a2e]',
      alert.status === 'resolved' && 'opacity-60'
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          severityColors[alert.severity].split(' ').slice(0, 2).join(' ')
        )}>
          <SeverityIcon size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  severityColors[alert.severity].split(' ').slice(0, 2).join(' ')
                )}>
                  {alert.severity}
                </span>
                <span className="text-xs px-2 py-0.5 bg-[#1a1a2e] text-gray-400 rounded-full flex items-center gap-1">
                  <TypeIcon size={10} />
                  {alert.type.replace('_', ' ')}
                </span>
                {alert.status !== 'active' && (
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    alert.status === 'acknowledged' && 'bg-yellow-500/20 text-yellow-400',
                    alert.status === 'resolved' && 'bg-green-500/20 text-green-400',
                    alert.status === 'snoozed' && 'bg-purple-500/20 text-purple-400'
                  )}>
                    {alert.status}
                  </span>
                )}
              </div>
              <h3 className="font-semibold">{alert.title}</h3>
            </div>
            
            {alert.triggerCount > 1 && (
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full flex-shrink-0">
                ×{alert.triggerCount}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-400 mb-3">{alert.message}</p>
          
          {(alert.metricValue !== undefined && alert.thresholdValue !== undefined) && (
            <div className="flex items-center gap-4 text-sm mb-3">
              <span className="text-gray-500">
                Current: <span className={cn(
                  'font-medium',
                  alert.severity === 'critical' ? 'text-red-400' : 
                  alert.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                )}>{alert.metricValue}</span>
              </span>
              <span className="text-gray-500">
                Threshold: <span className="text-gray-300">{alert.thresholdValue}</span>
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {alert.status === 'active' && (
                <>First triggered: {alert.firstTriggeredAt} · Last: {alert.lastTriggeredAt}</>
              )}
              {alert.status === 'acknowledged' && (
                <>Acknowledged by {alert.acknowledgedBy} {alert.acknowledgedAt}</>
              )}
              {alert.status === 'resolved' && (
                <>Resolved {alert.resolvedAt}</>
              )}
              {alert.status === 'snoozed' && (
                <>Snoozed until {alert.snoozedUntil}</>
              )}
            </div>
            
            {alert.status === 'active' && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onSnooze(alert.id)}
                  className="px-3 py-1 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
                >
                  Snooze
                </button>
                <button 
                  onClick={() => onAcknowledge(alert.id)}
                  className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
                >
                  Acknowledge
                </button>
                <button 
                  onClick={() => onResolve(alert.id)}
                  className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                >
                  Resolve
                </button>
              </div>
            )}
            
            {alert.status === 'acknowledged' && (
              <button 
                onClick={() => onResolve(alert.id)}
                className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
              >
                Resolve
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  
  const filteredAlerts = alerts.filter(alert => {
    if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    return true;
  });

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const criticalCount = alerts.filter(a => a.status === 'active' && a.severity === 'critical').length;

  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'acknowledged' as const, acknowledgedBy: 'Admin', acknowledgedAt: 'Just now' } : a
    ));
  };

  const handleResolve = (id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'resolved' as const, resolvedAt: 'Just now' } : a
    ));
  };

  const handleSnooze = (id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'snoozed' as const, snoozedUntil: 'in 4 hours' } : a
    ));
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/operations"
            className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Alert Management</h1>
            <p className="text-gray-400 text-sm mt-1">
              Monitor, acknowledge, and configure alerts
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="px-4 py-2 bg-[#111118] border border-[#1a1a2e] rounded-lg hover:border-purple-500/50 transition-colors flex items-center gap-2"
        >
          <Settings size={16} />
          Thresholds
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={cn(
          'rounded-xl p-4 border',
          criticalCount > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-[#111118] border-[#1a1a2e]'
        )}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={criticalCount > 0 ? 'text-red-400' : 'text-gray-400'} size={18} />
            <span className="text-sm text-gray-400">Critical</span>
          </div>
          <div className={cn('text-3xl font-bold', criticalCount > 0 ? 'text-red-400' : '')}>{criticalCount}</div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-yellow-400" size={18} />
            <span className="text-sm text-gray-400">Warnings</span>
          </div>
          <div className="text-3xl font-bold">
            {alerts.filter(a => a.status === 'active' && a.severity === 'warning').length}
          </div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="text-blue-400" size={18} />
            <span className="text-sm text-gray-400">Acknowledged</span>
          </div>
          <div className="text-3xl font-bold">
            {alerts.filter(a => a.status === 'acknowledged').length}
          </div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-400" size={18} />
            <span className="text-sm text-gray-400">Resolved Today</span>
          </div>
          <div className="text-3xl font-bold">
            {alerts.filter(a => a.status === 'resolved').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 border-b border-[#1a1a2e]">
          {['all', 'active', 'acknowledged', 'snoozed', 'resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px capitalize',
                statusFilter === status 
                  ? 'border-purple-400 text-purple-400' 
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              )}
            >
              {status}
            </button>
          ))}
        </div>
        
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-[#111118] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <AlertCard 
            key={alert.id} 
            alert={alert}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
            onSnooze={handleSnooze}
          />
        ))}
        
        {filteredAlerts.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto text-green-400 mb-3" size={48} />
            <p className="text-gray-400">No alerts match your filters</p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Alert Thresholds</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-[#1a1a2e] rounded"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-3">
              {mockThresholds.map((threshold) => (
                <div 
                  key={threshold.id}
                  className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <button className={cn(
                      'w-10 h-6 rounded-full relative transition-colors',
                      threshold.enabled ? 'bg-green-500' : 'bg-gray-600'
                    )}>
                      <span className={cn(
                        'absolute w-4 h-4 bg-white rounded-full top-1 transition-all',
                        threshold.enabled ? 'left-5' : 'left-1'
                      )} />
                    </button>
                    <div>
                      <div className="font-medium text-sm">{threshold.name}</div>
                      <div className="text-xs text-gray-400">
                        {threshold.metric} {threshold.condition} {threshold.value}
                      </div>
                    </div>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    severityColors[threshold.severity].split(' ').slice(0, 2).join(' ')
                  )}>
                    {threshold.severity}
                  </span>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 py-2 border border-dashed border-[#2a2a4e] text-gray-400 rounded-lg hover:border-purple-500/50 hover:text-purple-400 transition-colors">
              + Add Threshold
            </button>
            
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#1a1a2e]">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2 bg-[#0a0a0f] text-gray-400 rounded-lg hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
























































































