'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { AdjustmentTypeImpact } from '@/lib/types/expertDashboard';

interface AdjustmentTypeImpactChartProps {
  types: AdjustmentTypeImpact[];
  categoryView?: boolean;
}

export default function AdjustmentTypeImpactChart({ 
  types,
  categoryView = false 
}: AdjustmentTypeImpactChartProps) {
  if (!types || types.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No adjustment type data available</p>
      </div>
    );
  }
  
  // Sort types by average improvement for better visualization
  const sortedTypes = [...types].sort((a, b) => b.averageImprovement - a.averageImprovement);
  
  // Prepare data for the charts
  const barChartData = sortedTypes.map(type => ({
    name: type.adjustmentType,
    improvement: Number((type.averageImprovement * 100).toFixed(2)),
    count: type.totalCount,
    successRate: Number((type.successRate * 100).toFixed(2))
  }));
  
  // Colors for the bars
  const getBarColor = (value: number) => {
    if (value > 5) return '#4CAF50'; // Significant improvement (green)
    if (value > 0) return '#8BC34A'; // Moderate improvement (light green)
    if (value > -5) return '#FFC107'; // Slight negative (yellow)
    return '#F44336'; // Significant negative (red)
  };
  
  // If in category view, show time series data for each category
  if (categoryView && sortedTypes.length > 0) {
    // Flatten and prepare the timeseries data
    const timeseriesData = sortedTypes.flatMap(type => 
      type.timeseriesData.map(point => ({
        date: point.date.toLocaleDateString(),
        [type.adjustmentType]: Number(point.value.toFixed(2))
      }))
    );
    
    // Group by date and merge values
    const groupedData = timeseriesData.reduce((acc, point) => {
      const existingPoint = acc.find(p => p.date === point.date);
      if (existingPoint) {
        return acc.map(p => 
          p.date === point.date 
            ? { ...p, ...point } 
            : p
        );
      } else {
        return [...acc, point];
      }
    }, [] as any[]);
    
    // Sort by date
    const sortedData = groupedData.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={sortedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 70
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            angle={-45} 
            textAnchor="end" 
            height={70}
          />
          <YAxis 
            label={{ 
              value: 'Improvement (%)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' } 
            }}
          />
          <Tooltip />
          <Legend />
          {sortedTypes.map((type, index) => (
            <Line
              key={type.adjustmentType}
              type="monotone"
              dataKey={type.adjustmentType}
              name={type.adjustmentType}
              stroke={getColorByIndex(index)}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={barChartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 70
        }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          type="number" 
          label={{ 
            value: 'Improvement (%)', 
            position: 'insideBottom',
            offset: -10
          }}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          width={150}
          tick={{ fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value, name) => {
            const nameStr = String(name);
            if (nameStr === 'improvement') return [`${value}%`, 'Improvement'];
            if (nameStr === 'successRate') return [`${value}%`, 'Success Rate'];
            return [value, nameStr.charAt(0).toUpperCase() + nameStr.slice(1)];
          }}
        />
        <Legend />
        <Bar dataKey="improvement" name="Average Improvement" fill="#8884d8">
          {barChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.improvement)} />
          ))}
        </Bar>
        <Bar dataKey="successRate" name="Success Rate" fill="#82ca9d" />
        <Bar dataKey="count" name="Adjustment Count" fill="#ffc658" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Helper function to get a color by index
function getColorByIndex(index: number): string {
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c43', '#4ecdc4',
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5'
  ];
  return colors[index % colors.length];
} 