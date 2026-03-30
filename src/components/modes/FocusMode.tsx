'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUnifiedShell } from '@/components/unified-shell/UnifiedShell'
import { useModeTransitions } from '@/hooks/unified-interface/useModeManager'
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  BarChart3, 
  Target, 
  AlertCircle,
  Play,
  Settings,
  RefreshCw
} from 'lucide-react'

// Focus Mode Component - Clean Daily Interface
export default function FocusMode() {
  const { state, trackUserAction } = useUnifiedShell()
  const { getEnterAnimation } = useModeTransitions()

  useEffect(() => {
    trackUserAction({
      id: `focus_mode_enter_${Date.now()}`,
      type: 'navigate',
      componentId: 'focus_mode',
      timestamp: new Date(),
      metadata: { mode: 'focus' }
    })
  }, [trackUserAction])

  return (
    <div className="focus-mode h-full p-6 space-y-6">
      {/* Primary Workflow Dashboard */}
      <motion.div 
        {...getEnterAnimation(0)}
        className="primary-workflow grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <SystemHealthWidget />
        <PredictionSummaryWidget />
        <QuickDeployWidget />
      </motion.div>

      {/* Essential Metrics Row */}
      <motion.div 
        {...getEnterAnimation(100)}
        className="essential-metrics grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MetricCard 
          title="System Performance"
          value={`${state.provingGrounds.systemPerformance.cpu}%`}
          trend="+2.3%"
          icon={Activity}
          color="green"
        />
        <MetricCard 
          title="Active Templates"
          value="127"
          trend="+12"
          icon={Target}
          color="blue"
        />
        <MetricCard 
          title="Viral Success Rate"
          value="89.3%"
          trend="+4.1%"
          icon={TrendingUp}
          color="purple"
        />
        <MetricCard 
          title="Processing Queue"
          value="23"
          trend="-5"
          icon={RefreshCw}
          color="orange"
        />
      </motion.div>

      {/* Quick Actions Bar */}
      <motion.div 
        {...getEnterAnimation(200)}
        className="quick-actions"
      >
        <QuickActionsBar />
      </motion.div>

      {/* Contextual Insights */}
      <motion.div 
        {...getEnterAnimation(300)}
        className="contextual-insights grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <RecentActivityPanel />
        <SmartSuggestionsPanel />
      </motion.div>
    </div>
  )
}

// System Health Widget - Always visible primary component
function SystemHealthWidget() {
  const { state, switchMode } = useUnifiedShell()
  const [expanded, setExpanded] = useState(false)

  const overallHealth = (
    state.systemMetrics.overall.performance +
    state.systemMetrics.overall.reliability +
    state.systemMetrics.overall.uptime
  ) / 3

  const healthColor = overallHealth >= 90 ? 'green' : overallHealth >= 75 ? 'yellow' : 'red'
  const healthStatus = overallHealth >= 90 ? 'Excellent' : overallHealth >= 75 ? 'Good' : 'Attention Needed'

  return (
    <div className="system-health-widget bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            healthColor === 'green' ? 'bg-green-500' : 
            healthColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <h3 className="text-lg font-semibold">System Health</h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{Math.round(overallHealth)}%</span>
          <span className={`text-sm font-medium ${
            healthColor === 'green' ? 'text-green-400' : 
            healthColor === 'yellow' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {healthStatus}
          </span>
        </div>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 pt-2 border-t border-gray-800"
          >
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Performance</span>
              <span className="text-white">{state.systemMetrics.overall.performance}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Uptime</span>
              <span className="text-white">{state.systemMetrics.overall.uptime}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Reliability</span>
              <span className="text-white">{state.systemMetrics.overall.reliability}%</span>
            </div>
          </motion.div>
        )}

        <button
          onClick={() => switchMode('deepdive')}
          className="w-full mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View Detailed Analytics →
        </button>
      </div>
    </div>
  )
}

// Prediction Summary Widget - Core workflow component
function PredictionSummaryWidget() {
  const { state, switchMode } = useUnifiedShell()

  const mockPredictions = {
    totalAnalyzed: 1247,
    viralProbability: 92.3,
    trending: 15,
    recommendations: 8
  }

  return (
    <div className="prediction-summary-widget bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-semibold">Viral Predictions</h3>
        </div>
        <div className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">
          Live
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-purple-400">{mockPredictions.viralProbability}%</div>
            <div className="text-xs text-gray-400">Avg. Viral Probability</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{mockPredictions.trending}</div>
            <div className="text-xs text-gray-400">Trending Now</div>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-800">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Videos Analyzed</span>
            <span className="text-white">{mockPredictions.totalAnalyzed.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">New Recommendations</span>
            <span className="text-blue-400">{mockPredictions.recommendations}</span>
          </div>
        </div>

        <button
          onClick={() => switchMode('deepdive')}
          className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-sm transition-colors"
        >
          Open Recipe Book
        </button>
      </div>
    </div>
  )
}

// Quick Deploy Widget - Template deployment access
function QuickDeployWidget() {
  const { state, switchMode } = useUnifiedShell()
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success'>('idle')

  const handleQuickDeploy = () => {
    setDeployStatus('deploying')
    setTimeout(() => {
      setDeployStatus('success')
      setTimeout(() => setDeployStatus('idle'), 2000)
    }, 1500)
  }

  return (
    <div className="quick-deploy-widget bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-orange-500" />
          <h3 className="text-lg font-semibold">Quick Deploy</h3>
        </div>
        <div className={`text-xs px-2 py-1 rounded ${
          deployStatus === 'idle' ? 'text-gray-400 bg-gray-700' :
          deployStatus === 'deploying' ? 'text-orange-400 bg-orange-500/20' :
          'text-green-400 bg-green-500/20'
        }`}>
          {deployStatus === 'idle' ? 'Ready' :
           deployStatus === 'deploying' ? 'Deploying' : 'Success'}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-800 rounded p-3">
          <div className="text-sm font-medium text-white mb-1">Top Framework</div>
          <div className="text-xs text-gray-400">Authority Hook Pattern</div>
          <div className="text-xs text-green-400 mt-1">89.2% Success Rate</div>
        </div>

        <button
          onClick={handleQuickDeploy}
          disabled={deployStatus !== 'idle'}
          className={`w-full py-3 px-4 rounded font-medium transition-all ${
            deployStatus === 'idle' 
              ? 'bg-orange-600 hover:bg-orange-700 text-white' 
              : deployStatus === 'deploying'
              ? 'bg-orange-600/50 text-orange-200 cursor-not-allowed'
              : 'bg-green-600 text-white'
          }`}
        >
          {deployStatus === 'idle' && (
            <div className="flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />
              Deploy Template
            </div>
          )}
          {deployStatus === 'deploying' && (
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Deploying...
            </div>
          )}
          {deployStatus === 'success' && (
            <div className="flex items-center justify-center gap-2">
              <Target className="w-4 h-4" />
              Deployed Successfully
            </div>
          )}
        </button>

        <button
          onClick={() => switchMode('deepdive')}
          className="w-full text-xs text-orange-400 hover:text-orange-300 transition-colors"
        >
          Access Full Armory →
        </button>
      </div>
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string
  trend: string
  icon: React.ComponentType<any>
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red'
}

function MetricCard({ title, value, trend, icon: Icon, color }: MetricCardProps) {
  const colorClasses = {
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20'
  }

  const trendColor = trend.startsWith('+') ? 'text-green-400' : 'text-red-400'

  return (
    <div className={`metric-card p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        <span className={`text-xs font-medium ${trendColor}`}>{trend}</span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-400">{title}</div>
    </div>
  )
}

// Quick Actions Bar
function QuickActionsBar() {
  const actions = [
    { id: 'new-template', label: 'New Template', icon: Target, color: 'blue' },
    { id: 'run-analysis', label: 'Run Analysis', icon: BarChart3, color: 'purple' },
    { id: 'quick-test', label: 'Quick Test', icon: Play, color: 'green' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'gray' }
  ]

  return (
    <div className="quick-actions-bar bg-gray-900 rounded-lg p-4 border border-gray-800">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Quick Actions</h3>
      <div className="flex gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            className={`flex-1 p-3 rounded-lg border transition-all hover:scale-105 ${
              action.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20' :
              action.color === 'purple' ? 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20' :
              action.color === 'green' ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20' :
              'bg-gray-800 border-gray-700 hover:bg-gray-700'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <action.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{action.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// Recent Activity Panel
function RecentActivityPanel() {
  const { state } = useUnifiedShell()

  const recentActivities = [
    { id: 1, action: 'Template deployed', time: '2 min ago', status: 'success' },
    { id: 2, action: 'Analysis completed', time: '5 min ago', status: 'success' },
    { id: 3, action: 'Framework updated', time: '12 min ago', status: 'info' },
    { id: 4, action: 'Alert resolved', time: '18 min ago', status: 'warning' }
  ]

  return (
    <div className="recent-activity-panel bg-gray-900 rounded-lg p-6 border border-gray-800">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                activity.status === 'success' ? 'bg-green-500' :
                activity.status === 'warning' ? 'bg-yellow-500' :
                activity.status === 'info' ? 'bg-blue-500' : 'bg-gray-500'
              }`} />
              <span className="text-sm text-white">{activity.action}</span>
            </div>
            <span className="text-xs text-gray-400">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Smart Suggestions Panel
function SmartSuggestionsPanel() {
  const suggestions = [
    { id: 1, title: 'Optimize peak hour deployments', impact: 'High', type: 'performance' },
    { id: 2, title: 'Update framework preferences', impact: 'Medium', type: 'enhancement' },
    { id: 3, title: 'Review trending templates', impact: 'Medium', type: 'analysis' }
  ]

  return (
    <div className="smart-suggestions-panel bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Smart Suggestions</h3>
        <div className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
          AI Powered
        </div>
      </div>
      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="bg-gray-800 rounded p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white">{suggestion.title}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                suggestion.impact === 'High' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {suggestion.impact}
              </span>
            </div>
            <div className="text-xs text-gray-400 capitalize">{suggestion.type}</div>
          </div>
        ))}
      </div>
    </div>
  )
}