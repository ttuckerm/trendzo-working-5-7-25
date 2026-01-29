"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card-component";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, HelpCircle, RefreshCw } from 'lucide-react';

// Sample data for the visualizations
const engagementData = [
  { name: 'Jan', lowFrequency: 65, midFrequency: 45, highFrequency: 38 },
  { name: 'Feb', lowFrequency: 59, midFrequency: 48, highFrequency: 42 },
  { name: 'Mar', lowFrequency: 80, midFrequency: 52, highFrequency: 45 },
  { name: 'Apr', lowFrequency: 81, midFrequency: 56, highFrequency: 48 },
  { name: 'May', lowFrequency: 56, midFrequency: 49, highFrequency: 52 },
  { name: 'Jun', lowFrequency: 55, midFrequency: 60, highFrequency: 47 },
  { name: 'Jul', lowFrequency: 67, midFrequency: 65, highFrequency: 50 },
  { name: 'Aug', lowFrequency: 71, midFrequency: 59, highFrequency: 53 },
  { name: 'Sep', lowFrequency: 85, midFrequency: 62, highFrequency: 58 },
];

const retentionData = [
  { name: 'Bass Heavy', retention: 76, engagement: 82, completion: 68 },
  { name: 'Vocal Focus', retention: 65, engagement: 74, completion: 71 },
  { name: 'Ambient', retention: 82, engagement: 76, completion: 84 },
  { name: 'Dynamic Range', retention: 71, engagement: 69, completion: 73 },
  { name: 'Rhythmic', retention: 79, engagement: 85, completion: 77 },
];

const platformData = [
  { name: 'Mobile', lowBass: 78, midRange: 62, highFreq: 41 },
  { name: 'Desktop', lowBass: 65, midRange: 71, highFreq: 58 },
  { name: 'Tablet', lowBass: 72, midRange: 68, highFreq: 45 },
  { name: 'Smart Speaker', lowBass: 85, midRange: 56, highFreq: 32 },
  { name: 'TV App', lowBass: 68, midRange: 65, highFreq: 39 },
];

// Metrics cards data
const keyMetrics = [
  {
    title: "Retention Rate",
    value: "78%",
    change: "+12%",
    increasing: true,
    description: "Average user retention with optimized sound profiles"
  },
  {
    title: "Engagement Score",
    value: "8.4",
    change: "+1.2",
    increasing: true,
    description: "Average engagement score (scale 1-10)"
  },
  {
    title: "Session Duration",
    value: "12.8m",
    change: "+4.3m",
    increasing: true,
    description: "Average session length with sound optimizations"
  },
  {
    title: "Drop-off Rate",
    value: "18%",
    change: "-7%",
    increasing: false,
    description: "User drop-off rate during audio content"
  },
];

export default function SoundEngagementCorrelation() {
  const [timeRange, setTimeRange] = useState("6m");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const refreshData = () => {
    setIsLoading(true);
    // Simulate API fetch
    setTimeout(() => {
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sound Engagement Analysis</h2>
          <p className="text-muted-foreground">
            Analyze how sound characteristics correlate with user engagement metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refreshData}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {keyMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              {metric.increasing ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
              <div className={`text-xs mt-1 ${metric.increasing ? 'text-green-500' : 'text-red-500'}`}>
                {metric.change} from previous period
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Engagement Overview</TabsTrigger>
          <TabsTrigger value="retention">Sound & Retention</TabsTrigger>
          <TabsTrigger value="platform">Platform Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequency Engagement Correlation</CardTitle>
              <CardDescription>
                User engagement metrics correlated with sound frequency characteristics
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={engagementData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="lowFrequency" 
                      stroke="#8884d8" 
                      name="Low Frequency (0-250Hz)"
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="midFrequency" 
                      stroke="#82ca9d" 
                      name="Mid Frequency (250Hz-4kHz)" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="highFrequency" 
                      stroke="#ffc658" 
                      name="High Frequency (4kHz+)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Low frequencies consistently show higher engagement metrics, with a significant increase in September.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sound Profile Impact on Retention</CardTitle>
              <CardDescription>
                How different sound profiles affect retention, engagement, and content completion
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={retentionData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="retention" fill="#8884d8" name="Retention %" />
                    <Bar dataKey="engagement" fill="#82ca9d" name="Engagement %" />
                    <Bar dataKey="completion" fill="#ffc658" name="Completion %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Ambient sound profiles show the highest retention rates, while rhythmic profiles drive the strongest engagement.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="platform" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform-Specific Sound Effectiveness</CardTitle>
              <CardDescription>
                Effectiveness of different sound frequencies across platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={platformData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="lowBass" fill="#8884d8" name="Low Bass (20-120Hz)" />
                    <Bar dataKey="midRange" fill="#82ca9d" name="Mid Range (120Hz-2kHz)" />
                    <Bar dataKey="highFreq" fill="#ffc658" name="High Frequencies (2kHz+)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Smart speakers show the strongest response to bass frequencies, while desktop users engage more with mid and high range content.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <span>Sound Engagement Insights</span>
            <HelpCircle className="ml-2 h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <div className="mr-2 mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
              <span>Users respond most positively to content with well-balanced low frequency elements (60-120Hz)</span>
            </li>
            <li className="flex items-start">
              <div className="mr-2 mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
              <span>Smart speaker users show 27% higher engagement with bass-optimized content</span>
            </li>
            <li className="flex items-start">
              <div className="mr-2 mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
              <span>Ambient sound profiles (with frequencies between 200-800Hz) increase session duration by an average of 4.3 minutes</span>
            </li>
            <li className="flex items-start">
              <div className="mr-2 mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
              <span>Dynamic audio transitions show a 14% higher retention rate than static sound profiles</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 