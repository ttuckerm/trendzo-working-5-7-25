'use client';

import React from 'react';
import { 
  TrendingUp, 
  Zap, 
  Clock, 
  Target, 
  ArrowRight,
  BarChart3,
  Settings,
  Play
} from 'lucide-react';

/**
 * Focus Mode - Essential daily workflow interface
 * Shows most important metrics and quick actions
 */
export const FocusMode: React.FC = () => {
  // Mock data - will be connected to real APIs later
  const quickActions = [
    {
      title: 'Create Content',
      description: 'Start new viral content creation',
      icon: Play,
      action: () => window.open('/admin/studio', '_blank'),
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Recipe Book',
      description: 'Access templates & optimization',
      icon: Target,
      action: () => window.open('/admin/recipe-book', '_blank'),
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Analytics',
      description: 'View performance metrics',
      icon: BarChart3,
      action: () => window.open('/admin/operations-center', '_blank'),
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const essentialMetrics = [
    {
      label: 'Active Projects',
      value: '12',
      trend: '+3',
      trendPositive: true
    },
    {
      label: 'Success Rate',
      value: '85%',
      trend: '+5%',
      trendPositive: true
    },
    {
      label: 'Processing',
      value: '4',
      trend: '-1',
      trendPositive: false
    }
  ];

  const recentActivity = [
    'Video "Tech Trends 2024" completed processing',
    'New template "Viral Hook" added to Recipe Book',
    'Analytics report generated for last 7 days',
    'System optimization completed successfully'
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Focus Mode</h2>
            <p className="text-gray-400">Your essential workflow dashboard</p>
          </div>
          <div className="flex items-center space-x-2 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm">System Healthy</span>
          </div>
        </div>

        {/* Essential Metrics */}
        <div className="grid grid-cols-3 gap-4">
          {essentialMetrics.map((metric, index) => (
            <div
              key={index}
              className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{metric.label}</span>
                <div className={`flex items-center space-x-1 text-xs ${
                  metric.trendPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  <TrendingUp size={12} className={metric.trendPositive ? '' : 'rotate-180'} />
                  <span>{metric.trend}</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Zap size={20} className="mr-2 text-yellow-400" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className={`
                    group relative p-6 rounded-xl border border-gray-700/30
                    bg-gradient-to-br ${action.color} opacity-90
                    hover:opacity-100 hover:scale-105
                    transform transition-all duration-200
                    text-left
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon size={24} className="text-white" />
                    <ArrowRight 
                      size={16} 
                      className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" 
                    />
                  </div>
                  <h4 className="font-semibold text-white mb-1">{action.title}</h4>
                  <p className="text-sm text-white/80">{action.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Clock size={20} className="mr-2 text-blue-400" />
            Recent Activity
          </h3>
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/30">
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{activity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Suggestions */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Settings size={20} className="mr-2 text-purple-400" />
            Smart Suggestions
          </h3>
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
            <div className="space-y-2">
              <p className="text-white font-medium">🚀 Optimization Opportunity</p>
              <p className="text-gray-300 text-sm">
                Your content performs best between 2-4 PM. Consider scheduling your next upload during this window.
              </p>
              <button className="mt-2 text-purple-400 hover:text-purple-300 text-sm font-medium">
                View Full Analysis →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};