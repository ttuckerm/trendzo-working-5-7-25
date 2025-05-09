"use client";

import React from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Sample data for the charts
const soundGrowthData = [
  { name: 'Jan', soundCount: 15, growth: 0 },
  { name: 'Feb', soundCount: 20, growth: 33 },
  { name: 'Mar', soundCount: 25, growth: 25 },
  { name: 'Apr', soundCount: 35, growth: 40 },
  { name: 'May', soundCount: 42, growth: 20 },
  { name: 'Jun', soundCount: 53, growth: 26 },
  { name: 'Jul', soundCount: 60, growth: 13 },
];

const engagementData = [
  { name: 'Mon', value: 2.4 },
  { name: 'Tue', value: 1.8 },
  { name: 'Wed', value: 3.2 },
  { name: 'Thu', value: 5.7 },
  { name: 'Fri', value: 4.3 },
  { name: 'Sat', value: 6.2 },
  { name: 'Sun', value: 8.1 },
];

export const DashboardCharts = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h4 className="text-sm font-medium">Sound Usage Growth</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={soundGrowthData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [new Intl.NumberFormat().format(value), 'Count']}
              />
              <Legend />
              <Bar dataKey="soundCount" name="Sound Count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <h4 className="text-sm font-medium">Weekly Engagement (%)</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={engagementData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'Engagement']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name="Engagement Rate"
                stroke="#82ca9d"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts; 