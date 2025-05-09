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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { ExpertPerformance } from '@/lib/types/expertDashboard';

interface ExpertPerformanceComparisonProps {
  experts: ExpertPerformance[];
}

export default function ExpertPerformanceComparison({ experts }: ExpertPerformanceComparisonProps) {
  if (!experts || experts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No expert performance data available</p>
      </div>
    );
  }
  
  // Sort experts by average impact
  const sortedExperts = [...experts].sort((a, b) => b.averageImpact - a.averageImpact);
  
  // Prepare data for the bar chart
  const barData = sortedExperts.map(expert => ({
    name: expert.name,
    adjustments: expert.adjustmentCount,
    impact: Number((expert.averageImpact * 100).toFixed(2)),
    successRate: Number((expert.successRate * 100).toFixed(2))
  }));
  
  // Prepare data for radar chart - comparing experts across common categories
  const allCategories = new Set<string>();
  experts.forEach(expert => {
    expert.topCategories.forEach(cat => {
      allCategories.add(cat.category);
    });
  });
  
  const radarData = Array.from(allCategories).map(category => {
    const dataPoint: Record<string, any> = { category };
    
    experts.forEach(expert => {
      const categoryData = expert.topCategories.find(cat => cat.category === category);
      dataPoint[expert.name] = categoryData 
        ? Number((categoryData.averageImpact * 100).toFixed(2))
        : 0;
    });
    
    return dataPoint;
  });
  
  // Get colors for each expert
  const getColor = (index: number) => {
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7c43', '#4ecdc4',
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5'
    ];
    return colors[index % colors.length];
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      {/* Bar chart for overall performance */}
      <div className="bg-white rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Overall Expert Performance</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip formatter={(value, name) => {
                const nameStr = String(name);
                if (nameStr === 'impact' || nameStr === 'successRate') return [`${value}%`, nameStr === 'impact' ? 'Impact' : 'Success Rate'];
                return [value, nameStr.charAt(0).toUpperCase() + nameStr.slice(1)];
              }} />
              <Legend />
              <Bar dataKey="impact" name="Average Impact (%)" fill="#8884d8" />
              <Bar dataKey="successRate" name="Success Rate (%)" fill="#82ca9d" />
              <Bar dataKey="adjustments" name="Total Adjustments" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Radar chart for category performance */}
      <div className="bg-white rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Category Performance Comparison</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius="75%" data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
              <Tooltip formatter={(value) => [`${value}%`, 'Impact']} />
              {sortedExperts.map((expert, index) => (
                <Radar
                  key={expert.expertId}
                  name={expert.name}
                  dataKey={expert.name}
                  stroke={getColor(index)}
                  fill={getColor(index)}
                  fillOpacity={0.2}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Expert details cards */}
      <div className="lg:col-span-2">
        <h3 className="text-lg font-medium mb-4">Expert Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedExperts.map((expert, index) => (
            <div 
              key={expert.expertId} 
              className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
              style={{ borderLeftColor: getColor(index), borderLeftWidth: '4px' }}
            >
              <h4 className="font-medium text-lg mb-2">{expert.name}</h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-sm text-gray-500">Adjustments</p>
                  <p className="font-medium">{expert.adjustmentCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Impact</p>
                  <p className="font-medium">{(expert.averageImpact * 100).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Success Rate</p>
                  <p className="font-medium">{(expert.successRate * 100).toFixed(2)}%</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Top Categories</p>
                <ul className="text-sm space-y-1">
                  {expert.topCategories.map(cat => (
                    <li key={cat.category} className="flex justify-between">
                      <span>{cat.category}</span>
                      <span className="font-medium">{(cat.averageImpact * 100).toFixed(2)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 