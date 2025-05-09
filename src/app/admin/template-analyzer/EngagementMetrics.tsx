import React from 'react';
import { TrendingUp, Share2, BarChart2, Play } from 'lucide-react';

interface MetricItem {
  name: string;
  value: number;
  description?: string;
  format?: 'percentage' | 'number' | 'rating';
  color?: string;
  icon?: React.ReactNode;
}

interface EngagementMetricsProps {
  metrics: {
    engagementRate?: number;
    shareability?: number;
    viralScore?: number;
    completionRate?: number;
    [key: string]: number | undefined;
  };
  insights?: string;
}

/**
 * Displays engagement metrics with visual indicators
 */
const EngagementMetrics: React.FC<EngagementMetricsProps> = ({ metrics, insights }) => {
  // Convert metrics object to array for easier rendering
  const metricItems: MetricItem[] = [
    {
      name: 'Engagement Rate',
      value: metrics.engagementRate || 0,
      description: 'Interactions relative to total views',
      format: 'percentage',
      color: getColorForValue(metrics.engagementRate || 0, 0, 15),
      icon: <BarChart2 size={18} />
    },
    {
      name: 'Viral Potential',
      value: metrics.viralScore || 0,
      description: 'Estimated potential for virality',
      format: 'rating',
      color: getColorForValue(metrics.viralScore || 0, 1, 10),
      icon: <TrendingUp size={18} />
    },
    {
      name: 'Shareability',
      value: metrics.shareability || 0,
      description: 'Likelihood of being shared',
      format: 'rating',
      color: getColorForValue(metrics.shareability || 0, 1, 10),
      icon: <Share2 size={18} />
    },
    {
      name: 'Completion Rate',
      value: metrics.completionRate || 0,
      description: 'Estimated video completion percentage',
      format: 'percentage',
      color: getColorForValue(metrics.completionRate || 0, 0, 100),
      icon: <Play size={18} />
    }
  ];
  
  // Add any additional metrics from the metrics object
  Object.entries(metrics).forEach(([key, value]) => {
    if (value !== undefined && 
        !['engagementRate', 'shareability', 'viralScore', 'completionRate'].includes(key)) {
      metricItems.push({
        name: formatMetricName(key),
        value: value,
        format: key.toLowerCase().includes('rate') ? 'percentage' : 'number',
        color: getColorForValue(value, 0, 10)
      });
    }
  });

  return (
    <div className="rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Engagement Metrics</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {metricItems.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                {metric.icon && (
                  <div className={`mr-2 ${getIconColor(metric.color)}`}>
                    {metric.icon}
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-sm text-gray-800">{metric.name}</h4>
                  {metric.description && (
                    <p className="text-xs text-gray-500">{metric.description}</p>
                  )}
                </div>
              </div>
              <div className={`text-lg font-bold ${getTextColor(metric.color)}`}>
                {formatMetricValue(metric.value, metric.format)}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden relative">
              <div 
                className={`h-full ${getProgressBarColor(metric.color)}`} 
                style={{ 
                  width: `${getProgressWidth(metric.value, metric.format)}%`
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Circular progress chart */}
      <div className="mt-6 flex flex-col items-center">
        <div className="relative w-48 h-48">
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="rotate-[-90deg]">
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - (metrics.viralScore || 0) / 10)}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-3xl font-bold text-blue-600">
              {((metrics.viralScore || 0) * 10).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-500">Viral Score</div>
          </div>
        </div>
      </div>
      
      {insights && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2 text-gray-700">Engagement Insights:</h4>
          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-md border border-gray-200">
            {insights}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function formatMetricName(key: string): string {
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

function formatMetricValue(value: number, format?: string): string {
  if (format === 'percentage') {
    return `${value.toFixed(1)}%`;
  } else if (format === 'rating') {
    return `${value.toFixed(1)}/10`;
  } else {
    return value.toLocaleString(undefined, { 
      maximumFractionDigits: 2 
    });
  }
}

function getColorForValue(value: number, min: number, max: number): string {
  // Normalize value to 0-100 scale
  const normalized = ((value - min) / (max - min)) * 100;
  
  if (normalized < 33) {
    return 'text-red-500';
  } else if (normalized < 66) {
    return 'text-yellow-500';
  } else {
    return 'text-green-500';
  }
}

function getTextColor(textColor: string | undefined): string {
  if (!textColor) return 'text-blue-600';
  
  switch (textColor) {
    case 'text-red-500':
      return 'text-red-600';
    case 'text-yellow-500':
      return 'text-yellow-600';
    case 'text-green-500':
      return 'text-green-600';
    default:
      return 'text-blue-600';
  }
}

function getIconColor(textColor: string | undefined): string {
  if (!textColor) return 'text-blue-500';
  
  switch (textColor) {
    case 'text-red-500':
      return 'text-red-500';
    case 'text-yellow-500':
      return 'text-yellow-500';
    case 'text-green-500':
      return 'text-green-500';
    default:
      return 'text-blue-500';
  }
}

function getProgressBarColor(textColor: string | undefined): string {
  if (!textColor) return 'bg-blue-500';
  
  switch (textColor) {
    case 'text-red-500':
      return 'bg-red-500';
    case 'text-yellow-500':
      return 'bg-yellow-500';
    case 'text-green-500':
      return 'bg-green-500';
    default:
      return 'bg-blue-500';
  }
}

function getProgressWidth(value: number, format?: string): number {
  if (format === 'percentage') {
    return Math.min(100, Math.max(0, value));
  } else if (format === 'rating') {
    return Math.min(100, Math.max(0, value * 10));
  } else {
    // For regular numbers, cap at 100
    return Math.min(100, Math.max(0, value));
  }
}

export default EngagementMetrics; 