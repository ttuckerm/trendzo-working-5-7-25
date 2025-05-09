/**
 * CRITICAL FILE: Dashboard Root
 * 
 * PURPOSE: Entry point for the dashboard system
 * 
 * WARNING:
 * - This file is the main entry point for the dashboard
 * - Do NOT redirect to other routes unless specifically required
 * - Must maintain compatibility with dashboard components
 */

"use client"

import { useState, useEffect } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Eye, 
  UserCheck,
  Calendar,
  Layout,
  Star,
  ChevronRight,
  ThumbsUp,
  Share,
  Music, 
  Volume2,
  Play,
  Plus,
  ArrowUpRight,
  Bookmark,
  LineChart,
  ListMusic,
  Settings,
  Sparkles,
  User,
  ArrowRightCircle
} from 'lucide-react';
import Link from 'next/link';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SoundCard from '@/components/audio/SoundCard';
import { useAudio } from '@/lib/contexts/AudioContext';
import { demoSounds } from '@/lib/utils/demoSounds';
import { TikTokSound } from '@/lib/types/tiktok';
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

// Mock data for recent templates
const recentTemplates = [
  {
    id: 'template-1',
    title: 'Product Showcase',
    views: 542,
    likes: 124,
    shares: 47,
    lastEdited: '2023-06-12',
    thumbnail: '/thumbnails/product-1.jpg'
  },
  {
    id: 'template-2',
    title: 'Tutorial Format',
    views: 328,
    likes: 87,
    shares: 32,
    lastEdited: '2023-06-10',
    thumbnail: '/thumbnails/tutorial-1.jpg'
  },
  {
    id: 'template-3',
    title: 'Story Time Format',
    views: 215,
    likes: 63,
    shares: 28,
    lastEdited: '2023-06-08',
    thumbnail: '/thumbnails/story-1.jpg'
  }
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const { tier, hasPremium } = useSubscription();
  const { loadSound, play, toggle } = useAudio();
  const [trendingSounds, setTrendingSounds] = useState<TikTokSound[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingSounds = async () => {
      try {
        const response = await fetch('/api/sounds/trending');
        const data = await response.json();
        
        if (data.success && data.sounds) {
          setTrendingSounds(data.sounds.slice(0, 4)); // Get top 4 trending sounds
        }
      } catch (error) {
        console.error('Error fetching trending sounds:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrendingSounds();
  }, []);

  // Handle playing a sound in the global audio player
  const handlePlaySound = (sound) => {
    loadSound(sound);
    play();
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Template
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="sounds">Sounds</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Templates
                </CardTitle>
                <Bookmark className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">
                  +5 from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sound Usage
                </CardTitle>
                <Music className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42</div>
                <p className="text-xs text-muted-foreground">
                  +12% increase
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Views
                </CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12.5K</div>
                <p className="text-xs text-muted-foreground">
                  +18.2% from last week
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Trending Sounds
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+573</div>
                <p className="text-xs text-muted-foreground">
                  +201 this week
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <DashboardCharts />
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Trending Sounds</CardTitle>
                <CardDescription>
                  Top performing sounds this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : trendingSounds.length > 0 ? (
                  <div className="space-y-4">
                    {trendingSounds.map((sound) => (
                      <SoundCard 
                        key={sound.id}
                        sound={sound}
                        variant="horizontal"
                        showStats={true}
                        showTrend={true}
                        className="hover:bg-muted/50 transition-colors"
                      />
                    ))}
                    <div className="pt-2">
                      <Link href="/sound-trends">
                        <Button variant="outline" className="w-full">
                          View All Sounds
                          <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <Music className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No trending sounds found</p>
                    <Link href="/sound-trends" className="mt-4">
                      <Button variant="outline" size="sm">
                        Browse Sound Library
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Recent Templates</CardTitle>
                <CardDescription>
                  You created 5 templates this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-12 h-12 rounded bg-muted mr-4 flex-shrink-0 flex items-center justify-center">
                        <Bookmark className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium">Summer Promo Template</div>
                        <div className="text-sm text-muted-foreground">Updated 2d ago</div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Link href="/dashboard-view/template-library">
                    <Button variant="outline" className="w-full">
                      View All Templates
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Analytics</CardTitle>
                <CardDescription>
                  Performance insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 mr-4 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </div>
                      <span>Engagement Rate</span>
                    </div>
                    <span className="font-medium">24.8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-green-100 mr-4 flex items-center justify-center">
                        <Music className="h-4 w-4 text-green-600" />
                      </div>
                      <span>Sound Adoption</span>
                    </div>
                    <span className="font-medium">+18.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-100 mr-4 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                      </div>
                      <span>Trend Effectiveness</span>
                    </div>
                    <span className="font-medium">92%</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/dashboard-view/analytics/trend-insights">
                    <Button variant="outline" className="w-full">
                      View Full Analytics
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-muted mr-4 flex-shrink-0 flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">You created a new template</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-muted mr-4 flex-shrink-0 flex items-center justify-center">
                      <Music className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Added 2 sounds to your library</p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-muted mr-4 flex-shrink-0 flex items-center justify-center">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Updated account settings</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sounds" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading ? (
              Array(8).fill(0).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-muted"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-muted rounded mt-4"></div>
                  </CardContent>
                </Card>
              ))
            ) : trendingSounds.length > 0 ? (
              trendingSounds.map((sound) => (
                <SoundCard 
                  key={sound.id}
                  sound={sound}
                  variant="card"
                  showStats={true}
                  className="h-full"
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center h-64 text-center">
                <Music className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No sounds available</h3>
                <p className="text-muted-foreground max-w-md mb-4">
                  Sounds will appear here once you start adding them to your library
                </p>
                <Link href="/sound-trends">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Sounds
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
