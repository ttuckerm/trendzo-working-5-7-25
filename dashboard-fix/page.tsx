'use client';

import { useState } from 'react';
import Link from 'next/link';
// Import icons individually to avoid barrel optimization issues
import { FileText } from 'lucide-react';
import { Eye } from 'lucide-react';
import { BarChart2 } from 'lucide-react';
import { Users } from 'lucide-react';
import { PlusSquare } from 'lucide-react';
import { Music } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardViewPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Stats for the dashboard
  const stats = {
    templates: {
      count: 12,
      change: 8,
      period: 'Last 30 days'
    },
    views: {
      count: '8.6K',
      change: 15,
      period: 'Last 30 days'
    },
    engagement: {
      count: '4.7%',
      change: -2,
      period: 'Last 30 days'
    },
    followers: {
      count: '1.3K',
      change: 5,
      period: 'Last 30 days'
    }
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your content performance and analytics.
          </p>
        </div>
        <Button className="w-full md:w-auto">
          <PlusSquare className="h-4 w-4 mr-2" />
          Create New Template
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Total Templates</p>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <h2 className="text-3xl font-bold">12</h2>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <span className="text-xs text-green-500 mr-1">+8%</span>
                from Last 30 days
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sound Performance */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-blue-500" />
                  <h3 className="text-base font-medium">Sound Performance</h3>
                  <div className="ml-auto">
                    <Link href="#" className="text-sm text-indigo-500 hover:underline">View Details</Link>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Sound usage and engagement metrics</p>
                
                <div className="grid grid-cols-3 gap-4 my-6">
                  <div>
                    <p className="text-3xl font-bold">42</p>
                    <p className="text-sm text-gray-500">Used Sounds</p>
                    <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded">+8%</span>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">19%</p>
                    <p className="text-sm text-gray-500">Engagement Boost</p>
                    <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded">+2.5%</span>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">8.5K</p>
                    <p className="text-sm text-gray-500">Sound-Driven Views</p>
                    <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded">+12%</span>
                  </div>
                </div>
                
                <h4 className="text-sm font-medium mb-2">Top Performing Sounds</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Summer Vibes</span>
                      <span className="text-xs text-gray-500">124 uses</span>
                      <span className="text-xs text-gray-500">18.2% engagement</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <Link href="#" className="text-green-500 hover:text-green-600">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Deep Bass Loop</span>
                      <span className="text-xs text-gray-500">98 uses</span>
                      <span className="text-xs text-gray-500">15.7% engagement</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <Link href="#" className="text-green-500 hover:text-green-600">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Trending Beat 2023</span>
                      <span className="text-xs text-gray-500">86 uses</span>
                      <span className="text-xs text-gray-500">14.3% engagement</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <Link href="#" className="text-green-500 hover:text-green-600">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Template-Sound Performance */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9H21M3 9V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V9ZM9 9V21M3 15H9M15 9V21M3 17H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3 className="text-base font-medium">Template-Sound Performance</h3>
                  <div className="ml-auto">
                    <Link href="#" className="text-sm text-indigo-500 hover:underline">View Details</Link>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Cross-referencing template and sound metrics</p>
                
                <div className="mt-6">
                  <div className="grid grid-cols-3 gap-2 mb-4 text-sm font-medium border-b pb-2">
                    <div>Template Type</div>
                    <div>Best Sound</div>
                    <div>Engagement</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b">
                      <div>Product Showcase</div>
                      <div>Summer Vibes</div>
                      <div className="text-green-600">24.7%</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b">
                      <div>Tutorial Format</div>
                      <div>Deep Bass Loop</div>
                      <div className="text-green-600">19.3%</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm py-2 border-b">
                      <div>Brand Story</div>
                      <div>Emotional Piano</div>
                      <div className="text-green-600">22.1%</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center gap-2 bg-blue-50 p-3 rounded-md">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.5 14.5L4 18V4C4 3.44772 4.44772 3 5 3H19C19.5523 3 20 3.44772 20 4V14C20 14.5523 19.5523 15 19 15H8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Template-Sound Recommendation</p>
                    <p className="text-xs text-gray-600">Adding sound to your templates increases engagement by ~22% on average. Try adding trending sounds to your most viewed templates.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="pt-6">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-bold mb-4">Analytics</h2>
              <p className="text-muted-foreground">
                Track performance metrics for your content.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="engagement" className="pt-6">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-bold mb-4">Engagement</h2>
              <p className="text-muted-foreground">
                Monitor user engagement with your content.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 