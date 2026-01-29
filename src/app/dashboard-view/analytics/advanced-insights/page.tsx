'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart2, Calendar, Users, Sparkles, Brain, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Sample data for charts
const audienceData = [
  { name: 'Age 16-24', value: 35 },
  { name: 'Age 25-34', value: 40 },
  { name: 'Age 35-44', value: 15 },
  { name: 'Age 45+', value: 10 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#8dd1e1'];

const predictiveData = [
  { month: 'Aug', current: 4000, predicted: 4400 },
  { month: 'Sep', current: 3000, predicted: 3800 },
  { month: 'Oct', current: 2000, predicted: 3000 },
  { month: 'Nov', current: null, predicted: 3500 },
  { month: 'Dec', current: null, predicted: 4200 },
  { month: 'Jan', current: null, predicted: 5100 },
];

const platformData = [
  { platform: 'TikTok', value: 4000, engagement: 65 },
  { platform: 'Instagram', value: 3000, engagement: 58 },
  { platform: 'YouTube', value: 2000, engagement: 52 },
  { platform: 'Facebook', value: 1500, engagement: 43 },
  { platform: 'Twitter', value: 1000, engagement: 37 },
];

const anomalyData = [
  { date: '08/01', views: 1200, normal: true },
  { date: '08/02', views: 1300, normal: true },
  { date: '08/03', views: 1100, normal: true },
  { date: '08/04', views: 1500, normal: true },
  { date: '08/05', views: 1400, normal: true },
  { date: '08/06', views: 1200, normal: true },
  { date: '08/07', views: 1300, normal: true },
  { date: '08/08', views: 1200, normal: true },
  { date: '08/09', views: 3200, normal: false },
  { date: '08/10', views: 1400, normal: true },
  { date: '08/11', views: 1300, normal: true },
  { date: '08/12', views: 1500, normal: true },
];

export default function AdvancedInsightsPage() {
  const [timeRange, setTimeRange] = useState('90days');
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Advanced Insights</h1>
          <p className="text-gray-500">Premium analytics and predictive modeling</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      <Tabs defaultValue="predictions">
        <TabsList className="mb-6">
          <TabsTrigger value="predictions">Predictive Analytics</TabsTrigger>
          <TabsTrigger value="audience">Audience Insights</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
          <TabsTrigger value="comparison">Platform Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions">
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-500" />
                    Predictive Growth Model
                  </CardTitle>
                  <CardDescription>
                    AI-powered prediction of your content performance in the next 3 months
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  <Sparkles className="w-3 h-3 mr-1" /> Business Feature
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={predictiveData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="current" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    name="Current Data" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                    name="AI Prediction" 
                  />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="mt-6 bg-gray-50 p-4 rounded-md border border-gray-100">
                <div className="flex items-start gap-2">
                  <Zap className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">AI Insight</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Based on your current growth trajectory and seasonal patterns, we predict a <strong className="text-green-600">27% increase</strong> in engagement over the next quarter. Consider increasing your posting frequency in December to capitalize on holiday trends.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audience">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Audience Demographics</CardTitle>
                <CardDescription>Age breakdown of your audience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={audienceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {audienceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Engagement by Platform</CardTitle>
                <CardDescription>Cross-platform performance comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={platformData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="engagement" fill="#8884d8" name="Engagement %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Anomaly Detection
                  </CardTitle>
                  <CardDescription>
                    Automatic detection of unusual patterns in your content performance
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={anomalyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      
                      if (payload.normal) {
                        return (
                          <circle cx={cx} cy={cy} r={4} fill="#8884d8" />
                        );
                      }
                      
                      return (
                        <circle cx={cx} cy={cy} r={6} fill="#ff5555" stroke="#ff0000" strokeWidth={2} />
                      );
                    }}
                    name="Views" 
                  />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="mt-6 bg-red-50 p-4 rounded-md border border-red-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Anomaly Detected</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Unusual spike in views detected on August 9th. This represents a <strong className="text-green-600">167% increase</strong> compared to your daily average. This content might have been shared by a popular account or benefited from the algorithm.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Platform Performance</CardTitle>
              <CardDescription>
                Compare your content performance across different platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={platformData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="value" fill="#8884d8" name="Views" />
                  <Bar yAxisId="right" dataKey="engagement" fill="#82ca9d" name="Engagement %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 