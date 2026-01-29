'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Server,
  Activity,
  Database,
  Cloud,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  AlertCircle,
  Brain,
  Code,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface ServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  lastCheck: string;
  endpoint?: string;
  details?: string;
}

interface APIEndpoint {
  path: string;
  method: string;
  avgLatency: number;
  p99Latency: number;
  errorRate: number;
  requestsPerMin: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface ErrorLog {
  id: string;
  timestamp: string;
  service: string;
  endpoint: string;
  message: string;
  count: number;
  severity: 'error' | 'warning' | 'info';
}

interface ComponentHealth {
  name: string;
  category: string;
  status: 'operational' | 'degraded' | 'down';
  lastRun: string;
  avgLatency: number;
  successRate: number;
}

// Mock data
const mockServices: ServiceHealth[] = [
  { name: 'Supabase Database', status: 'operational', latency: 45, uptime: 99.99, lastCheck: '10s ago', endpoint: 'db.supabase.co', details: 'PostgreSQL 15' },
  { name: 'Python ML Service', status: 'operational', latency: 180, uptime: 99.95, lastCheck: '10s ago', endpoint: 'localhost:8000', details: 'FastAPI + XGBoost' },
  { name: 'OpenAI API', status: 'operational', latency: 890, uptime: 99.90, lastCheck: '10s ago', endpoint: 'api.openai.com', details: 'GPT-4 Turbo' },
  { name: 'Google Gemini', status: 'operational', latency: 720, uptime: 99.85, lastCheck: '10s ago', endpoint: 'generativelanguage.googleapis.com', details: 'Gemini 1.5 Pro' },
  { name: 'Auth Service', status: 'operational', latency: 32, uptime: 99.99, lastCheck: '10s ago', endpoint: 'auth.supabase.co', details: 'Supabase Auth' },
  { name: 'Redis Cache', status: 'operational', latency: 2, uptime: 99.99, lastCheck: '10s ago', endpoint: 'redis://localhost:6379', details: 'Redis 7.0' },
  { name: 'TikTok API', status: 'operational', latency: 340, uptime: 99.70, lastCheck: '10s ago', endpoint: 'www.tiktok.com/oembed', details: 'oEmbed Endpoint' },
  { name: 'Vercel Edge', status: 'operational', latency: 15, uptime: 99.99, lastCheck: '10s ago', endpoint: 'vercel.com', details: 'Edge Functions' },
];

const mockAPIEndpoints: APIEndpoint[] = [
  { path: '/api/predict', method: 'POST', avgLatency: 340, p99Latency: 890, errorRate: 0.2, requestsPerMin: 12, status: 'healthy' },
  { path: '/api/analyze', method: 'POST', avgLatency: 2100, p99Latency: 4500, errorRate: 0.5, requestsPerMin: 8, status: 'healthy' },
  { path: '/api/system-health', method: 'GET', avgLatency: 45, p99Latency: 120, errorRate: 0, requestsPerMin: 30, status: 'healthy' },
  { path: '/api/thumbnails/resolve', method: 'GET', avgLatency: 520, p99Latency: 1200, errorRate: 2.1, requestsPerMin: 5, status: 'warning' },
  { path: '/api/calibration/diagnose', method: 'POST', avgLatency: 180, p99Latency: 450, errorRate: 0.1, requestsPerMin: 3, status: 'healthy' },
];

const mockErrors: ErrorLog[] = [
  { id: '1', timestamp: '2 min ago', service: 'TikTok API', endpoint: '/api/thumbnails/resolve', message: 'Rate limit exceeded (429)', count: 3, severity: 'warning' },
  { id: '2', timestamp: '15 min ago', service: 'OpenAI API', endpoint: '/api/analyze', message: 'Timeout after 30s', count: 1, severity: 'warning' },
  { id: '3', timestamp: '1 hour ago', service: 'Python ML', endpoint: '/api/predict', message: 'Model inference error', count: 2, severity: 'error' },
];

const mockComponents: ComponentHealth[] = [
  { name: 'Feature Extraction', category: 'ML Pipeline', status: 'operational', lastRun: '2 min ago', avgLatency: 450, successRate: 99.2 },
  { name: 'DPS Calculator', category: 'ML Pipeline', status: 'operational', lastRun: '2 min ago', avgLatency: 120, successRate: 99.8 },
  { name: 'Hook Analyzer', category: 'Text Analysis', status: 'operational', lastRun: '5 min ago', avgLatency: 280, successRate: 98.5 },
  { name: 'Emotional Peak Detector', category: 'Audio Analysis', status: 'operational', lastRun: '5 min ago', avgLatency: 340, successRate: 97.8 },
  { name: 'Trend Matcher', category: 'Pattern Analysis', status: 'operational', lastRun: '10 min ago', avgLatency: 180, successRate: 99.1 },
  { name: 'Creator Baseline', category: 'Analytics', status: 'operational', lastRun: '15 min ago', avgLatency: 90, successRate: 99.5 },
  { name: 'Calibration Engine', category: 'ML Pipeline', status: 'operational', lastRun: '2 min ago', avgLatency: 60, successRate: 99.9 },
  { name: 'Negative Signal Detector', category: 'Quality Analysis', status: 'operational', lastRun: '2 min ago', avgLatency: 45, successRate: 99.7 },
];

function ServiceCard({ service }: { service: ServiceHealth }) {
  return (
    <div className={cn(
      'bg-[#111118] border rounded-xl p-4 transition-all',
      service.status === 'operational' && 'border-[#1a1a2e] hover:border-green-500/30',
      service.status === 'degraded' && 'border-yellow-500/30 hover:border-yellow-500/50',
      service.status === 'down' && 'border-red-500/30 hover:border-red-500/50'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            service.status === 'operational' && 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]',
            service.status === 'degraded' && 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]',
            service.status === 'down' && 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)] animate-pulse'
          )} />
          <span className="font-medium text-sm">{service.name}</span>
        </div>
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full',
          service.status === 'operational' && 'bg-green-500/20 text-green-400',
          service.status === 'degraded' && 'bg-yellow-500/20 text-yellow-400',
          service.status === 'down' && 'bg-red-500/20 text-red-400'
        )}>
          {service.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-gray-500">Latency</div>
          <div className={cn(
            'font-medium',
            service.latency < 100 ? 'text-green-400' : service.latency < 500 ? 'text-yellow-400' : 'text-orange-400'
          )}>
            {service.latency}ms
          </div>
        </div>
        <div>
          <div className="text-gray-500">Uptime</div>
          <div className="text-green-400 font-medium">{service.uptime}%</div>
        </div>
      </div>
      
      {service.details && (
        <div className="mt-3 pt-3 border-t border-[#1a1a2e] text-xs text-gray-400">
          {service.details}
        </div>
      )}
    </div>
  );
}

function LatencyChart() {
  const data = [45, 52, 48, 61, 55, 42, 38, 45, 50, 47, 44, 40];
  const max = Math.max(...data);
  
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((value, i) => (
        <div
          key={i}
          className="flex-1 bg-purple-400/30 rounded-t hover:bg-purple-400/50 transition-colors cursor-pointer"
          style={{ height: `${(value / max) * 100}%` }}
          title={`${value}ms`}
        />
      ))}
    </div>
  );
}

export default function SystemHealthPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }, 1000);
  };

  // Calculate overall status
  const operationalCount = mockServices.filter(s => s.status === 'operational').length;
  const degradedCount = mockServices.filter(s => s.status === 'degraded').length;
  const downCount = mockServices.filter(s => s.status === 'down').length;
  const allOperational = operationalCount === mockServices.length;

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
            <h1 className="text-2xl font-bold">System Health Monitor</h1>
            <p className="text-gray-400 text-sm mt-1">
              Services, APIs, components, and error tracking
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              'p-2 bg-[#111118] border border-[#1a1a2e] rounded-lg hover:border-green-500/50 transition-colors',
              isRefreshing && 'opacity-50'
            )}
          >
            <RefreshCw size={18} className={cn('text-gray-400', isRefreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={cn(
        'rounded-xl p-4 flex items-center justify-between',
        allOperational ? 'bg-green-500/10 border border-green-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'
      )}>
        <div className="flex items-center gap-3">
          {allOperational ? (
            <CheckCircle className="text-green-400" size={24} />
          ) : (
            <AlertCircle className="text-yellow-400" size={24} />
          )}
          <div>
            <div className={cn('font-semibold', allOperational ? 'text-green-400' : 'text-yellow-400')}>
              {allOperational ? 'All Systems Operational' : 'Partial System Degradation'}
            </div>
            <div className="text-sm text-gray-400">
              {operationalCount} operational · {degradedCount} degraded · {downCount} down
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">99.97%</div>
          <div className="text-xs text-gray-400">30-day uptime</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-yellow-400" size={18} />
            <span className="text-sm text-gray-400">Avg Response Time</span>
          </div>
          <div className="text-3xl font-bold">340ms</div>
          <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
            <TrendingDown size={12} />
            -15ms vs yesterday
          </div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-orange-400" size={18} />
            <span className="text-sm text-gray-400">Error Rate</span>
          </div>
          <div className="text-3xl font-bold">0.3%</div>
          <div className="text-xs text-gray-400 mt-1">Last 24 hours</div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-blue-400" size={18} />
            <span className="text-sm text-gray-400">API Calls</span>
          </div>
          <div className="text-3xl font-bold">892</div>
          <div className="text-xs text-gray-400 mt-1">Last 24 hours</div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="text-purple-400" size={18} />
            <span className="text-sm text-gray-400">ML Predictions</span>
          </div>
          <div className="text-3xl font-bold">127</div>
          <div className="text-xs text-gray-400 mt-1">Today</div>
        </div>
      </div>

      {/* Services Grid */}
      <div>
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Server className="text-green-400" size={18} />
          External Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockServices.map((service) => (
            <ServiceCard key={service.name} service={service} />
          ))}
        </div>
      </div>

      {/* ML Components */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Brain className="text-purple-400" size={18} />
          ML Pipeline Components
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-[#1a1a2e]">
                <th className="pb-3 font-medium">Component</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Last Run</th>
                <th className="pb-3 font-medium">Avg Latency</th>
                <th className="pb-3 font-medium">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {mockComponents.map((component) => (
                <tr key={component.name} className="border-b border-[#1a1a2e] last:border-0">
                  <td className="py-3 font-medium text-sm">{component.name}</td>
                  <td className="py-3 text-sm text-gray-400">{component.category}</td>
                  <td className="py-3">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full flex items-center gap-1 w-fit',
                      component.status === 'operational' && 'bg-green-500/20 text-green-400',
                      component.status === 'degraded' && 'bg-yellow-500/20 text-yellow-400',
                      component.status === 'down' && 'bg-red-500/20 text-red-400'
                    )}>
                      {component.status === 'operational' && <CheckCircle size={10} />}
                      {component.status === 'degraded' && <AlertCircle size={10} />}
                      {component.status === 'down' && <XCircle size={10} />}
                      {component.status}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-400">{component.lastRun}</td>
                  <td className="py-3">
                    <span className={cn(
                      'text-sm',
                      component.avgLatency < 200 ? 'text-green-400' : component.avgLatency < 500 ? 'text-yellow-400' : 'text-orange-400'
                    )}>
                      {component.avgLatency}ms
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={cn(
                      'text-sm font-medium',
                      component.successRate >= 99 ? 'text-green-400' : component.successRate >= 95 ? 'text-yellow-400' : 'text-red-400'
                    )}>
                      {component.successRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Endpoints */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Code className="text-blue-400" size={18} />
            API Endpoints
          </h2>
          <div className="space-y-3">
            {mockAPIEndpoints.map((endpoint) => (
              <div key={endpoint.path} className="bg-[#0a0a0f] rounded-lg p-3 border border-[#1a1a2e]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded font-mono',
                      endpoint.method === 'GET' && 'bg-green-500/20 text-green-400',
                      endpoint.method === 'POST' && 'bg-blue-500/20 text-blue-400',
                      endpoint.method === 'PUT' && 'bg-yellow-500/20 text-yellow-400',
                      endpoint.method === 'DELETE' && 'bg-red-500/20 text-red-400'
                    )}>
                      {endpoint.method}
                    </span>
                    <span className="text-sm font-mono">{endpoint.path}</span>
                  </div>
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    endpoint.status === 'healthy' && 'bg-green-400',
                    endpoint.status === 'warning' && 'bg-yellow-400',
                    endpoint.status === 'critical' && 'bg-red-400'
                  )} />
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="text-gray-500">Avg</div>
                    <div>{endpoint.avgLatency}ms</div>
                  </div>
                  <div>
                    <div className="text-gray-500">P99</div>
                    <div>{endpoint.p99Latency}ms</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Errors</div>
                    <div className={endpoint.errorRate > 1 ? 'text-red-400' : ''}>{endpoint.errorRate}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Req/min</div>
                    <div>{endpoint.requestsPerMin}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Errors */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <h2 className="font-semibold mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="text-red-400" size={18} />
              Recent Errors
            </span>
            <span className="text-xs text-gray-400">{mockErrors.length} in last 24h</span>
          </h2>
          <div className="space-y-3">
            {mockErrors.map((error) => (
              <div key={error.id} className={cn(
                'bg-[#0a0a0f] rounded-lg p-3 border',
                error.severity === 'error' && 'border-red-500/30',
                error.severity === 'warning' && 'border-yellow-500/30',
                error.severity === 'info' && 'border-blue-500/30'
              )}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    error.severity === 'error' && 'bg-red-500/20 text-red-400',
                    error.severity === 'warning' && 'bg-yellow-500/20 text-yellow-400',
                    error.severity === 'info' && 'bg-blue-500/20 text-blue-400'
                  )}>
                    {error.severity}
                  </span>
                  <span className="text-xs text-gray-500">{error.timestamp}</span>
                </div>
                <div className="text-sm font-medium mb-1">{error.message}</div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{error.service} → {error.endpoint}</span>
                  {error.count > 1 && (
                    <span className="text-orange-400">×{error.count}</span>
                  )}
                </div>
              </div>
            ))}
            
            {mockErrors.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto text-green-400 mb-2" size={32} />
                <p className="text-gray-400 text-sm">No errors in the last 24 hours</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response Time Chart */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <h2 className="font-semibold mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="text-purple-400" size={18} />
            Response Time (Last Hour)
          </span>
          <span className="text-xs text-gray-400">Avg: 340ms | P99: 890ms</span>
        </h2>
        <LatencyChart />
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>-1h</span>
          <span>-30m</span>
          <span>Now</span>
        </div>
      </div>
    </div>
  );
}
























































































