'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
// Import icons individually to avoid barrel optimization issues
import { Music } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { BarChart2 } from 'lucide-react';

// Sample data for visualization
const sampleData = [
  { month: 'Jan', value: 2400, trend: 1800 },
  { month: 'Feb', value: 1398, trend: 1600 },
  { month: 'Mar', value: 9800, trend: 2300 },
  { month: 'Apr', value: 3908, trend: 2800 },
  { month: 'May', value: 4800, trend: 3500 },
  { month: 'Jun', value: 3800, trend: 3900 },
  { month: 'Jul', value: 4300, trend: 4200 },
];

const categoryData = [
  { category: 'Electronic', value: 4000 },
  { category: 'Pop', value: 3000 },
  { category: 'Hip-Hop', value: 2000 },
  { category: 'Ambient', value: 2780 },
  { category: 'Rock', value: 1890 },
  { category: 'Other', value: 2390 },
];

/**
 * A dashboard component for sound analytics 
 */
export default function SoundAnalyticsDashboard({ className = "" }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5 text-indigo-500" />
          Sound Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-medium">Total Sounds</h3>
                </div>
                <p className="text-2xl font-bold mt-1">243</p>
                <p className="text-xs text-green-600">+12% from last month</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <h3 className="text-sm font-medium">Engagement Rate</h3>
                </div>
                <p className="text-2xl font-bold mt-1">18.7%</p>
                <p className="text-xs text-green-600">+2.3% from last month</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-medium">Most Used</h3>
                </div>
                <p className="text-2xl font-bold mt-1">Electronic</p>
                <p className="text-xs text-blue-600">42% of all sounds</p>
              </Card>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Sound Usage Trends</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sampleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" name="Usage" />
                    <Line type="monotone" dataKey="trend" stroke="#82ca9d" name="Trend" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="categories" className="space-y-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Usage" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Top Trending Sounds</h3>
              <div className="space-y-3">
                {[
                  { title: 'Summer Vibes', artist: 'TrendMusic', change: '+24%' },
                  { title: 'Deep Bass Loop', artist: 'BeatMaker', change: '+18%' },
                  { title: 'Emotional Piano', artist: 'MoodTunes', change: '+15%' }
                ].map((sound, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{sound.title}</p>
                      <p className="text-xs text-gray-500">{sound.artist}</p>
                    </div>
                    <span className="text-green-600 font-medium">{sound.change}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 