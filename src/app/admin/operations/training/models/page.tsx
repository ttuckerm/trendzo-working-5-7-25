'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  CheckCircle,
  ArrowUpRight,
  GitBranch,
  Calendar,
  Target,
  Zap,
  RefreshCw,
  Upload,
  Archive,
  BarChart3,
  TrendingUp,
  ChevronRight
} from 'lucide-react';

interface ModelVersion {
  id: string;
  version: string;
  created_at: string;
  status: 'active' | 'testing' | 'archived';
  training_job_id: string;
  metrics: {
    accuracy: number;
    mae: number;
    rmse: number;
    calibration: number;
    feature_importance?: Record<string, number>;
  };
  config: {
    model_type: string;
    hyperparameters: Record<string, any>;
    train_samples: number;
  };
}

const getFeatureCategory = (featureName: string): { label: string; color: string } => {
  const categoryMap: Record<string, { label: string; color: string }> = {
    hook_strength: { label: 'Viral Patterns', color: 'bg-purple-500/20 text-purple-400' },
    curiosity_word_count: { label: 'Viral Patterns', color: 'bg-purple-500/20 text-purple-400' },
    shock_word_count: { label: 'Viral Patterns', color: 'bg-purple-500/20 text-purple-400' },
    emotional_peak_intensity: { label: 'Emotional', color: 'bg-red-500/20 text-red-400' },
    sentiment_polarity: { label: 'Emotional', color: 'bg-red-500/20 text-red-400' },
    positive_emotion_count: { label: 'Emotional', color: 'bg-red-500/20 text-red-400' },
    pacing_score: { label: 'Content', color: 'bg-yellow-500/20 text-yellow-400' },
    visual_complexity: { label: 'Content', color: 'bg-yellow-500/20 text-yellow-400' },
    text_sentiment: { label: 'Content', color: 'bg-yellow-500/20 text-yellow-400' },
    posting_time_score: { label: 'Timing', color: 'bg-indigo-500/20 text-indigo-400' },
    upload_hour: { label: 'Timing', color: 'bg-indigo-500/20 text-indigo-400' },
    creator_baseline_dps: { label: 'Creator', color: 'bg-green-500/20 text-green-400' },
    trend_alignment_score: { label: 'Trend', color: 'bg-blue-500/20 text-blue-400' },
    audio_energy: { label: 'Audio', color: 'bg-orange-500/20 text-orange-400' },
  };
  
  for (const [key, value] of Object.entries(categoryMap)) {
    if (featureName.toLowerCase().includes(key.toLowerCase().replace(/_/g, ''))) {
      return value;
    }
    if (featureName.toLowerCase() === key.toLowerCase()) {
      return value;
    }
  }
  
  if (featureName.toLowerCase().includes('hook') || featureName.toLowerCase().includes('curiosity') || featureName.toLowerCase().includes('shock')) {
    return { label: 'Viral Patterns', color: 'bg-purple-500/20 text-purple-400' };
  }
  if (featureName.toLowerCase().includes('emotion') || featureName.toLowerCase().includes('sentiment')) {
    return { label: 'Emotional', color: 'bg-red-500/20 text-red-400' };
  }
  if (featureName.toLowerCase().includes('pacing') || featureName.toLowerCase().includes('visual') || featureName.toLowerCase().includes('content')) {
    return { label: 'Content', color: 'bg-yellow-500/20 text-yellow-400' };
  }
  if (featureName.toLowerCase().includes('time') || featureName.toLowerCase().includes('hour') || featureName.toLowerCase().includes('posting')) {
    return { label: 'Timing', color: 'bg-indigo-500/20 text-indigo-400' };
  }
  if (featureName.toLowerCase().includes('creator') || featureName.toLowerCase().includes('baseline')) {
    return { label: 'Creator', color: 'bg-green-500/20 text-green-400' };
  }
  if (featureName.toLowerCase().includes('trend')) {
    return { label: 'Trend', color: 'bg-blue-500/20 text-blue-400' };
  }
  if (featureName.toLowerCase().includes('audio') || featureName.toLowerCase().includes('energy')) {
    return { label: 'Audio', color: 'bg-orange-500/20 text-orange-400' };
  }
  
  return { label: 'Feature', color: 'bg-gray-500/20 text-gray-400' };
};

export default function ModelVersionsPage() {
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelVersion | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/training/models');
      const data = await response.json();
      setModels(data.models || []);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
    setLoading(false);
  };

  const handleDeploy = async (modelId: string) => {
    setDeploying(modelId);
    try {
      const response = await fetch(`/api/training/models/${modelId}/deploy`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        await fetchModels();
      }
    } catch (error) {
      console.error('Deploy error:', error);
    }
    setDeploying(null);
  };

  const handleArchive = async (modelId: string) => {
    try {
      await fetch(`/api/training/models/${modelId}/archive`, { method: 'POST' });
      await fetchModels();
    } catch (error) {
      console.error('Failed to archive model:', error);
    }
  };

  const activeModel = models.find(m => m.status === 'active');
  const testingModels = models.filter(m => m.status === 'testing');
  const archivedModels = models.filter(m => m.status === 'archived');

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.75) return 'text-green-400';
    if (accuracy >= 0.65) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusBadge = (status: ModelVersion['status']) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border-green-500/50',
      testing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      archived: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    };
    const icons = {
      active: <Zap className="w-3 h-3" />,
      testing: <Target className="w-3 h-3" />,
      archived: <Archive className="w-3 h-3" />
    };
    return (
      <Badge className={`${styles[status]} flex items-center gap-1`}>
        {icons[status]}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Model Versions</h1>
          <p className="text-gray-400">Compare and deploy prediction models</p>
        </div>
        <Button variant="outline" onClick={fetchModels}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Active Model Highlight */}
      {activeModel ? (
        <Card className="bg-green-900/30 border-green-500/50">
          <CardHeader>
            <CardTitle className="text-green-300 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Active Model in Production
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-800/50">
                  <Layers className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{activeModel.version}</p>
                  <p className="text-green-300 text-sm">
                    Deployed {new Date(activeModel.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-8">
                <div className="text-center">
                  <p className={`text-2xl font-bold ${getAccuracyColor(activeModel.metrics.accuracy)}`}>
                    {(activeModel.metrics.accuracy * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-green-300">Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {activeModel.metrics.mae.toFixed(3)}
                  </p>
                  <p className="text-xs text-gray-400">MAE</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {activeModel.metrics.calibration.toFixed(3)}
                  </p>
                  <p className="text-xs text-gray-400">Calibration</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {activeModel.config.train_samples.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Training Samples</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-yellow-900/30 border-yellow-500/50">
          <CardContent className="p-6 text-center">
            <Zap className="w-12 h-12 mx-auto text-yellow-400 mb-3" />
            <p className="text-yellow-300 font-medium">No Active Model</p>
            <p className="text-yellow-300/70 text-sm">Deploy a model to start making predictions</p>
          </CardContent>
        </Card>
      )}

      {/* Feature Importance Section */}
      {activeModel && activeModel.metrics.feature_importance && Object.keys(activeModel.metrics.feature_importance).length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Feature Importance (Top 10)
            </CardTitle>
            <Link 
              href="#" 
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              View All 119 Features <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(activeModel.metrics.feature_importance)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([featureName, importance], index) => {
                  const category = getFeatureCategory(featureName);
                  const maxImportance = Math.max(...Object.values(activeModel.metrics.feature_importance || {}));
                  const barWidth = maxImportance > 0 ? (importance / maxImportance) * 100 : 0;
                  
                  return (
                    <div key={featureName} className="flex items-center gap-4">
                      <span className="w-6 text-sm text-gray-500 font-medium">{index + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-white">{featureName}</span>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-0.5 rounded ${category.color}`}>
                              {category.label}
                            </span>
                            <span className="text-sm text-gray-300 font-medium w-16 text-right">
                              {(importance * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {Object.keys(activeModel.metrics.feature_importance).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <BarChart3 className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                <p>No feature importance data available</p>
                <p className="text-sm text-gray-500">Train a new model to generate feature importance</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-white">{models.length}</p>
            <p className="text-sm text-gray-400">Total Versions</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-400">
              {models.filter(m => m.status === 'active').length}
            </p>
            <p className="text-sm text-gray-400">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">{testingModels.length}</p>
            <p className="text-sm text-gray-400">Testing</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-400">{archivedModels.length}</p>
            <p className="text-sm text-gray-400">Archived</p>
          </CardContent>
        </Card>
      </div>

      {/* Model Comparison Table */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            All Versions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No models trained yet</p>
              <p className="text-gray-500 text-sm">Complete a training job to create a model version</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-400 font-medium">Version</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Status</th>
                    <th className="text-center p-3 text-gray-400 font-medium">Accuracy</th>
                    <th className="text-center p-3 text-gray-400 font-medium">MAE</th>
                    <th className="text-center p-3 text-gray-400 font-medium">RMSE</th>
                    <th className="text-center p-3 text-gray-400 font-medium">Calibration</th>
                    <th className="text-center p-3 text-gray-400 font-medium">Samples</th>
                    <th className="text-center p-3 text-gray-400 font-medium">Date</th>
                    <th className="text-right p-3 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model, index) => {
                    // Calculate if this model is better than the previous
                    const prevModel = index < models.length - 1 ? models[index + 1] : null;
                    const isImproved = prevModel && model.metrics.accuracy > prevModel.metrics.accuracy;
                    
                    return (
                      <tr 
                        key={model.id} 
                        className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${
                          model.status === 'active' ? 'bg-green-900/10' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-gray-400" />
                            <span className="text-white font-medium">{model.version}</span>
                            {isImproved && (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500 ml-6">
                            {model.config.model_type}
                          </span>
                        </td>
                        <td className="p-3">
                          {getStatusBadge(model.status)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-bold ${getAccuracyColor(model.metrics.accuracy)}`}>
                            {(model.metrics.accuracy * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-center text-white">
                          {model.metrics.mae.toFixed(3)}
                        </td>
                        <td className="p-3 text-center text-white">
                          {model.metrics.rmse.toFixed(3)}
                        </td>
                        <td className="p-3 text-center text-white">
                          {model.metrics.calibration.toFixed(3)}
                        </td>
                        <td className="p-3 text-center text-gray-400">
                          {model.config.train_samples.toLocaleString()}
                        </td>
                        <td className="p-3 text-center text-gray-400">
                          {new Date(model.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setSelectedModel(model)}
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                            {model.status !== 'active' && model.status !== 'archived' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeploy(model.id)}
                                disabled={deploying === model.id}
                                className="border-green-500 text-green-400 hover:bg-green-500/20"
                              >
                                {deploying === model.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Upload className="w-4 h-4 mr-1" />
                                    Deploy
                                  </>
                                )}
                              </Button>
                            )}
                            {model.status !== 'active' && model.status !== 'archived' && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleArchive(model.id)}
                                className="text-gray-400 hover:text-gray-300"
                              >
                                <Archive className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Details Modal */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-800 border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Layers className="w-5 h-5" />
                {selectedModel.version} Details
              </CardTitle>
              <Button variant="ghost" onClick={() => setSelectedModel(null)}>✕</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status & Basic Info */}
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedModel.status)}
                <span className="text-gray-400">
                  Created {new Date(selectedModel.created_at).toLocaleString()}
                </span>
              </div>

              {/* Metrics */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-gray-700/50 text-center">
                    <p className={`text-xl font-bold ${getAccuracyColor(selectedModel.metrics.accuracy)}`}>
                      {(selectedModel.metrics.accuracy * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-400">Accuracy</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-700/50 text-center">
                    <p className="text-xl font-bold text-white">{selectedModel.metrics.mae.toFixed(4)}</p>
                    <p className="text-xs text-gray-400">MAE</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-700/50 text-center">
                    <p className="text-xl font-bold text-white">{selectedModel.metrics.rmse.toFixed(4)}</p>
                    <p className="text-xs text-gray-400">RMSE</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-700/50 text-center">
                    <p className="text-xl font-bold text-white">{selectedModel.metrics.calibration.toFixed(4)}</p>
                    <p className="text-xs text-gray-400">Calibration</p>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Training Configuration</h3>
                <div className="p-3 rounded-lg bg-gray-700/50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Model Type:</span>
                      <span className="text-white ml-2">{selectedModel.config.model_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Training Samples:</span>
                      <span className="text-white ml-2">{selectedModel.config.train_samples.toLocaleString()}</span>
                    </div>
                    {Object.entries(selectedModel.config.hyperparameters || {}).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-400">{key}:</span>
                        <span className="text-white ml-2">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature Importance (if available) */}
              {selectedModel.metrics.feature_importance && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Top Feature Importance</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedModel.metrics.feature_importance)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10)
                      .map(([feature, importance]) => (
                        <div key={feature} className="flex items-center gap-3">
                          <span className="text-sm text-gray-300 w-40 truncate">{feature}</span>
                          <div className="flex-1 h-4 bg-gray-700 rounded overflow-hidden">
                            <div 
                              className="h-full bg-blue-500"
                              style={{ width: `${importance * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 w-16 text-right">
                            {(importance * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                {selectedModel.status !== 'active' && selectedModel.status !== 'archived' && (
                  <Button 
                    onClick={() => {
                      handleDeploy(selectedModel.id);
                      setSelectedModel(null);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Deploy to Production
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedModel(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}







