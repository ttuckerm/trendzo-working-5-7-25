'use client';

import React, { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { format } from 'date-fns';
import { HistoricalImpact, TimeseriesDataPoint } from '@/lib/types/expertDashboard';

interface ImpactTimelineChartProps {
  timeframes?: HistoricalImpact[];
  seriesData?: TimeseriesDataPoint[];
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  type?: 'line' | 'bar';
  yAxisLabel?: string;
}

export default function ImpactTimelineChart({ 
  timeframes,
  seriesData,
  granularity,
  type = 'line',
  yAxisLabel = 'Impact (%)'
}: ImpactTimelineChartProps) {
  // Format data for the chart
  const chartData = useMemo(() => {
    if (seriesData) {
      return seriesData.map(point => ({
        date: format(point.date, getDateFormatForGranularity(granularity)),
        value: typeof point.value === 'number' ? Number(point.value.toFixed(2)) : 0,
        category: point.category || 'Value'
      }));
    }
    
    if (!timeframes || timeframes.length === 0) return [];
    
    return timeframes.map(tf => ({
      date: tf.period,
      originalAccuracy: Number(tf.originalAccuracy.toFixed(2)),
      adjustedAccuracy: Number(tf.adjustedAccuracy.toFixed(2)),
      improvement: Number(tf.improvementPercent.toFixed(2))
    }));
  }, [timeframes, seriesData, granularity]);
  
  const renderChart = () => {
    if (type === 'bar') {
      return (
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            angle={-45} 
            textAnchor="end" 
            height={70} 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            label={{ 
              value: yAxisLabel, 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' } 
            }}
          />
          <Tooltip />
          <Legend />
          {seriesData ? (
            <Bar dataKey="value" name={seriesData[0]?.category || 'Value'} fill="#8884d8" />
          ) : (
            <Bar dataKey="improvement" name="Improvement" fill="#82ca9d" />
          )}
        </BarChart>
      );
    }
    
    return (
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          angle={-45} 
          textAnchor="end" 
          height={70} 
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          label={{ 
            value: yAxisLabel, 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle' } 
          }}
        />
        <Tooltip />
        <Legend />
        {seriesData ? (
          <Line 
            type="monotone" 
            dataKey="value" 
            name={seriesData[0]?.category || 'Value'} 
            stroke="#8884d8" 
            activeDot={{ r: 8 }} 
          />
        ) : (
          <>
            <Line 
              type="monotone" 
              dataKey="originalAccuracy" 
              name="Original Accuracy" 
              stroke="#ff7c43" 
              strokeDasharray="5 5" 
            />
            <Line 
              type="monotone" 
              dataKey="adjustedAccuracy" 
              name="Adjusted Accuracy" 
              stroke="#4ecdc4" 
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="improvement" 
              name="Improvement" 
              stroke="#82ca9d" 
            />
          </>
        )}
      </LineChart>
    );
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  );
}

// Helper function to get date format based on granularity
function getDateFormatForGranularity(granularity: string): string {
  switch (granularity) {
    case 'daily':
      return 'MMM d';
    case 'weekly':
      return 'MMM d';
    case 'monthly':
      return 'MMM yyyy';
    case 'quarterly':
      return 'QQ yyyy';
    default:
      return 'MMM yyyy';
  }
} 