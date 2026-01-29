"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-component';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, ArrowUp, BarChart3, TrendingUp, ChevronDown, Music, Volume2 } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SoundTemplateCorrelation from '@/components/analytics/SoundTemplateCorrelation';
import SoundGrowthChart from '@/components/analytics/SoundGrowthChart';

// Mock data for development
const growthData = [
  { month: 'Jan', growth: 2000, target: 2400 },
  { month: 'Feb', growth: 3000, target: 2900 },
  { month: 'Mar', growth: 2780, target: 3200 },
  { month: 'Apr', growth: 3890, target: 3500 },
  { month: 'May', growth: 2390, target: 3000 },
  { month: 'Jun', growth: 3490, target: 3400 },
];

const categoryData = [
  { name: 'Fashion', value: 35 },
  { name: 'Tech', value: 25 },
  { name: 'Food', value: 20 },
  { name: 'Travel', value: 15 },
  { name: 'Fitness', value: 5 },
];

const audienceData = [
  { name: '18-24', value: 30 },
  { name: '25-34', value: 40 },
  { name: '35-44', value: 15 },
  { name: '45-54', value: 10 },
  { name: '55+', value: 5 },
];

const barData = [
  { name: 'Q1', value: 4000 },
  { name: 'Q2', value: 3000 },
  { name: 'Q3', value: 2000 },
  { name: 'Q4', value: 2780 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Mock data for sound performance
const soundPerformanceData = [
  { month: 'Jan', growth: 1500, usage: 800 },
  { month: 'Feb', growth: 2200, usage: 1200 },
  { month: 'Mar', growth: 3000, usage: 1800 },
  { month: 'Apr', growth: 2800, usage: 1500 },
  { month: 'May', growth: 3500, usage: 2100 },
  { month: 'Jun', growth: 4200, usage: 2400 },
];

// Mock sound categories data
const soundCategoryData = [
  { name: 'Pop', value: 30 },
  { name: 'Hip Hop', value: 25 },
  { name: 'Electronic', value: 20 },
  { name: 'Ambient', value: 15 },
  { name: 'Sound Effects', value: 10 },
];

export default function PerformanceAnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState("7d");
  const [category, setCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("growth");
  const [selectedSoundId, setSelectedSoundId] = useState<string | undefined>(undefined);
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Performance Analytics</h1>
        
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
          
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="tech">Tech</SelectItem>
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="travel">Travel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Growth Rate</CardTitle>
            <CardDescription>Overall performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">+18.2%</span>
              <span className="flex items-center text-green-500 text-sm font-medium">
                <ArrowUp className="h-4 w-4 mr-1" />
                4.3%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Engagement</CardTitle>
            <CardDescription>User interaction rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">42.5%</span>
              <span className="flex items-center text-green-500 text-sm font-medium">
                <ArrowUp className="h-4 w-4 mr-1" />
                2.1%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Retention</CardTitle>
            <CardDescription>User return rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">76.8%</span>
              <span className="flex items-center text-red-500 text-sm font-medium">
                <ArrowDown className="h-4 w-4 mr-1" />
                1.2%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="growth">Growth Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="sound-impact">Sound Impact</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="growth">
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Performance over time compared to targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="growth" stroke="#8884d8" fillOpacity={1} fill="url(#colorGrowth)" />
                      <Line type="monotone" dataKey="target" stroke="#ff7300" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="audience">
            <Card>
              <CardHeader>
                <CardTitle>Audience Demographics</CardTitle>
                <CardDescription>User age distribution</CardDescription>
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
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {audienceData.map((entry, index) => (
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
          </TabsContent>
          
          <TabsContent value="sound-impact">
            <Card>
              <CardHeader>
                <CardTitle>Sound Impact Analysis</CardTitle>
                <CardDescription>Analyze how sounds affect engagement and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Sound Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">2,847</span>
                        <span className="flex items-center text-green-500 text-sm font-medium">
                          <ArrowUp className="h-4 w-4 mr-1" />
                          12.5%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Sound Engagement</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">+24.7%</span>
                        <span className="flex items-center text-green-500 text-sm font-medium">
                          <ArrowUp className="h-4 w-4 mr-1" />
                          3.8%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Sound Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">5</span>
                        <span className="flex items-center text-gray-500 text-sm font-medium">
                          <Music className="h-4 w-4 mr-1" />
                          Active
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Sound Growth Trends</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={soundPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="growth" stroke="#8884d8" name="Sound Growth" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="usage" stroke="#82ca9d" name="Sound Usage" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Sound Categories Distribution</h3>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={soundCategoryData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {soundCategoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Sound-Template Correlations</h3>
                    <div className="text-sm text-gray-500 mb-4">
                      <p>This chart shows how sounds correlate with templates and their impact on engagement.</p>
                    </div>
                    <SoundTemplateCorrelation />
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Sound Growth Analysis</h3>
                  <div className="h-[300px]">
                    <SoundGrowthChart isPremium={true} />
                  </div>
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
            This is a simplified version of the performance analytics page with static data for development.
            No API calls are being made to avoid authentication issues.
          </p>
        </div>
      )}
    </div>
  );
} 