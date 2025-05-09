'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart2, Calendar, Users } from 'lucide-react';

const trendData = [
  { month: 'Jan', value: 2400, trend: 1800 },
  { month: 'Feb', value: 1398, trend: 1600 },
  { month: 'Mar', value: 9800, trend: 2300 },
  { month: 'Apr', value: 3908, trend: 2800 },
  { month: 'May', value: 4800, trend: 3500 },
  { month: 'Jun', value: 3800, trend: 3900 },
  { month: 'Jul', value: 4300, trend: 4200 },
];

const categoryData = [
  { category: 'Entertainment', value: 4000 },
  { category: 'Education', value: 3000 },
  { category: 'Product', value: 2000 },
  { category: 'Tutorial', value: 2780 },
  { category: 'Lifestyle', value: 1890 },
  { category: 'Other', value: 2390 },
];

export default function TrendInsightsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Trend Insights</h1>
        <p className="text-gray-500">Track and analyze content trends over time</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="growth">Growth Analysis</TabsTrigger>
          <TabsTrigger value="categories">Category Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg font-medium">
                  <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
                  Growth Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">+18.2%</div>
                <p className="text-sm text-green-600">+4.3% from last period</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg font-medium">
                  <BarChart2 className="w-4 h-4 mr-2 text-purple-500" />
                  Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">42.5%</div>
                <p className="text-sm text-green-600">+2.1% from last period</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg font-medium">
                  <Users className="w-4 h-4 mr-2 text-indigo-500" />
                  Retention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">76.8%</div>
                <p className="text-sm text-red-600">-1.2% from last period</p>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Growth Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} name="Current" />
                  <Line type="monotone" dataKey="trend" stroke="#82ca9d" name="Trend" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="growth">
          <Card>
            <CardHeader>
              <CardTitle>Performance over time compared to targets</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} name="Current" />
                  <Line type="monotone" dataKey="trend" stroke="#82ca9d" name="Trend" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={categoryData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Value" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 