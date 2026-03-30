'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SystemMetrics {
  current_accuracy: number;
  target_accuracy: number;
  accuracy_status: string;
  predictions_validated_today: number;
  predictions_pending_validation: number;
  videos_processed_today: number;
  uptime_percentage: number;
  avg_processing_time: number;
}

interface RecentPrediction {
  id: string;
  description: string;
  author: string;
  viral_probability: number;
  confidence: number;
  status: string;
  predicted_at: string;
}

interface AccuracyMetrics {
  overall_accuracy: number;
  high_confidence_accuracy: number;
  medium_confidence_accuracy: number;
  low_confidence_accuracy: number;
  accuracy_trend: string;
  total_validated: number;
}

interface ViralPredictionDashboardProps {
  className?: string;
}

const ViralPredictionDashboard = ({ className = '' }: ViralPredictionDashboardProps) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [recentPredictions, setRecentPredictions] = useState<RecentPrediction[]>([]);
  const [accuracyMetrics, setAccuracyMetrics] = useState<AccuracyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/viral-prediction/dashboard');
      
      if (!response.ok) {
        throw new Error(`Dashboard API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setMetrics(result.data.system_metrics);
        setRecentPredictions(result.data.live_feed.recent_predictions || []);
        setAccuracyMetrics(result.data.algorithm_validation);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger batch analysis
  const triggerBatchAnalysis = async () => {
    try {
      const response = await fetch('/api/viral-prediction/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_batch_analysis',
          data: { target_count: 1000 }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Batch analysis started! Job ID: ${result.data.job_id}`);
        fetchDashboardData(); // Refresh dashboard
      } else {
        alert(`Failed to start batch analysis: ${result.error}`);
      }
    } catch (error) {
      console.error('Batch analysis error:', error);
      alert('Failed to start batch analysis');
    }
  };

  // Start daily ingestion
  const startDailyIngestion = async () => {
    try {
      const response = await fetch('/api/viral-prediction/batch-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_daily_ingestion',
          data: { target_count: 1000, niches: ['all'] }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Daily ingestion started! Job ID: ${result.data.job_id}`);
        fetchDashboardData(); // Refresh dashboard
      } else {
        alert(`Failed to start daily ingestion: ${result.error}`);
      }
    } catch (error) {
      console.error('Daily ingestion error:', error);
      alert('Failed to start daily ingestion');
    }
  };

  // Set up real-time updates
  useEffect(() => {
    fetchDashboardData();

    // Set up refresh interval (every 30 seconds)
    const interval = setInterval(fetchDashboardData, 30000);
    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  if (loading) {
    return (
      <div className={`bg-gray-900 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-300">Loading viral prediction dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/30 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-red-400 text-lg font-semibold mb-2">Dashboard Error</h3>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EXCEEDING_TARGET': return 'text-green-400';
      case 'MEETING_TARGET': return 'text-blue-400';
      case 'IMPROVING': return 'text-yellow-400';
      case 'BELOW_TARGET': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'EXCEEDING_TARGET': return '🚀';
      case 'MEETING_TARGET': return '✅';
      case 'IMPROVING': return '📈';
      case 'BELOW_TARGET': return '⚠️';
      default: return '📊';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              🎯 Viral Prediction System
            </h2>
            <p className="text-gray-400">
              Real-time algorithm validation and performance monitoring
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={triggerBatchAnalysis}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              📊 Batch Analysis
            </button>
            <button
              onClick={startDailyIngestion}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              📥 Daily Ingestion
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      {accuracyMetrics && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            🎯 Algorithm Validation Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">
                {getStatusIcon(accuracyMetrics.accuracy_status)}
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {accuracyMetrics.current_accuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Current Accuracy</div>
              <div className={`text-sm mt-1 ${getStatusColor(accuracyMetrics.accuracy_status)}`}>
                Target: {accuracyMetrics.target_accuracy}%
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-2">📈</div>
              <div className="text-2xl font-bold text-white mb-1">
                {accuracyMetrics.predictions_validated}
              </div>
              <div className="text-sm text-gray-400">Predictions Validated</div>
              <div className="text-sm text-green-400 mt-1">
                {accuracyMetrics.total_predictions} Total
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-2">🔄</div>
              <div className="text-2xl font-bold text-white mb-1">
                {accuracyMetrics.accuracy_trend === 'improving' ? '↗️' : 
                 accuracyMetrics.accuracy_trend === 'declining' ? '↘️' : '→'}
              </div>
              <div className="text-sm text-gray-400">Accuracy Trend</div>
              <div className="text-sm text-blue-400 mt-1 capitalize">
                {accuracyMetrics.accuracy_trend}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Videos Processed Today</p>
                <p className="text-2xl font-bold text-white">{metrics.videos_processed_today.toLocaleString()}</p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">System Uptime</p>
                <p className="text-2xl font-bold text-green-400">{metrics.uptime_percentage.toFixed(1)}%</p>
              </div>
              <div className="text-2xl">⚡</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Processing Time</p>
                <p className="text-2xl font-bold text-blue-400">{metrics.avg_processing_time}ms</p>
              </div>
              <div className="text-2xl">⏱️</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Validations</p>
                <p className="text-2xl font-bold text-yellow-400">{metrics.predictions_pending_validation}</p>
              </div>
              <div className="text-2xl">⏳</div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Recent Predictions */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          🔮 Recent Viral Predictions
        </h3>
        <div className="space-y-3">
          {recentPredictions.slice(0, 5).map((prediction, index) => (
            <motion.div
              key={prediction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between bg-gray-800 rounded-lg p-4"
            >
              <div className="flex-1">
                <p className="text-white font-medium truncate">
                  {prediction.description || 'No description'}
                </p>
                <p className="text-gray-400 text-sm">
                  @{prediction.author} • {new Date(prediction.predicted_at).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-400">
                    {(prediction.viral_probability * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-400">Viral</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-400">
                    {(prediction.confidence * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-400">Confidence</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${
                  prediction.status === 'high_potential' ? 'bg-green-900 text-green-300' :
                  prediction.status === 'moderate_potential' ? 'bg-yellow-900 text-yellow-300' :
                  'bg-red-900 text-red-300'
                }`}>
                  {prediction.status.replace('_', ' ')}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Confidence Breakdown */}
      {accuracyMetrics && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            📊 Accuracy by Confidence Level
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-400 font-medium">High Confidence</span>
                <span className="text-sm text-gray-400">80%+</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {accuracyMetrics.high_confidence_accuracy?.toFixed(1) || 'N/A'}%
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-yellow-400 font-medium">Medium Confidence</span>
                <span className="text-sm text-gray-400">60-80%</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {accuracyMetrics.medium_confidence_accuracy?.toFixed(1) || 'N/A'}%
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-400 font-medium">Low Confidence</span>
                <span className="text-sm text-gray-400">&lt;60%</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {accuracyMetrics.low_confidence_accuracy?.toFixed(1) || 'N/A'}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="text-center text-gray-500 text-sm">
        🔄 Dashboard auto-refreshes every 30 seconds • Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default ViralPredictionDashboard;