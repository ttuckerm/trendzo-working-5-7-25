'use client';

import { useState, useEffect } from 'react';
import pythonService, { ExplainResult } from '@/lib/services/python-service-client';

interface ShapExplanationProps {
  features: Record<string, number>;
  prediction: number;
  showVisualization?: boolean;
  className?: string;
}

/**
 * SHAP Explanation Component
 * 
 * Displays an interactive explanation of what features contributed
 * to the DPS score prediction using SHAP values.
 */
export function ShapExplanation({
  features,
  prediction,
  showVisualization = true,
  className = ''
}: ShapExplanationProps) {
  const [explanation, setExplanation] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkService() {
      const available = await pythonService.healthCheck();
      setServiceAvailable(available);
    }
    checkService();
  }, []);

  useEffect(() => {
    async function fetchExplanation() {
      if (!serviceAvailable) return;
      
      setLoading(true);
      setError(null);

      try {
        const result = await pythonService.explainPrediction(features, prediction);
        setExplanation(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to get explanation';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    if (Object.keys(features).length > 0 && serviceAvailable) {
      fetchExplanation();
    }
  }, [features, prediction, serviceAvailable]);

  // Service not available
  if (serviceAvailable === false) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-lg">🧠</span>
          <span className="text-sm">
            Score explanation unavailable (Python service offline)
          </span>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 animate-pulse ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
          <div className="h-6 bg-gray-700 rounded w-48"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-red-900/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-400">
          <span className="text-lg">⚠️</span>
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  // No explanation yet
  if (!explanation) {
    return null;
  }

  const maxImpact = Math.max(
    ...explanation.visualization_data.features.map(x => Math.abs(x.shap_value)),
    0.01
  );

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">🧠</span>
        Why Your Score is {prediction.toFixed(1)}
      </h3>

      {/* Explanation Text */}
      <p className="text-gray-300 mb-6 text-sm leading-relaxed">
        {explanation.explanation_text}
      </p>

      {/* Feature Impact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Positive Factors */}
        <div>
          <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
            <span>✅</span>
            Boosting Your Score
          </h4>
          <div className="space-y-2">
            {explanation.top_positive_features.length > 0 ? (
              explanation.top_positive_features.map((f, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-green-900/20 rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-gray-300 capitalize">
                    {formatFeatureName(f.feature)}
                  </span>
                  <span className="text-green-400 font-mono text-sm font-semibold">
                    +{f.impact.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm italic">No significant positive factors</p>
            )}
          </div>
        </div>

        {/* Negative Factors */}
        <div>
          <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
            <span>⚠️</span>
            Holding Back Your Score
          </h4>
          <div className="space-y-2">
            {explanation.top_negative_features.length > 0 ? (
              explanation.top_negative_features.map((f, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-red-900/20 rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-gray-300 capitalize">
                    {formatFeatureName(f.feature)}
                  </span>
                  <span className="text-red-400 font-mono text-sm font-semibold">
                    -{f.impact.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm italic">No significant negative factors</p>
            )}
          </div>
        </div>
      </div>

      {/* Waterfall Visualization */}
      {showVisualization && explanation.visualization_data && (
        <div>
          <h4 className="text-gray-400 font-semibold mb-3 text-sm">
            Feature Impact Breakdown
          </h4>
          <div className="space-y-1.5">
            {explanation.visualization_data.features.slice(0, 10).map((f, i) => {
              const widthPercent = Math.min((Math.abs(f.shap_value) / maxImpact) * 100, 100);
              const isPositive = f.shap_value >= 0;

              return (
                <div key={i} className="flex items-center gap-2 group">
                  {/* Feature name */}
                  <span className="text-xs text-gray-400 w-28 truncate" title={f.name}>
                    {formatFeatureName(f.name)}
                  </span>
                  
                  {/* Bar visualization */}
                  <div className="flex-1 h-5 bg-gray-700/50 rounded relative overflow-hidden">
                    {/* Center line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-500 z-10" />
                    
                    {/* Impact bar */}
                    <div
                      className={`absolute h-full transition-all duration-300 ${
                        isPositive 
                          ? 'bg-gradient-to-r from-green-500/50 to-green-500 left-1/2' 
                          : 'bg-gradient-to-l from-red-500/50 to-red-500 right-1/2'
                      }`}
                      style={{
                        width: `${widthPercent / 2}%`,
                      }}
                    />
                    
                    {/* Hover tooltip */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs bg-gray-900/90 px-2 py-0.5 rounded">
                        Value: {f.value.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {/* SHAP value */}
                  <span
                    className={`text-xs font-mono w-14 text-right ${
                      isPositive ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {isPositive ? '+' : ''}{f.shap_value.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span>Decreases Score</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Increases Score</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Format feature names for display
 */
function formatFeatureName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace('Xgboost', 'XGBoost')
    .replace('Dps', 'DPS')
    .replace('3s', '3 Sec');
}

export default ShapExplanation;


