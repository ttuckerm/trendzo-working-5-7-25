"use client"

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface ComparisonMetric {
  name: string;
  template1: number;
  template2?: number;
  fullMark: number;
}

interface TemplateComparisonProps {
  template1: {
    id: string;
    title: string;
    color: string;
    stats: {
      views: number;
      engagementRate: number;
      growthRate: number;
      completionRate: number;
    };
  };
  template2?: {
    id: string;
    title: string;
    color: string;
    stats: {
      views: number;
      engagementRate: number;
      growthRate: number;
      completionRate: number;
    };
  };
  metrics: ComparisonMetric[];
  className?: string;
  isActive?: boolean;
}

const TemplateComparison: React.FC<TemplateComparisonProps> = ({
  template1,
  template2,
  metrics,
  className = '',
  isActive = false,
}) => {
  // Transform metrics for bar chart
  const barChartData = metrics.map(metric => ({
    name: metric.name,
    [template1.title]: metric.template1,
    ...(template2 ? { [template2.title]: metric.template2 } : {})
  }));

  // Function to format numbers for display
  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  // Apply special border when in active comparison mode
  const borderStyle = isActive 
    ? 'border-4 border-green-400 shadow-lg shadow-green-100' 
    : 'border border-gray-200';

  return (
    <div className={`rounded-lg ${borderStyle} bg-white p-6 ${className} ${isActive ? 'animate-pulse-once' : ''}`}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Template Comparison</h2>
      </div>

      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="flex items-center">
          <div className="h-3 w-3 rounded-full bg-blue-500 mr-1"></div>
          <span className="text-sm text-gray-700">{template1.title}</span>
        </div>
        <span className="text-sm text-gray-500">vs</span>
        <div className="flex items-center">
          <div className="h-3 w-3 rounded-full bg-purple-500 mr-1"></div>
          <span className="text-sm text-gray-700">{template2?.title}</span>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-4 text-base font-medium text-gray-800">Performance Comparison</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={barChartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" domain={[0, 100]} tickCount={5} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey={template1.title} fill="#3b82f6" barSize={20} />
              {template2 && <Bar dataKey={template2.title} fill="#8b5cf6" barSize={20} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-full bg-blue-500"></div>
            <h3 className="font-medium text-lg">{template1.title}</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-gray-600 text-sm">Views</div>
              <div className="font-semibold text-xl">{formatNumber(template1.stats.views)}</div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">Engagement</div>
              <div className="font-semibold text-xl">{(template1.stats.engagementRate * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">Growth</div>
              <div className="font-semibold text-xl">{(template1.stats.growthRate * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-gray-600 text-sm">Completion</div>
              <div className="font-semibold text-xl">{(template1.stats.completionRate * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        {template2 && (
          <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-purple-500"></div>
              <h3 className="font-medium text-lg">{template2.title}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-600 text-sm">Views</div>
                <div className="font-semibold text-xl">{formatNumber(template2.stats.views)}</div>
              </div>
              <div>
                <div className="text-gray-600 text-sm">Engagement</div>
                <div className="font-semibold text-xl">{(template2.stats.engagementRate * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-gray-600 text-sm">Growth</div>
                <div className="font-semibold text-xl">{(template2.stats.growthRate * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-gray-600 text-sm">Completion</div>
                <div className="font-semibold text-xl">{(template2.stats.completionRate * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateComparison; 