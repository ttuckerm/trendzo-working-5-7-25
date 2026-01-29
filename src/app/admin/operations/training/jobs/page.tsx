'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Play,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Cpu,
  Target,
  TrendingUp,
  Settings,
  Trash2,
  Eye
} from 'lucide-react';

interface TrainingJob {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  model_type: string;
  started_at: string | null;
  completed_at: string | null;
  progress: number;
  config: {
    n_estimators?: number;
    max_depth?: number;
    learning_rate?: number;
    train_samples?: number;
    validation_samples?: number;
  };
  results: {
    accuracy: number;
    mae: number;
    rmse: number;
    calibration: number;
  } | null;
  error: string | null;
  created_at: string;
}

interface TrainingConfig {
  modelType: string;
  nEstimators: number;
  maxDepth: number;
  learningRate: number;
}

export default function TrainingJobsPage() {
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingJob, setStartingJob] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<TrainingConfig>({
    modelType: 'xgboost',
    nEstimators: 100,
    maxDepth: 6,
    learningRate: 0.1
  });

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/training/jobs');
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const handleStartTraining = async () => {
    setStartingJob(true);
    try {
      await fetch('/api/training/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelType: config.modelType,
          config: {
            n_estimators: config.nEstimators,
            max_depth: config.maxDepth,
            learning_rate: config.learningRate
          }
        })
      });
      await fetchJobs();
      setShowConfig(false);
    } catch (error) {
      console.error('Failed to start training:', error);
    }
    setStartingJob(false);
  };

  const getStatusBadge = (status: TrainingJob['status']) => {
    const styles = {
      queued: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      running: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      completed: 'bg-green-500/20 text-green-400 border-green-500/50',
      failed: 'bg-red-500/20 text-red-400 border-red-500/50'
    };
    const icons = {
      queued: <Clock className="w-3 h-3" />,
      running: <RefreshCw className="w-3 h-3 animate-spin" />,
      completed: <CheckCircle className="w-3 h-3" />,
      failed: <XCircle className="w-3 h-3" />
    };
    return (
      <Badge className={`${styles[status]} flex items-center gap-1`}>
        {icons[status]}
        {status}
      </Badge>
    );
  };

  const runningJob = jobs.find(j => j.status === 'running');
  const hasQueuedJobs = jobs.some(j => j.status === 'queued');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Training Jobs</h1>
          <p className="text-gray-400">Start and monitor model training runs</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
          <Button 
            onClick={handleStartTraining}
            disabled={startingJob || !!runningJob || hasQueuedJobs}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="w-4 h-4 mr-2" />
            {startingJob ? 'Starting...' : 'Start Training'}
          </Button>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Training Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Model Type</label>
                <select
                  value={config.modelType}
                  onChange={(e) => setConfig({ ...config, modelType: e.target.value })}
                  className="w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
                >
                  <option value="xgboost">XGBoost</option>
                  <option value="lightgbm">LightGBM</option>
                  <option value="random_forest">Random Forest</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">N Estimators</label>
                <Input
                  type="number"
                  value={config.nEstimators}
                  onChange={(e) => setConfig({ ...config, nEstimators: parseInt(e.target.value) || 100 })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Max Depth</label>
                <Input
                  type="number"
                  value={config.maxDepth}
                  onChange={(e) => setConfig({ ...config, maxDepth: parseInt(e.target.value) || 6 })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Learning Rate</label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.learningRate}
                  onChange={(e) => setConfig({ ...config, learningRate: parseFloat(e.target.value) || 0.1 })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Job */}
      {runningJob && (
        <Card className="bg-blue-900/30 border-blue-500/50">
          <CardHeader>
            <CardTitle className="text-blue-300 flex items-center gap-2">
              <Cpu className="w-5 h-5 animate-pulse" />
              Training in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-blue-300">Progress</span>
                <span className="text-blue-300">{runningJob.progress}%</span>
              </div>
              <Progress value={runningJob.progress} className="h-3" />
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Model</p>
                  <p className="text-white font-medium">{runningJob.model_type}</p>
                </div>
                <div>
                  <p className="text-gray-400">Train Samples</p>
                  <p className="text-white font-medium">{runningJob.config?.train_samples || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Started</p>
                  <p className="text-white font-medium">
                    {runningJob.started_at 
                      ? new Date(runningJob.started_at).toLocaleTimeString()
                      : '-'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">ETA</p>
                  <p className="text-white font-medium">~{Math.round((100 - runningJob.progress) * 0.5)}s</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-white">{jobs.length}</p>
            <p className="text-sm text-gray-400">Total Jobs</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-400">
              {jobs.filter(j => j.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-400">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">
              {jobs.filter(j => j.status === 'running').length}
            </p>
            <p className="text-sm text-gray-400">Running</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-400">
              {jobs.filter(j => j.status === 'failed').length}
            </p>
            <p className="text-sm text-gray-400">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Job History */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Job History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <Cpu className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No training jobs yet</p>
              <p className="text-gray-500 text-sm">Start a new training job to begin</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <div 
                  key={job.id}
                  className="p-4 rounded-lg bg-gray-700/50 border border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(job.status)}
                      <span className="text-white font-medium">{job.model_type}</span>
                      <span className="text-gray-400 text-sm font-mono">#{job.id.slice(0, 8)}</span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {job.completed_at 
                        ? new Date(job.completed_at).toLocaleString()
                        : job.started_at 
                          ? `Started ${new Date(job.started_at).toLocaleString()}`
                          : `Queued ${new Date(job.created_at).toLocaleString()}`
                      }
                    </span>
                  </div>

                  {/* Configuration */}
                  {job.config && (
                    <div className="flex gap-4 text-sm text-gray-400 mb-3">
                      {job.config.n_estimators && (
                        <span>Estimators: {job.config.n_estimators}</span>
                      )}
                      {job.config.max_depth && (
                        <span>Depth: {job.config.max_depth}</span>
                      )}
                      {job.config.learning_rate && (
                        <span>LR: {job.config.learning_rate}</span>
                      )}
                    </div>
                  )}

                  {job.status === 'completed' && job.results && (
                    <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-600">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-400">
                          <Target className="w-4 h-4" />
                          <span className="text-lg font-bold">{(job.results.accuracy * 100).toFixed(1)}%</span>
                        </div>
                        <p className="text-xs text-gray-400">Accuracy</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{job.results.mae.toFixed(3)}</p>
                        <p className="text-xs text-gray-400">MAE</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{job.results.rmse.toFixed(3)}</p>
                        <p className="text-xs text-gray-400">RMSE</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{job.results.calibration.toFixed(3)}</p>
                        <p className="text-xs text-gray-400">Calibration</p>
                      </div>
                    </div>
                  )}

                  {job.status === 'failed' && job.error && (
                    <div className="mt-3 p-2 rounded bg-red-900/30 text-red-300 text-sm flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {job.error}
                    </div>
                  )}

                  {job.status === 'running' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>
                  )}

                  {job.status === 'queued' && (
                    <div className="mt-3 p-2 rounded bg-yellow-900/30 text-yellow-300 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Waiting in queue...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



