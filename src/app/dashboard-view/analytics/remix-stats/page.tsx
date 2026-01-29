"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-component';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, ArrowUp, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Remix Analytics Page
 * 
 * Shows metrics about AI-assisted template customization effectiveness
 */
export default function RemixAnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState("7d");
  const [activeTab, setActiveTab] = useState("usage");
  
  // Data for the charts
  const stats = {
    totalSuggestions: 1245,
    applicationRate: 68.3,
    suggestionTypes: 8,
    modelDistribution: [
      { name: 'OpenAI', value: 72 },
      { name: 'Claude', value: 28 }
    ],
    suggestionTypeStats: [
      { name: 'Content', count: 465 },
      { name: 'Style', count: 340 },
      { name: 'Structure', count: 250 },
      { name: 'Pacing', count: 190 }
    ],
    impactStats: [
      { level: 'High', count: 480 },
      { level: 'Medium', count: 575 },
      { level: 'Low', count: 190 }
    ],
    timeSeriesData: Array.from({ length: 30 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        suggestions: Math.floor(Math.random() * 60) + 20,
        applications: Math.floor(Math.random() * 40) + 10,
      };
    }),
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Remix Analytics</h1>
        
        <div className="flex space-x-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Suggestion Rate</CardTitle>
            <CardDescription>AI recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">8.3/day</span>
              <span className="flex items-center text-green-500 text-sm font-medium">
                <ArrowUp className="h-4 w-4 mr-1" />
                12.5%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Application Rate</CardTitle>
            <CardDescription>Suggestions applied</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">68%</span>
              <span className="flex items-center text-green-500 text-sm font-medium">
                <ArrowUp className="h-4 w-4 mr-1" />
                4.2%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Impact Score</CardTitle>
            <CardDescription>Performance improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">+41%</span>
              <span className="flex items-center text-green-500 text-sm font-medium">
                <ArrowUp className="h-4 w-4 mr-1" />
                5.8%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="usage">Model Usage</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="usage">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Model Usage</CardTitle>
                  <CardDescription>Distribution of AI models used</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.modelDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {stats.modelDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Application Rate</CardTitle>
                  <CardDescription>Percentage of suggestions applied</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Applied', value: stats.applicationRate },
                            { name: 'Not Applied', value: 100 - stats.applicationRate }
                          ]}
                          cx="50%"
                          cy="50%"
                          startAngle={90}
                          endAngle={-270}
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill="#4ade80" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Suggestion Trends</CardTitle>
                <CardDescription>Suggestions vs applications over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="suggestions"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                        name="AI Suggestions"
                      />
                      <Line
                        type="monotone"
                        dataKey="applications"
                        stroke="#82ca9d"
                        name="Applied Suggestions"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="impact">
            <Card>
              <CardHeader>
                <CardTitle>Performance Impact</CardTitle>
                <CardDescription>Before vs after applying suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.impactStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        name="Count" 
                        fill={
                          stats.impactStats[0].level === 'High' ? '#4ade80' : 
                          stats.impactStats[0].level === 'Medium' ? '#FF9800' : '#9E9E9E'
                        }
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Development information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
          <h3 className="font-medium text-yellow-800">Development Notes</h3>
          <p className="text-sm text-yellow-700 mt-1">
            This is a simplified version of the remix analytics page with static data for development.
            No API calls are being made to avoid authentication issues.
          </p>
        </div>
      )}
    </div>
  );
} 