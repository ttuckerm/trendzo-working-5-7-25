"use client"

import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface ComparisonMetric {
  name: string;
  template1Value: number;
  template2Value: number | null;
  difference: number;
  percentDifference: number;
}

interface ComparisonData {
  template1: {
    id: string;
    title: string;
  };
  template2: {
    id: string;
    title: string;
  } | null;
  metrics: ComparisonMetric[];
}

interface ComparisonTableProps {
  data: ComparisonData;
  className?: string;
}

// Format value based on metric name
const formatValue = (name: string, value: number): string => {
  if (name === 'engagementRate' || name === 'completionRate' || name === 'conversionRate') {
    return `${(value * 100).toFixed(2)}%`;
  } else if (name === 'growthRate') {
    return `${(value * 100).toFixed(1)}%`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

// Get display name for metrics
const getMetricDisplayName = (name: string): string => {
  const displayNames: Record<string, string> = {
    views: 'Views',
    likes: 'Likes',
    comments: 'Comments',
    shares: 'Shares',
    engagementRate: 'Engagement Rate',
    growthRate: 'Growth Rate',
    completionRate: 'Completion Rate',
    conversionRate: 'Conversion Rate'
  };
  
  return displayNames[name] || name;
};

const ComparisonTable: React.FC<ComparisonTableProps> = ({
  data,
  className = ''
}) => {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white ${className}`}>
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">Template Comparison</h2>
        <p className="text-sm text-gray-600">
          Direct comparison between selected templates
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-600">
                Metric
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-blue-600">
                {data.template1.title}
              </th>
              {data.template2 && (
                <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-purple-600">
                  {data.template2.title}
                </th>
              )}
              {data.template2 && (
                <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Difference
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.metrics.map((metric, index) => (
              <tr key={metric.name} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  {getMetricDisplayName(metric.name)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-800">
                  {formatValue(metric.name, metric.template1Value)}
                </td>
                {data.template2 && (
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-800">
                    {metric.template2Value !== null ? formatValue(metric.name, metric.template2Value) : 'N/A'}
                  </td>
                )}
                {data.template2 && (
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {metric.template2Value !== null ? (
                      <div className="flex items-center">
                        {metric.percentDifference > 0 ? (
                          <span className="flex items-center text-green-600">
                            <ArrowUp size={14} className="mr-1" />
                            {Math.abs(metric.percentDifference).toFixed(1)}%
                          </span>
                        ) : metric.percentDifference < 0 ? (
                          <span className="flex items-center text-red-600">
                            <ArrowDown size={14} className="mr-1" />
                            {Math.abs(metric.percentDifference).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="flex items-center text-gray-500">
                            <Minus size={14} className="mr-1" />
                            0%
                          </span>
                        )}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable; 