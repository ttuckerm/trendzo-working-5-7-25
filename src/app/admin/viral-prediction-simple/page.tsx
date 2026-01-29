'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SimpleViralPredictionDashboard() {
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const analyzeVideo = async () => {
    if (!tiktokUrl) return;
    
    setIsAnalyzing(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/viral-prediction/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tiktokUrl })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResult(data);
        } else {
          alert('Analysis failed: ' + data.error);
        }
      } else {
        alert('Request failed');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Viral Prediction System</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Analyze TikTok Video</h2>
        <div className="flex gap-4">
          <Input
            type="url"
            placeholder="Enter TikTok URL..."
            value={tiktokUrl}
            onChange={(e) => setTiktokUrl(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={analyzeVideo} 
            disabled={isAnalyzing || !tiktokUrl}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </Card>

      {result && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Viral Score</p>
                <p className="text-2xl font-bold">{result.data?.viralScore?.toFixed(1)}/100</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Probability</p>
                <p className="text-2xl font-bold">{(result.data?.viralProbability * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Confidence</p>
                <p className="text-2xl font-bold capitalize">{result.data?.confidenceLevel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Data Type</p>
                <p className="text-2xl font-bold">{result.data?.isRealData ? 'Real' : 'Simulation'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Video Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Views</p>
                <p className="font-medium">{result.data?.videoMetrics?.views?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Likes</p>
                <p className="font-medium">{result.data?.videoMetrics?.likes?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Comments</p>
                <p className="font-medium">{result.data?.videoMetrics?.comments?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Shares</p>
                <p className="font-medium">{result.data?.videoMetrics?.shares?.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Frameworks Detected</h3>
            <div className="space-y-2">
              {result.data?.frameworkBreakdown?.slice(0, 5).map((framework, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span>{framework.frameworkName}</span>
                  <span className="font-medium">{(framework.score * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">God Mode Enhancements</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Psychological Multiplier</p>
                <p className="font-medium">{result.data?.godModeEnhancements?.psychologicalMultiplier?.toFixed(3)}x</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Production Quality</p>
                <p className="font-medium">{result.data?.godModeEnhancements?.productionQuality?.toFixed(3)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cultural Timing</p>
                <p className="font-medium">{result.data?.godModeEnhancements?.culturalTiming?.toFixed(3)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Enhancement</p>
                <p className="font-medium">{result.data?.godModeEnhancements?.totalEnhancement?.toFixed(3)}x</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">DPS Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Percentile Rank</p>
                <p className="font-medium">{result.data?.dpsAnalysis?.percentileRank?.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Performance</p>
                <p className="font-medium capitalize">{result.data?.dpsAnalysis?.relativePerformance}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cohort Size</p>
                <p className="font-medium">{result.data?.dpsAnalysis?.cohortSize} videos</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Peak Prediction</p>
                <p className="font-medium">{result.data?.dpsAnalysis?.velocityIndicators?.peakPrediction}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
            <ul className="space-y-2">
              {result.data?.recommendedActions?.map((action, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* XGBoost ML Prediction Section */}
          {result.data?.xgboost_prediction_data && (
            <Card className="p-6 border-2 border-green-500 bg-green-500/5">
              <h3 className="text-lg font-semibold mb-4 text-green-600">🧠 XGBoost ML Prediction</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">ML Predicted DPS</p>
                  <p className="text-2xl font-bold text-green-600">
                    {result.data.xgboost_prediction_data.predicted_dps?.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confidence</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(result.data.xgboost_prediction_data.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Model Version</p>
                  <p className="text-lg font-medium">
                    {result.data.xgboost_prediction_data.model_version}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Features Used</p>
                  <p className="text-lg font-medium">
                    {result.data.xgboost_prediction_data.features_provided}/{result.data.xgboost_prediction_data.features_total}
                  </p>
                </div>
              </div>

              {/* Prediction Range */}
              {result.data.xgboost_prediction_data.predicted_range && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Prediction Range</p>
                  <p className="text-lg font-medium">
                    {result.data.xgboost_prediction_data.predicted_range.low.toFixed(1)} - {result.data.xgboost_prediction_data.predicted_range.high.toFixed(1)} DPS
                  </p>
                </div>
              )}

              {/* Top Contributing Features */}
              {result.data.xgboost_prediction_data.top_contributing_features?.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Top Contributing Features</p>
                  <div className="space-y-1">
                    {result.data.xgboost_prediction_data.top_contributing_features.slice(0, 5).map((feature: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
                        <span className="text-sm">{feature.feature.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-medium text-green-600">{(feature.importance * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Features Warning */}
              {result.data.xgboost_prediction_data.missing_features?.length > 0 && (
                <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 p-3 rounded">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    ⚠️ Missing {result.data.xgboost_prediction_data.missing_features.length} features for optimal prediction
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}