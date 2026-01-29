"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-component';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, ArrowUp, BarChart3, TrendingUp, ChevronDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for development
const clickData = [
  { name: 'Mon', clicks: 240, views: 400, edits: 180 },
  { name: 'Tue', clicks: 300, views: 450, edits: 210 },
  { name: 'Wed', clicks: 280, views: 410, edits: 200 },
  { name: 'Thu', clicks: 320, views: 480, edits: 230 },
  { name: 'Fri', clicks: 350, views: 520, edits: 260 },
  { name: 'Sat', clicks: 270, views: 390, edits: 190 },
  { name: 'Sun', clicks: 310, views: 470, edits: 220 },
];

const campaignData = [
  { name: 'Summer Sale', clicks: 1200, views: 2400, ratio: 0.5 },
  { name: 'Back to School', clicks: 900, views: 1800, ratio: 0.5 },
  { name: 'Holiday Promo', clicks: 1500, views: 2800, ratio: 0.54 },
  { name: 'Spring Launch', clicks: 1100, views: 2100, ratio: 0.52 },
];

const templateData = [
  { name: 'Basic Promo', value: 40 },
  { name: 'Holiday Theme', value: 25 },
  { name: 'Product Feature', value: 20 },
  { name: 'Customer Story', value: 15 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function NewsletterAnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState("7d");
  const [campaign, setCampaign] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Newsletter Analytics</h1>
        
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
          
          <Select value={campaign} onValueChange={setCampaign}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="summer">Summer Sale</SelectItem>
              <SelectItem value="backtoschool">Back to School</SelectItem>
              <SelectItem value="holiday">Holiday Promo</SelectItem>
              <SelectItem value="spring">Spring Launch</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Clicks</CardTitle>
            <CardDescription>Campaign engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">4,350</span>
              <span className="flex items-center text-green-500 text-sm font-medium">
                <ArrowUp className="h-4 w-4 mr-1" />
                12.5%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Views</CardTitle>
            <CardDescription>Newsletter impressions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">11,270</span>
              <span className="flex items-center text-green-500 text-sm font-medium">
                <ArrowUp className="h-4 w-4 mr-1" />
                8.3%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Conversion Rate</CardTitle>
            <CardDescription>Click-to-view ratio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">38.6%</span>
              <span className="flex items-center text-red-500 text-sm font-medium">
                <ArrowDown className="h-4 w-4 mr-1" />
                2.1%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Trend</CardTitle>
                <CardDescription>Clicks, views, and edits over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={clickData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="clicks" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="views" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="edits" stroke="#ffc658" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Comparison of campaign effectiveness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="clicks" fill="#8884d8" />
                      <Bar dataKey="views" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Template Usage</CardTitle>
                <CardDescription>Distribution of template types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={templateData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {templateData.map((entry, index) => (
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
        </div>
      </Tabs>

      {/* Development information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
          <h3 className="font-medium text-yellow-800">Development Notes</h3>
          <p className="text-sm text-yellow-700 mt-1">
            This is a simplified version of the analytics page with static data for development.
            No API calls are being made to avoid authentication issues.
          </p>
        </div>
      )}
    </div>
  );
} 