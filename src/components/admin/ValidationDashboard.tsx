'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ValidationMetrics {
  overall_accuracy: number;
  total_predictions: number;
  validated_predictions: number;
  pending_validations: number;
  accuracy_trend: number;
  last_validation_run: string;
  recent_validations: ValidationResult[];
}

interface ValidationResult {
  prediction_id: string;
  video_id: string;
  predicted_score: number;
  actual_score: number;
  accuracy_percentage: number;
  is_accurate: boolean;
  validation_timestamp: string;
  platform: string;
}

export function ValidationDashboard() {
  const [metrics, setMetrics] = useState<ValidationMetrics | null>(null);
  const [isRunningValidation, setIsRunningValidation] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);

  useEffect(() => {
    fetchValidationMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchValidationMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchValidationMetrics = async () => {
    try {
      const response = await fetch('/api/admin/prediction-validation/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch validation metrics:', error);
    }
  };

  const runValidationCycle = async () => {
    setIsRunningValidation(true);
    try {
      const response = await fetch('/api/admin/prediction-validation/trigger', {
        method: 'POST'
      });
      const results = await response.json();
      setValidationResults(results);
      await fetchValidationMetrics(); // Refresh metrics
    } catch (error) {
      console.error('Validation cycle failed:', error);
    } finally {
      setIsRunningValidation(false);
    }
  };

  const getAccuracyStatus = (accuracy: number) => {
    if (accuracy >= 90) return { color: 'green', status: '🎯 TARGET ACHIEVED' };
    if (accuracy >= 85) return { color: 'yellow', status: '🔥 CLOSE TO TARGET' };
    if (accuracy >= 80) return { color: 'orange', status: '⚠️ NEEDS IMPROVEMENT' };
    return { color: 'red', status: '❌ CRITICAL' };
  };

  if (!metrics) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const accuracyStatus = getAccuracyStatus(metrics.overall_accuracy);

  return (
    <div className="validation-dashboard p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🎯 Prediction Validation System</h1>
          <p className="text-gray-600 mt-2">Real-time accuracy tracking for ≥90% target</p>
        </div>
        <Button 
          onClick={runValidationCycle}
          disabled={isRunningValidation}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunningValidation ? 'Running Validation...' : 'Run Validation Cycle'}
        </Button>
      </div>

      {/* Accuracy Overview */}
      <div className="accuracy-overview grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 System Accuracy
              <Badge variant={accuracyStatus.color === 'green' ? 'default' : 'secondary'}>
                {accuracyStatus.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl font-bold mb-2" style={{ color: accuracyStatus.color }}>
                {metrics.overall_accuracy.toFixed(1)}%
              </div>
              <div className="text-lg text-gray-600 mb-4">
                {metrics.validated_predictions}/{metrics.total_predictions} predictions validated
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="h-4 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(metrics.overall_accuracy, 100)}%`,
                    backgroundColor: accuracyStatus.color
                  }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Target: 90% • Current: {metrics.overall_accuracy.toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📈 Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {metrics.accuracy_trend > 0 ? '+' : ''}{metrics.accuracy_trend.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">vs last period</div>
              <div className="mt-2">
                {metrics.accuracy_trend > 0 ? '📈' : metrics.accuracy_trend < 0 ? '📉' : '➡️'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⏱️ Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{metrics.pending_validations}</div>
              <div className="text-sm text-gray-600">awaiting validation</div>
              <div className="mt-2 text-xs text-gray-500">
                48hr window required
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Validations */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Recent Validation Results</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.recent_validations.length > 0 ? (
            <div className="space-y-3">
              {metrics.recent_validations.slice(0, 10).map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${result.is_accurate ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <div className="font-medium">{result.platform} Video</div>
                      <div className="text-sm text-gray-600">
                        Predicted: {result.predicted_score} | Actual: {result.actual_score}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{result.accuracy_percentage.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">
                      {new Date(result.validation_timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No validations completed yet. Run validation cycle to see results.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">✅ Latest Validation Cycle Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{validationResults.validated}</div>
                <div className="text-sm">Validated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{validationResults.failed}</div>
                <div className="text-sm">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{validationResults.accuracy_update?.toFixed(1)}%</div>
                <div className="text-sm">Updated Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Status Banner */}
      {metrics.overall_accuracy < 90 && (
        <Card className="border-yellow-400 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-bold text-yellow-800">Accuracy Below Target</div>
                <div className="text-yellow-700">
                  Need {(90 - metrics.overall_accuracy).toFixed(1)}% improvement to reach 90% target.
                  Run more validation cycles and review prediction algorithms.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}